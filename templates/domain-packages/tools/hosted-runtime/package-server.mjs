import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createFetchRequestHandler,
  createHostedRuntime,
} from "./runtime/server/hosted-runtime.mjs";

const root = import.meta.dirname;
const packageRoot = resolve(process.env.PACKAGE_ROOT ?? join(root, ".."));
const clientRoot = join(root, "client");
const dataRoot = process.env.DATA_ROOT ? resolve(process.env.DATA_ROOT) : null;

async function importIfPresent(filePath) {
  if (!existsSync(filePath)) return null;
  return import(pathToFileURL(filePath).href);
}

const configModule = await importIfPresent(join(root, "runtime", "hosted-runtime-config.mjs"));
configModule?.prepareEnvironment?.({ dataRoot, packageRoot, root });

const packageJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
const contract = JSON.parse(readFileSync(join(packageRoot, "contract.json"), "utf8"));
const capabilityIndexPath = join(packageRoot, "capabilities", "index.json");
if (!existsSync(capabilityIndexPath)) {
  throw new Error(`capability catalog is missing: ${capabilityIndexPath}`);
}
const capabilityIndex = JSON.parse(readFileSync(capabilityIndexPath, "utf8"));
if (!Array.isArray(capabilityIndex.capabilities)) {
  throw new Error("capability catalog index.capabilities must be an array");
}
const capabilityFiles = capabilityIndex.capabilities;
const declaredCapabilities = capabilityFiles.map((fileName) => {
  if (
    typeof fileName !== "string" ||
    basename(fileName) !== fileName ||
    !fileName.endsWith(".json")
  ) {
    throw new Error(`capability catalog contains an unsafe file name: ${String(fileName)}`);
  }
  const capability = JSON.parse(readFileSync(join(packageRoot, "capabilities", fileName), "utf8"));
  if (!capability || typeof capability.id !== "string" || capability.id.length === 0) {
    throw new Error(`capability descriptor is missing an id: ${fileName}`);
  }
  if (!capability.access || typeof capability.access !== "object") {
    throw new Error(`capability descriptor is missing access metadata: ${capability.id}`);
  }
  return capability;
});
const builtInCapabilities = [
  {
    id: "system.health",
    kind: "system",
    title: "Runtime health",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    outputSchema: { type: "object", additionalProperties: true },
    effects: { read: true, write: false, delete: false },
    idempotency: "natural",
    access: { web: true, agent: true, host: true },
    risk: "low",
  },
  {
    id: "system.selfCheck",
    kind: "system",
    title: "Structured self check",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    outputSchema: { type: "object", additionalProperties: true },
    effects: { read: true, write: false, delete: false },
    idempotency: "natural",
    access: { web: true, agent: true, host: true },
    risk: "low",
  },
  {
    id: "system.deleteAllData",
    kind: "system",
    title: "Delete all package data",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    outputSchema: { type: "object", additionalProperties: true },
    effects: { read: false, write: false, delete: true },
    idempotency: "natural",
    access: { web: false, agent: false, host: true },
    risk: "critical",
  },
];
const builtInById = new Map(builtInCapabilities.map((capability) => [capability.id, capability]));
const declaredIds = new Set(declaredCapabilities.map((capability) => capability.id));
const capabilities = [
  ...declaredCapabilities.map((capability) => {
    const builtIn = builtInById.get(capability.id);
    return builtIn
      ? {
          ...capability,
          access: builtIn.access,
          risk: builtIn.risk,
          effects: builtIn.effects,
          idempotency: builtIn.idempotency,
        }
      : capability;
  }),
  ...builtInCapabilities.filter((capability) => !declaredIds.has(capability.id)),
];

const serviceModule = await importIfPresent(
  join(root, "server", "assets", "capability-service.mjs"),
);
const service = serviceModule
  ? {
      execute: serviceModule.executeCapability,
      close: serviceModule.close,
      ...(typeof serviceModule.stateProvider === "function"
        ? { stateProvider: serviceModule.stateProvider }
        : {}),
    }
  : {
      async execute(capabilityId) {
        throw Object.assign(new Error(`capability is not implemented: ${capabilityId}`), {
          code: "capability_not_implemented",
          category: "capability",
          retryable: false,
        });
      },
    };

const tanstackModule = await import(pathToFileURL(join(root, "server", "server.js")).href);
const tanstackServer = tanstackModule.default;
if (!tanstackServer || typeof tanstackServer.fetch !== "function") {
  throw new Error("server/server.js must export a default fetch server");
}
const artifactModule = await importIfPresent(join(root, "artifacts.mjs"));
const artifactHandler = artifactModule?.handleArtifactRequest;

const requestHandler = createFetchRequestHandler(async (request) => {
  const artifactResponse = artifactHandler ? await artifactHandler(request) : null;
  return artifactResponse ?? tanstackServer.fetch(request);
});

const runtime = createHostedRuntime({
  requestHandler,
  service,
  packageRoot,
  clientRoot,
  dataRoot,
  packageJson,
  contract,
  capabilityIndex,
  capabilities,
  ...(configModule?.runtimeOptions ?? {}),
});

const state = runtime.run();
configModule?.afterStart?.({ runtime, state, packageRoot, root });
