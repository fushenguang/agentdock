import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import {
  accessSync,
  constants,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { VAULT_PROTOCOL_ENV_NAMES } from "./vault-supply.mjs";

// Vault 拉取链（spec 0.8.0 RUNTIME-059）与协议键名单随 vault-supply.mjs
// 一处维护；此处 re-export 让包业务代码统一从 hosted-runtime shim import。
export { createVaultSupply, VAULT_PROTOCOL_ENV_NAMES } from "./vault-supply.mjs";

const BROWSER_COOKIE_NAME = "thefoolai_browser_session";
const BOOTSTRAP_CODE_TTL_MS = 60_000;
const HEARTBEAT_INTERVAL_MS = 5_000;
const WEB_CHANNEL_VERSION = "1.1.0";
const WEB_EXECUTION_VERSION = "1.0.0";
const WEB_CHANNEL_PATH = "/_thefoolai/v1/web-channel";
const WEB_CHANNEL_INVOKE_PATH = "/_thefoolai/v1/web-channel/invoke";
const WEB_CHANNEL_HEARTBEAT_MS = 15_000;
const PROTOCOL_CAPABILITY_IDS = new Set([
  "system.health",
  "system.selfCheck",
  "system.deleteAllData",
  "web.surface.describe",
  "web.surface.state",
]);

function parseSemver(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(value);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1;
  }
  return 0;
}

function satisfiesExplicitRange(version, range) {
  const parsedVersion = parseSemver(version);
  if (!parsedVersion || typeof range !== "string" || range.length === 0) return false;
  const tokens = range.trim().split(/\s+/);
  for (const token of tokens) {
    if (token === "*") continue;
    if (!/^(>=|>|<=|<|=)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(token)) return false;
    const match = /^(>=|>|<=|<|=)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(token);
    const comparison = compareSemver(parsedVersion, parseSemver(match[2]));
    const operator = match[1] ?? "=";
    if (operator === "=" && comparison !== 0) return false;
    if (operator === ">" && comparison <= 0) return false;
    if (operator === ">=" && comparison < 0) return false;
    if (operator === "<" && comparison >= 0) return false;
    if (operator === "<=" && comparison > 0) return false;
  }
  return true;
}

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function constantTimeEqual(left, right) {
  if (
    typeof left !== "string" ||
    typeof right !== "string" ||
    left.length === 0 ||
    right.length === 0
  ) {
    return false;
  }
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function responseJson(response, statusCode, payload, headers = {}) {
  const body = `${JSON.stringify(payload)}\n`;
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("content-length", Buffer.byteLength(body));
  response.setHeader("cache-control", "no-store");
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.end(body);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function responseText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.statusCode = statusCode;
  response.setHeader("content-type", contentType);
  response.setHeader("cache-control", "no-store");
  response.end(body);
}

function readJsonBody(request, maximumBytes = 2 * 1024 * 1024) {
  return new Promise((resolveBody, rejectBody) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maximumBytes) {
        rejectBody(
          Object.assign(new Error("request body is too large"), { code: "request_too_large" }),
        );
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (chunks.length === 0) return resolveBody({});
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        rejectBody(
          Object.assign(new Error("request body must be valid JSON"), { code: "invalid_json" }),
        );
      }
    });
    request.on("error", rejectBody);
  });
}

function getCookie(request, name) {
  const raw = request.headers.cookie;
  if (typeof raw !== "string" || raw.length === 0) return null;
  for (const part of raw.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key !== name) continue;
    try {
      return decodeURIComponent(value.join("="));
    } catch {
      return null;
    }
  }
  return null;
}

function requestHostname(request) {
  const host = request.headers.host;
  if (typeof host !== "string" || host.length === 0) return null;
  try {
    return new URL(`http://${host}`).hostname;
  } catch {
    return null;
  }
}

export function isLoopbackHostname(hostname) {
  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

function isLoopbackRequest(request) {
  return isLoopbackHostname(requestHostname(request));
}

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (typeof origin !== "string" || origin.length === 0) return true;
  try {
    return isLoopbackHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function isDocumentRequest(request, pathname) {
  if (request.method !== "GET" || pathname.startsWith("/_thefoolai/")) return false;
  const accept = request.headers.accept;
  return typeof accept === "string" && accept.includes("text/html");
}

function isInside(root, candidate) {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  return (
    resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(`${resolvedRoot}${sep}`)
  );
}

function capabilityError(error) {
  if (error?.capabilityError && typeof error.capabilityError === "object")
    return error.capabilityError;
  if (error?.error && typeof error.error === "object") return error.error;
  return {
    category: typeof error?.category === "string" ? error.category : "capability",
    code: typeof error?.code === "string" ? error.code : "capability_failed",
    message: error instanceof Error ? error.message : String(error),
    retryable: error?.retryable === true,
  };
}

function errorEnvelope(requestId, error, capabilityId, protocolVersion = "=2.0.0") {
  return {
    protocolVersion,
    requestId,
    ...(capabilityId ? { capabilityId } : {}),
    error: capabilityError(error),
  };
}

const FORBIDDEN_HOSTED_ENV_NAMES = new Set([
  "AGENT_BASE_URL",
  "AGENT_API_KEY",
  "AGENT_MODEL",
  "MINIMAX_BASE_URL",
  "MINIMAX_TTS_KEY",
  "MINIMAX_TTS_MODEL",
  "MINIMAX_TTS_VOICE_ID",
  "MINIMAX_STT_MODEL",
  "VOICE_TTS_PROVIDERS",
  "VOICE_API_KEY",
  "OPENAI_API_KEY",
]);

const SECRET_LIKE_HOSTED_ENV_NAME = /(?:^|_)(?:API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)(?:_|$)/;

// Declared env names (spec 0.7.0 contract requiredEnv/optionalEnv) are the only
// App-supplied credential channel; undeclared secret-like names stay forbidden.
// VAULT_TOKEN/VAULT_ENDPOINT (spec 0.8.0 protocol keys 7/8) are host-assigned
// vault supply keys: exempted ahead of both checks — VAULT_TOKEN matches the
// SECRET_LIKE *_TOKEN pattern, so the exemption is what lets the App inject it
// without re-triggering the 0.5.3-style startup rejection.
export function validateHostedProcessEnvironment(environment, declaredEnvNames = new Set()) {
  for (const name of Object.keys(environment)) {
    if (declaredEnvNames.has(name)) continue;
    if (VAULT_PROTOCOL_ENV_NAMES.has(name)) continue;
    if (FORBIDDEN_HOSTED_ENV_NAMES.has(name) || SECRET_LIKE_HOSTED_ENV_NAME.test(name)) {
      throw new Error(`${name} must not be present in a hosted package Web process`);
    }
  }
}

function assertHostedEnvironment(hosted, environment, declaredEnvNames) {
  if (!hosted) return;
  validateHostedProcessEnvironment(environment, declaredEnvNames);
}

function normalizeRequestId(value) {
  return typeof value?.requestId === "string" && value.requestId.length > 0
    ? value.requestId
    : randomUUID();
}

function isSafeRequestId(value) {
  return typeof value === "string" && /^[A-Za-z0-9._-]+$/.test(value);
}

function copyResponseHeaders(fetchResponse, response) {
  for (const [name, value] of fetchResponse.headers) {
    if (name.toLowerCase() === "set-cookie") continue;
    response.setHeader(name, value);
  }
  if (typeof fetchResponse.headers.getSetCookie === "function") {
    const setCookies = fetchResponse.headers.getSetCookie();
    if (setCookies.length > 0) response.setHeader("set-cookie", setCookies);
  }
}

export function createFetchRequestHandler(fetchHandler) {
  if (typeof fetchHandler !== "function") throw new Error("fetchHandler is required");
  return async function handleFetchRequest(request, response) {
    const host = Array.isArray(request.headers.host)
      ? request.headers.host[0]
      : request.headers.host;
    const url = `http://${host ?? "127.0.0.1"}${request.url ?? "/"}`;
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const init = {
      method: request.method ?? "GET",
      headers: new Headers(request.headers),
    };
    if (hasBody) {
      init.body = Readable.toWeb(request);
      init.duplex = "half";
    }
    const fetchResponse = await fetchHandler(new Request(url, init));
    response.statusCode = fetchResponse.status;
    copyResponseHeaders(fetchResponse, response);
    if (fetchResponse.body === null) {
      response.end();
      return;
    }
    await pipeline(Readable.fromWeb(fetchResponse.body), response);
  };
}

export function createHostedRuntime({
  requestHandler,
  repository = null,
  service,
  packageRoot,
  clientRoot,
  dataRoot,
  packageJson,
  contract,
  capabilityIndex,
  capabilities,
  logger = console,
  hosted = process.parentPort !== undefined && process.parentPort !== null,
  parentPort: parentPortOption,
  port: portOption,
  hostname: hostnameOption,
  heartbeatIntervalMs = HEARTBEAT_INTERVAL_MS,
  hostCapabilityTimeoutMs = 30_000,
  hostCapabilityMaxTimeoutMs = 600_000,
  stateProviderTimeoutMs = 2_000,
  webActionTimeoutMs = 60_000,
  environment = process.env,
  exit = (code) => process.exit(code),
}) {
  if (typeof requestHandler !== "function") throw new Error("requestHandler is required");
  if (repository !== null && typeof repository.close !== "function") {
    throw new Error("repository.close must be a function when repository is provided");
  }
  if (!service || typeof service.execute !== "function")
    throw new Error("service.execute is required");
  if (!packageRoot || !clientRoot) throw new Error("packageRoot and clientRoot are required");

  const resolvedPackageRoot = resolve(packageRoot);
  const packageId = contract.id;
  const expectedPackageName = `@thefoolai/domain-package-${packageId}`;
  const declaredEnvNames = new Set([
    ...(Array.isArray(contract.requiredEnv) ? contract.requiredEnv : []),
    ...(Array.isArray(contract.optionalEnv) ? contract.optionalEnv : []),
  ]);
  assertHostedEnvironment(hosted, environment, declaredEnvNames);
  const resolvedClientRoot = resolve(clientRoot);
  const resolvedDataRoot = dataRoot ? resolve(dataRoot) : null;
  const webSurfacePath = join(resolvedPackageRoot, "agent", "web-surface.json");
  const webAgentSurface = existsSync(webSurfacePath)
    ? JSON.parse(readFileSync(webSurfacePath, "utf8"))
    : { routes: [] };
  const webRoutesById = new Map(
    (Array.isArray(webAgentSurface.routes) ? webAgentSurface.routes : [])
      .filter((route) => route && typeof route.routeId === "string")
      .map((route) => [route.routeId, route]),
  );
  const packageVersion = packageJson.version;
  const appVersion = environment.APP_VERSION ?? "development";
  const requestedPackageVersion = environment.PACKAGE_VERSION;
  if (requestedPackageVersion && requestedPackageVersion !== packageVersion) {
    throw new Error(
      `PACKAGE_VERSION ${requestedPackageVersion} does not match package.json ${packageVersion}`,
    );
  }
  if (hosted && !resolvedDataRoot) {
    throw new Error("DATA_ROOT is required in hosted package Web mode");
  }
  if (resolvedDataRoot && isInside(resolvedPackageRoot, resolvedDataRoot)) {
    throw new Error("DATA_ROOT must not be inside PACKAGE_ROOT");
  }
  if (resolvedDataRoot) mkdirSync(resolvedDataRoot, { recursive: true });

  const port = Number(portOption ?? environment.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT must be a valid TCP port, received ${environment.PORT}`);
  }
  const hostname = hostnameOption ?? environment.HOST ?? "127.0.0.1";
  if (hostname !== "127.0.0.1") {
    throw new Error("HOST must be 127.0.0.1; package Web is loopback-only");
  }

  const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]));
  const pageBoundCapabilities = loadPageBoundCapabilities();
  const protocolVersion = capabilityIndex.protocolVersion ?? "=2.0.0";
  const parentPort = hosted ? (parentPortOption ?? process.parentPort) : null;
  if (
    hosted &&
    (typeof parentPort?.on !== "function" || typeof parentPort?.postMessage !== "function")
  ) {
    throw new Error("a parentPort message channel is required in hosted mode");
  }
  const bootstrapCodes = new Map();
  const activeHostCapabilityRequests = new Map();
  let httpServer = null;
  let heartbeatTimer = null;
  let repositoryClosePromise = null;
  let lifecycleState = "starting";
  let maintenanceMode = false;
  let started = false;
  let stopped = false;
  let hostToken = "";
  let agentToken = "";
  let browserToken = "";
  let runtimeId = "";
  let hostSupportedCapabilities = new Map();
  let hostCapabilityNegotiation = null;
  let activeWebPage = null;
  const pendingWebInvocations = new Map();
  const webChannelCounters = {
    pageConnects: 0,
    pageSupersedes: 0,
    pageUnmounts: 0,
    invocations: 0,
    results: 0,
    errors: 0,
    timeouts: 0,
    cancels: 0,
  };
  let lastWebInvocation = null;

  /**
   * WS-8: the optional package declaration that routes capability execution into the connected
   * page. Validated once, fail closed — a malformed file, an unknown capability id or a
   * protocol-owned id in `pageBound` is a startup error, never a silent fallback to Node.
   */
  function loadPageBoundCapabilities() {
    const declarationPath = join(resolvedPackageRoot, "agent", "web-execution.json");
    if (!existsSync(declarationPath)) return new Set();
    let declaration;
    try {
      declaration = JSON.parse(readFileSync(declarationPath, "utf8"));
    } catch (error) {
      throw new Error(
        `invalid agent/web-execution.json: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (typeof declaration !== "object" || declaration === null || Array.isArray(declaration)) {
      throw new Error("invalid agent/web-execution.json: root must be an object");
    }
    const unknownKeys = Object.keys(declaration).filter(
      (key) => key !== "webExecutionVersion" && key !== "pageBound",
    );
    if (unknownKeys.length > 0) {
      throw new Error(`invalid agent/web-execution.json: unknown keys: ${unknownKeys.join(", ")}`);
    }
    if (declaration.webExecutionVersion !== WEB_EXECUTION_VERSION) {
      throw new Error(
        `unsupported agent/web-execution.json webExecutionVersion: ${String(
          declaration.webExecutionVersion,
        )}`,
      );
    }
    if (!Array.isArray(declaration.pageBound)) {
      throw new Error("invalid agent/web-execution.json: pageBound must be an array");
    }
    const pageBound = new Set();
    for (const capabilityId of declaration.pageBound) {
      if (typeof capabilityId !== "string" || capabilityId.length === 0) {
        throw new Error(
          "invalid agent/web-execution.json: pageBound entries must be non-empty strings",
        );
      }
      if (!capabilityById.has(capabilityId)) {
        throw new Error(
          `invalid agent/web-execution.json: pageBound references unknown capability: ${capabilityId}`,
        );
      }
      if (PROTOCOL_CAPABILITY_IDS.has(capabilityId)) {
        throw new Error(
          `invalid agent/web-execution.json: protocol capability cannot be page-bound: ${capabilityId}`,
        );
      }
      if (pageBound.has(capabilityId)) {
        throw new Error(
          `invalid agent/web-execution.json: duplicate pageBound entry: ${capabilityId}`,
        );
      }
      pageBound.add(capabilityId);
    }
    return pageBound;
  }

  function sendToHost(message) {
    parentPort?.postMessage(message);
  }

  async function closeRepository() {
    repositoryClosePromise ??= (async () => {
      await repository?.close?.();
      await service.close?.();
    })();
    return repositoryClosePromise;
  }

  function pruneBootstrapCodes(now = Date.now()) {
    for (const [code, expiresAt] of bootstrapCodes) {
      if (expiresAt <= now) bootstrapCodes.delete(code);
    }
  }

  function addBootstrapCode(code) {
    if (typeof code !== "string" || code.length === 0) return false;
    pruneBootstrapCodes();
    bootstrapCodes.set(code, Date.now() + BOOTSTRAP_CODE_TTL_MS);
    return true;
  }

  function consumeBootstrapCode(code) {
    if (typeof code !== "string" || code.length === 0) return false;
    pruneBootstrapCodes();
    for (const [candidate] of bootstrapCodes) {
      if (constantTimeEqual(code, candidate)) {
        bootstrapCodes.delete(candidate);
        return true;
      }
    }
    return false;
  }

  function runtimeErrorEnvelope(requestId, error, capabilityId) {
    return errorEnvelope(requestId, error, capabilityId, protocolVersion);
  }

  function resolveAudience(request) {
    if (!hosted) return "browser";
    if (constantTimeEqual(request.headers["x-thefoolai-host-token"], hostToken)) return "host";
    if (constantTimeEqual(request.headers["x-thefoolai-agent-token"], agentToken)) return "agent";
    const authorization = request.headers.authorization;
    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
      const token = authorization.slice("Bearer ".length);
      if (constantTimeEqual(token, hostToken)) return "host";
      if (constantTimeEqual(token, agentToken)) return "agent";
    }
    if (constantTimeEqual(getCookie(request, BROWSER_COOKIE_NAME), browserToken)) return "browser";
    return null;
  }

  /**
   * The host forwards a granted user confirmation as `context.confirmation` on invoke. It is an
   * optional pass-through: only a well-formed `{ granted: true }` is forwarded, everything else is
   * dropped so a malformed context can never look like consent.
   * Trust: the grant is set by the App after in-session user confirmation (never from model-supplied
   * tool arguments) and only the App holds the agent token, so it is honoured for `agent` only.
   */
  function normalizeConfirmation(context, audience) {
    if (audience !== "agent") return undefined;
    const confirmation = context && typeof context === "object" ? context.confirmation : undefined;
    if (!confirmation || typeof confirmation !== "object" || confirmation.granted !== true) {
      return undefined;
    }
    return Object.freeze({
      granted: true,
      ...(typeof confirmation.at === "string" ? { at: confirmation.at } : {}),
    });
  }

  function normalizeInvocationContext(context, audience) {
    const source = context && typeof context === "object" ? context : {};
    const normalized = { audience };
    for (const key of ["bindingId", "turnId", "toolCallId", "origin"]) {
      if (typeof source[key] === "string" && source[key].length > 0) normalized[key] = source[key];
    }
    const confirmation = normalizeConfirmation(source, audience);
    if (confirmation !== undefined) normalized.confirmation = confirmation;
    return Object.freeze(normalized);
  }

  function visibleCapabilities(audience) {
    if (audience === "host") return capabilities;
    if (audience === "agent") {
      return capabilities.filter((capability) => capability.access?.agent === true);
    }
    if (audience === "browser") {
      return capabilities.filter((capability) => capability.access?.web === true);
    }
    return [];
  }

  function capabilityAllows(capability, audience) {
    if (audience === "host") return capability.access?.host === true;
    if (audience === "agent") return capability.access?.agent === true;
    if (audience === "browser") return capability.access?.web === true;
    return false;
  }

  function selfCheck() {
    const checks = [];
    const add = (id, ok, message) => checks.push({ id, status: ok ? "ok" : "fail", message });
    const addStatus = (id, status, message) => checks.push({ id, status, message });
    add(
      "identity",
      contract.id === packageId &&
        packageJson.name === expectedPackageName &&
        packageJson.version === packageVersion,
      "contract and package identity agree",
    );
    add(
      "agent-surface",
      existsSync(join(resolvedPackageRoot, "agent", "surface.json")) &&
        existsSync(join(resolvedPackageRoot, "agent", "web-surface.json")),
      "Package Agent Surface and Web Agent Surface are present",
    );
    add(
      "capability-manifest",
      capabilities.length > 0 &&
        capabilityById.size === capabilities.length &&
        capabilityById.get("system.health")?.access?.host === true &&
        capabilityById.get("system.deleteAllData")?.risk === "critical",
      "capability manifest is loaded",
    );
    add(
      "truth-declaration",
      existsSync(join(resolvedPackageRoot, "truth.json")),
      "truth declaration is present",
    );
    add(
      "upgrade-declaration",
      existsSync(join(resolvedPackageRoot, "upgrade.json")),
      "upgrade declaration is present",
    );
    if (resolvedDataRoot && existsSync(resolvedDataRoot)) {
      try {
        accessSync(resolvedDataRoot, constants.R_OK | constants.W_OK);
        add("data-root", true, "DATA_ROOT is readable and writable");
      } catch {
        add("data-root", false, "DATA_ROOT is not readable and writable");
      }
    } else {
      add("data-root", false, "DATA_ROOT is not configured or does not exist");
    }
    add(
      "host-capability-bridge",
      !hosted || typeof globalThis.THEFOOLAI_HOST_CAPABILITY_BRIDGE === "function",
      hosted
        ? "parentPort host capability bridge is available"
        : "standalone mode does not require a host capability bridge",
    );
    if (hosted) {
      const required = capabilityIndex.requiredHostCapabilities ?? [];
      const optional = capabilityIndex.optionalHostCapabilities ?? [];
      const missingRequired = [];
      const missingOptional = [];
      const normalize = (requirement) =>
        typeof requirement === "string"
          ? { id: requirement, range: "*" }
          : { id: requirement.id, range: requirement.range };
      for (const requirement of required.map(normalize)) {
        const support = hostSupportedCapabilities.get(requirement.id);
        if (!support || !satisfiesExplicitRange(support.contractVersion, requirement.range)) {
          missingRequired.push(requirement.id);
        }
      }
      for (const requirement of optional.map(normalize)) {
        const support = hostSupportedCapabilities.get(requirement.id);
        if (!support || !satisfiesExplicitRange(support.contractVersion, requirement.range)) {
          missingOptional.push(requirement.id);
        }
      }
      if (missingRequired.length > 0) {
        addStatus(
          "host-capability-requirements",
          "fail",
          `missing required: ${missingRequired.join(", ")}`,
        );
      } else if (missingOptional.length > 0) {
        addStatus(
          "host-capability-requirements",
          "degraded",
          `missing optional: ${missingOptional.join(", ")}`,
        );
      } else {
        addStatus(
          "host-capability-requirements",
          "ok",
          "required and optional host capabilities are supported",
        );
      }
    } else {
      addStatus(
        "host-capability-requirements",
        "ok",
        "standalone mode does not negotiate host capabilities",
      );
    }
    add(
      "web-execution",
      true,
      pageBoundCapabilities.size > 0
        ? `web execution declaration loaded (${pageBoundCapabilities.size} page-bound capabilities)`
        : "no page-bound capabilities declared",
    );
    return {
      ok: checks.every((check) => check.status !== "fail"),
      degraded: checks.some((check) => check.status === "degraded"),
      checks,
    };
  }

  function healthPayload() {
    const check = selfCheck();
    let status = lifecycleState;
    if (lifecycleState === "ready" && !check.ok) status = "not_ready";
    else if (lifecycleState === "ready" && check.degraded) status = "degraded";
    return {
      status,
      packageId: contract.id,
      packageVersion,
      appVersion,
      protocolVersion: capabilityIndex.protocolVersion,
      specVersion: contract.constraints?.specVersion ?? null,
      contentVersion: contract.constraints?.contentVersion ?? null,
      checks: check.checks,
    };
  }

  /**
   * Bridge entry (`globalThis.THEFOOLAI_HOST_CAPABILITY_BRIDGE`).
   * `options.timeoutMs` lets a caller with a legitimately long call (e.g. an agent turn)
   * override the default timeout; it must be a positive finite number and is clamped to
   * `hostCapabilityMaxTimeoutMs`. An AbortSignal only cancels, it never disables the timeout.
   */
  function resolveHostCapabilityTimeoutMs(options) {
    const requested = options?.timeoutMs;
    if (requested === undefined) return hostCapabilityTimeoutMs;
    if (typeof requested !== "number" || !Number.isFinite(requested) || requested <= 0) {
      throw new TypeError("host capability timeoutMs must be a positive finite number");
    }
    return Math.min(requested, hostCapabilityMaxTimeoutMs);
  }

  function requestHostCapability(capabilityId, input, signal, onEvent, options) {
    if (!hosted || typeof capabilityId !== "string" || capabilityId.length === 0) {
      return Promise.reject(new Error("host capability bridge is not available"));
    }
    let effectiveTimeoutMs;
    try {
      effectiveTimeoutMs = resolveHostCapabilityTimeoutMs(options);
    } catch (error) {
      return Promise.reject(error);
    }
    return new Promise((resolvePromise, rejectPromise) => {
      const requestId = randomUUID();
      let timeout = null;
      const pending = {
        resolve: resolvePromise,
        reject: rejectPromise,
        signal,
        onAbort: null,
        onEvent: typeof onEvent === "function" ? onEvent : null,
        timeout: null,
      };
      const cleanup = () => {
        activeHostCapabilityRequests.delete(requestId);
        if (timeout !== null) clearTimeout(timeout);
        if (signal && pending.onAbort) {
          signal.removeEventListener("abort", pending.onAbort);
        }
      };
      activeHostCapabilityRequests.set(requestId, pending);
      timeout = setTimeout(() => {
        if (!activeHostCapabilityRequests.has(requestId)) return;
        cleanup();
        rejectPromise(
          Object.assign(new Error("host capability request timed out"), {
            code: "host_capability_timeout",
            category: "capability",
            retryable: true,
          }),
        );
      }, effectiveTimeoutMs);
      timeout.unref?.();
      pending.timeout = timeout;
      if (signal) {
        pending.onAbort = () => {
          cleanup();
          rejectPromise(
            Object.assign(new Error("host capability request was cancelled"), {
              name: "AbortError",
            }),
          );
        };
        if (signal.aborted) {
          pending.onAbort();
          return;
        }
        signal.addEventListener("abort", pending.onAbort, { once: true });
      }
      sendToHost({ type: "host:capability.request", requestId, capabilityId, payload: input });
    });
  }

  function handleHostCapabilityResponse(message) {
    const pending = activeHostCapabilityRequests.get(message.requestId);
    if (!pending) return;
    activeHostCapabilityRequests.delete(message.requestId);
    if (pending.timeout !== null) clearTimeout(pending.timeout);
    if (pending.signal && pending.onAbort) {
      pending.signal.removeEventListener("abort", pending.onAbort);
    }
    if (message.ok === true) {
      pending.resolve(message.result);
      return;
    }
    const error =
      message.error && typeof message.error === "object"
        ? message.error
        : {
            category: "capability",
            code: "host_capability_failed",
            message: "host capability failed",
            retryable: false,
          };
    const failure = new Error(error.message ?? "host capability failed");
    failure.capabilityError = error;
    pending.reject(failure);
  }

  function handleHostEvent(message) {
    if (!message || typeof message.requestId !== "string") return;
    const pending = activeHostCapabilityRequests.get(message.requestId);
    if (pending?.onEvent) pending.onEvent(message.event);
  }

  // ---------------------------------------------------------------------
  // WS-8 · Web Channel: the shared runtime -> page execution path.
  //
  // Downlink (runtime -> page, SSE): hello | invoke | cancel | superseded
  // (statePush and artifact are reserved, additive-only extensions). Uplink
  // (page -> runtime, JSON POST): result | progress | error. The message set
  // is versioned; a minor version may only add messages or optional fields.
  // ---------------------------------------------------------------------

  function writeWebChannelEvent(page, event) {
    if (!page || page.response.writableEnded || page.response.destroyed) return false;
    try {
      page.response.write(`data: ${JSON.stringify(event)}\n\n`);
      return true;
    } catch {
      return false;
    }
  }

  function webChannelState() {
    return {
      channelVersion: WEB_CHANNEL_VERSION,
      pageBoundCapabilities: pageBoundCapabilities.size,
      pageConnected: activeWebPage !== null,
      pageRouteId: activeWebPage?.routeId ?? null,
      pendingInvocations: pendingWebInvocations.size,
      counters: { ...webChannelCounters },
      lastInvocation: lastWebInvocation,
    };
  }

  const RUNTIME_STATE_KEYS = new Set(["readiness", "pageConnected", "webChannel"]);

  function unavailable(reason) {
    return { unavailable: reason };
  }

  function stateCharCount(value) {
    try {
      const serialized = JSON.stringify(value);
      return typeof serialized === "string"
        ? Array.from(serialized).length
        : Number.POSITIVE_INFINITY;
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }

  /**
   * RUNTIME-060 / CONSUME-005: keep the state projection bounded and make every
   * declared agent-visible key present. Oversize values become a standard
   * additive reason instead of growing the Agent context without a bound.
   */
  function compactState(state) {
    const compact = {};
    for (const [key, value] of Object.entries(state)) {
      compact[key] = stateCharCount(value) <= 512 ? value : unavailable("value_too_large");
    }
    if (stateCharCount(compact) <= 2_000) return compact;
    for (const key of Object.keys(compact)) {
      if (RUNTIME_STATE_KEYS.has(key)) continue;
      compact[key] = unavailable("state_too_large");
      if (stateCharCount(compact) <= 2_000) return compact;
    }
    return compact;
  }

  async function resolveWebSurfaceState(input, audience) {
    const requestedRouteId =
      typeof input?.routeId === "string" && input.routeId.length > 0 ? input.routeId : null;
    const routeId = requestedRouteId ?? activeWebPage?.routeId ?? null;
    const route = routeId === null ? null : webRoutesById.get(routeId);
    if (routeId !== null && route === undefined) {
      throw Object.assign(new Error(`unknown route: ${routeId}`), {
        code: "route_not_found",
        category: "business",
        retryable: false,
      });
    }

    const state = {
      readiness: lifecycleState,
      pageConnected: activeWebPage !== null,
      webChannel: webChannelState(),
    };
    if (!route) return { ready: lifecycleState === "ready", routeId: null, state: compactState(state) };

    const packageStates = Array.isArray(route.state)
      ? route.state.filter((entry) => entry?.agentVisible === true && typeof entry.key === "string")
      : [];
    const serverKeys = packageStates
      .filter((entry) => entry.source === "server")
      .map((entry) => entry.key);
    let provided = null;
    let providerError = false;
    if (serverKeys.length > 0 && typeof service.stateProvider === "function") {
      let timeout = null;
      try {
        const providerPromise = Promise.resolve(
          service.stateProvider(
            Object.freeze({ routeId, keys: Object.freeze(serverKeys) }),
            Object.freeze({ audience }),
          ),
        );
        const timeoutPromise = new Promise((_, rejectProvider) => {
          timeout = setTimeout(
            () => rejectProvider(new Error("state provider timed out")),
            stateProviderTimeoutMs,
          );
          timeout.unref?.();
        });
        provided = await Promise.race([providerPromise, timeoutPromise]);
        if (!provided || typeof provided !== "object" || Array.isArray(provided)) {
          providerError = true;
          provided = null;
        }
      } catch {
        providerError = true;
        provided = null;
      } finally {
        if (timeout !== null) clearTimeout(timeout);
      }
    }

    for (const entry of packageStates) {
      state[entry.key] = resolvePackageState(entry, routeId, provided, providerError);
    }
    return { ready: lifecycleState === "ready", routeId, state: compactState(state) };
  }

  function resolvePackageState(entry, routeId, provided, providerError) {
    if (entry.source === "server") {
      if (providerError) return unavailable("provider_error");
      if (!provided || !Object.hasOwn(provided, entry.key)) return unavailable("not_provided");
      return provided[entry.key];
    }
    if (entry.source !== "page") return unavailable("not_provided");
    if (activeWebPage === null) return unavailable("page_not_connected");
    if (activeWebPage.routeId !== routeId) return unavailable("route_not_active");
    if (!activeWebPage.state.has(entry.key)) return unavailable("not_published");
    return activeWebPage.state.get(entry.key);
  }

  function settleWebInvocation(requestId, settle) {
    const pending = pendingWebInvocations.get(requestId);
    if (!pending) return null;
    pendingWebInvocations.delete(requestId);
    if (pending.timeout !== null) clearTimeout(pending.timeout);
    settle(pending);
    return pending;
  }

  function failPendingWebInvocations(code, message, page = null) {
    for (const requestId of [...pendingWebInvocations.keys()]) {
      if (page !== null && pendingWebInvocations.get(requestId)?.page !== page) continue;
      settleWebInvocation(requestId, (pending) => {
        pending.reject(
          Object.assign(new Error(message), {
            code,
            category: "capability",
            retryable: true,
          }),
        );
      });
    }
  }

  function closeActiveWebPage(notification = null) {
    const page = activeWebPage;
    if (!page) return;
    activeWebPage = null;
    if (page.heartbeat !== null) clearInterval(page.heartbeat);
    if (notification !== null) {
      writeWebChannelEvent(page, {
        type: notification,
        channelVersion: WEB_CHANNEL_VERSION,
        pageId: page.id,
      });
    }
    if (notification === "superseded") {
      failPendingWebInvocations(
        "page_superseded",
        "the package Web page was superseded while the action was running",
        page,
      );
    }
    page.response.end();
  }

  async function handleWebChannelConnect(request, response, routeId) {
    if (!isAllowedOrigin(request)) {
      responseJson(
        response,
        403,
        runtimeErrorEnvelope(randomUUID(), {
          code: "origin_not_allowed",
          category: "authorization",
          message: "origin not allowed",
        }),
      );
      return;
    }
    const audience = resolveAudience(request);
    if (audience !== "browser") {
      responseJson(
        response,
        403,
        runtimeErrorEnvelope(randomUUID(), {
          code: "capability_unauthorized",
          category: "authorization",
          message: "the web channel accepts the browser audience only",
        }),
      );
      return;
    }
    if (activeWebPage) {
      webChannelCounters.pageSupersedes += 1;
      closeActiveWebPage("superseded");
    }
    response.statusCode = 200;
    response.setHeader("content-type", "text/event-stream; charset=utf-8");
    response.setHeader("cache-control", "no-store");
    response.setHeader("connection", "keep-alive");
    response.setHeader("x-accel-buffering", "no");
    response.flushHeaders?.();
    const page = {
      id: randomUUID(),
      routeId,
      response,
      heartbeat: null,
      state: new Map(),
    };
    page.heartbeat = setInterval(() => {
      if (response.writableEnded || response.destroyed) return;
      response.write(": ping\n\n");
    }, WEB_CHANNEL_HEARTBEAT_MS);
    page.heartbeat.unref?.();
    activeWebPage = page;
    webChannelCounters.pageConnects += 1;
    writeWebChannelEvent(page, {
      type: "hello",
      channelVersion: WEB_CHANNEL_VERSION,
      pageId: page.id,
      routeId,
      packageId,
      packageVersion,
    });
    request.on("close", () => {
      if (activeWebPage !== page) return;
      activeWebPage = null;
      webChannelCounters.pageUnmounts += 1;
      if (page.heartbeat !== null) clearInterval(page.heartbeat);
      failPendingWebInvocations(
        "page_unmounted",
        "the package Web page disconnected while the action was running",
      );
    });
  }

  async function handleWebChannelUplink(request, response) {
    if (!isAllowedOrigin(request)) {
      responseJson(
        response,
        403,
        runtimeErrorEnvelope(randomUUID(), {
          code: "origin_not_allowed",
          category: "authorization",
          message: "origin not allowed",
        }),
      );
      return;
    }
    const audience = resolveAudience(request);
    if (audience !== "browser") {
      responseJson(
        response,
        403,
        runtimeErrorEnvelope(randomUUID(), {
          code: "capability_unauthorized",
          category: "authorization",
          message: "the web channel accepts the browser audience only",
        }),
      );
      return;
    }
    let body;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      responseJson(response, 400, runtimeErrorEnvelope(randomUUID(), error));
      return;
    }
    const invalid = (message) =>
      responseJson(
        response,
        400,
        runtimeErrorEnvelope(normalizeRequestId(body), {
          code: "invalid_web_channel_message",
          category: "protocol",
          message,
        }),
      );
    if (
      body.type !== "result" &&
      body.type !== "progress" &&
      body.type !== "error" &&
      body.type !== "statePublish"
    ) {
      invalid("web channel uplink type must be result, progress, error or statePublish");
      return;
    }
    if (body.type === "statePublish") {
      if (
        typeof body.routeId !== "string" ||
        !body.state ||
        typeof body.state !== "object" ||
        Array.isArray(body.state)
      ) {
        invalid("statePublish requires routeId and a state object");
        return;
      }
      if (activeWebPage === null || body.routeId !== activeWebPage.routeId) {
        invalid("statePublish routeId must match the connected page");
        return;
      }
      const route = webRoutesById.get(body.routeId);
      const publishable = new Set(
        (Array.isArray(route?.state) ? route.state : [])
          .filter((entry) => entry?.agentVisible === true && entry.source === "page")
          .map((entry) => entry.key),
      );
      for (const key of Object.keys(body.state)) {
        if (!publishable.has(key)) {
          invalid(`statePublish key "${key}" is not an agent-visible source:page key of this route`);
          return;
        }
      }
      for (const [key, value] of Object.entries(body.state)) {
        activeWebPage.state.set(key, value);
      }
      responseJson(response, 200, { ok: true });
      return;
    }
    const requestId = body.requestId;
    if (!isSafeRequestId(requestId)) {
      invalid("web channel requestId is missing or unsafe");
      return;
    }
    const pending = pendingWebInvocations.get(requestId);
    if (!pending) {
      responseJson(response, 200, {
        ok: false,
        error: {
          code: "unknown_request",
          message: "no pending web channel invocation for this requestId",
        },
      });
      return;
    }
    if (body.type === "progress") {
      responseJson(response, 200, { ok: true });
      return;
    }
    if (body.type === "result") {
      settleWebInvocation(requestId, (entry) => {
        webChannelCounters.results += 1;
        lastWebInvocation = {
          ...lastWebInvocation,
          status: "ok",
          finishedAt: Date.now(),
        };
        entry.resolve(body.result ?? null);
      });
      responseJson(response, 200, { ok: true });
      return;
    }
    settleWebInvocation(requestId, (entry) => {
      webChannelCounters.errors += 1;
      lastWebInvocation = {
        ...lastWebInvocation,
        status: "error",
        finishedAt: Date.now(),
      };
      const failure = new Error(
        typeof body.error?.message === "string" && body.error.message.length > 0
          ? body.error.message
          : "the page action failed",
      );
      failure.capabilityError = {
        category:
          typeof body.error?.category === "string" && body.error.category.length > 0
            ? body.error.category
            : "capability",
        code:
          typeof body.error?.code === "string" && body.error.code.length > 0
            ? body.error.code
            : "web_action_failed",
        message: failure.message,
        retryable: body.error?.retryable === true,
      };
      entry.reject(failure);
    });
    responseJson(response, 200, { ok: true });
  }

  function invokePageBoundCapability(capabilityId, input) {
    const page = activeWebPage;
    if (!page) {
      throw Object.assign(
        new Error(
          "this action runs in the package Web page, but no page is connected; make the Web panel visible and retry",
        ),
        {
          code: "page_not_connected",
          category: "capability",
          retryable: true,
        },
      );
    }
    const requestId = randomUUID();
    const startedAt = Date.now();
    webChannelCounters.invocations += 1;
    lastWebInvocation = {
      capabilityId,
      actionId: capabilityId,
      requestId,
      pageId: page.id,
      routeId: page.routeId,
      startedAt,
      status: "pending",
    };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const pending = pendingWebInvocations.get(requestId);
        if (!pending) return;
        pendingWebInvocations.delete(requestId);
        webChannelCounters.timeouts += 1;
        lastWebInvocation = { ...lastWebInvocation, status: "timeout", finishedAt: Date.now() };
        writeWebChannelEvent(page, {
          type: "cancel",
          channelVersion: WEB_CHANNEL_VERSION,
          requestId,
          reason: "timeout",
        });
        reject(
          Object.assign(new Error("the page action timed out"), {
            code: "web_action_timeout",
            category: "capability",
            retryable: true,
          }),
        );
      }, webActionTimeoutMs);
      timeout.unref?.();
      pendingWebInvocations.set(requestId, {
        capabilityId,
        actionId: capabilityId,
        page,
        pageId: page.id,
        startedAt,
        timeout,
        resolve,
        reject,
      });
      if (
        !writeWebChannelEvent(page, {
          type: "invoke",
          channelVersion: WEB_CHANNEL_VERSION,
          requestId,
          capabilityId,
          actionId: capabilityId,
          input: input ?? {},
        })
      ) {
        settleWebInvocation(requestId, (pending) => {
          pending.reject(
            Object.assign(new Error("the package Web page disconnected before the action started"), {
              code: "page_unmounted",
              category: "capability",
              retryable: true,
            }),
          );
        });
      }
    });
  }

  async function executeCapability(capabilityId, input, context) {
    const audience = context.audience;
    const capability = capabilityById.get(capabilityId);
    if (!capability) {
      throw Object.assign(new Error(`unknown capability: ${capabilityId}`), {
        code: "unknown_capability",
        category: "capability",
      });
    }
    if (!capabilityAllows(capability, audience)) {
      throw Object.assign(new Error("capability is not authorized for this caller"), {
        code: "capability_unauthorized",
        category: "authorization",
      });
    }
    if (capabilityId === "system.deleteAllData") {
      throw Object.assign(new Error("system.deleteAllData requires the maintenance path"), {
        code: "maintenance_required",
        category: "authorization",
      });
    }
    if (capabilityId === "system.health") return healthPayload();
    if (capabilityId === "system.selfCheck") return selfCheck();
    if (capabilityId === "web.surface.describe") {
      const routeId = typeof input?.routeId === "string" ? input.routeId : null;
      if (routeId !== null && !webRoutesById.has(routeId)) {
        throw Object.assign(new Error(`unknown route: ${routeId}`), {
          code: "route_not_found",
          category: "business",
          retryable: false,
        });
      }
      return {
        surfaceVersion: webAgentSurface.surfaceVersion ?? "1.0.0",
        routes: routeId === null ? webAgentSurface.routes : [webRoutesById.get(routeId)],
      };
    }
    if (capabilityId === "web.surface.state") {
      return resolveWebSurfaceState(input, audience);
    }
    if (pageBoundCapabilities.has(capabilityId)) {
      return invokePageBoundCapability(capabilityId, input);
    }
    return service.execute(
      capabilityId,
      input,
      context,
    );
  }

  async function deleteDataRoot(requestId) {
    if (!isSafeRequestId(requestId))
      throw new Error("requestId is not safe for maintenance deletion");
    if (!resolvedDataRoot) throw new Error("DATA_ROOT is not configured");
    await closeRepository();
    if (!existsSync(resolvedDataRoot)) return { ok: true, deleted: false };
    const tombstone = `${resolvedDataRoot}.delete-${requestId}`;
    let renamed = false;
    try {
      rmSync(tombstone, { recursive: true, force: true });
      renameSync(resolvedDataRoot, tombstone);
      renamed = true;
      rmSync(tombstone, { recursive: true, force: true });
      return { ok: true, deleted: true };
    } catch (error) {
      if (renamed && !existsSync(resolvedDataRoot) && existsSync(tombstone)) {
        try {
          renameSync(tombstone, resolvedDataRoot);
        } catch (rollbackError) {
          throw new Error(
            `${error instanceof Error ? error.message : String(error)}; rollback failed: ${
              rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
            }`,
          );
        }
      }
      throw error;
    }
  }

  async function handleBroker(request, response, audience) {
    let body;
    try {
      body = await readJsonBody(request);
    } catch (error) {
      responseJson(response, 400, runtimeErrorEnvelope(randomUUID(), error));
      return;
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      responseJson(
        response,
        400,
        runtimeErrorEnvelope(randomUUID(), {
          code: "invalid_envelope",
          category: "protocol",
          message: "invalid broker envelope",
        }),
      );
      return;
    }
    if (body.protocolVersion && body.protocolVersion !== capabilityIndex.protocolVersion) {
      responseJson(
        response,
        400,
        runtimeErrorEnvelope(
          normalizeRequestId(body),
          {
            code: "unsupported_protocol_version",
            category: "protocol",
            message: `unsupported protocolVersion: ${body.protocolVersion}`,
          },
          body.capabilityId,
        ),
      );
      return;
    }
    const requestId = normalizeRequestId(body);
    const capabilityId = typeof body.capabilityId === "string" ? body.capabilityId : undefined;
    if (body.operation === "list") {
      responseJson(response, 200, {
        protocolVersion: capabilityIndex.protocolVersion,
        requestId,
        result: { capabilities: visibleCapabilities(audience) },
      });
      return;
    }
    if (body.operation === "describe") {
      const capability = capabilityId ? capabilityById.get(capabilityId) : undefined;
      if (
        !capability ||
        !visibleCapabilities(audience).some((entry) => entry.id === capability.id)
      ) {
        responseJson(
          response,
          404,
          runtimeErrorEnvelope(
            requestId,
            {
              code: "unknown_capability",
              category: "capability",
              message: "unknown capability",
            },
            capabilityId,
          ),
        );
        return;
      }
      responseJson(response, 200, {
        protocolVersion: capabilityIndex.protocolVersion,
        requestId,
        capabilityId,
        result: capability,
      });
      return;
    }
    if (body.operation === "cancel") {
      const cancelRequestId = typeof body.requestId === "string" ? body.requestId : "";
      const pending = pendingWebInvocations.get(cancelRequestId);
      if (pending) {
        settleWebInvocation(cancelRequestId, (entry) => {
          webChannelCounters.cancels += 1;
          lastWebInvocation = {
            ...lastWebInvocation,
            status: "cancelled",
            finishedAt: Date.now(),
          };
          writeWebChannelEvent(pending.page, {
            type: "cancel",
            channelVersion: WEB_CHANNEL_VERSION,
            requestId: cancelRequestId,
            reason: "caller",
          });
          entry.reject(
            Object.assign(new Error("the page action was cancelled"), {
              code: "capability_cancelled",
              category: "capability",
              retryable: true,
            }),
          );
        });
        responseJson(response, 200, {
          protocolVersion: capabilityIndex.protocolVersion,
          requestId,
          result: { status: "cancelling" },
        });
        return;
      }
      responseJson(response, 200, {
        protocolVersion: capabilityIndex.protocolVersion,
        requestId,
        result: { status: "not-found" },
      });
      return;
    }
    if (body.operation === "delete-all-data") {
      if (audience !== "host" || !maintenanceMode) {
        responseJson(
          response,
          403,
          runtimeErrorEnvelope(
            requestId,
            {
              code: "maintenance_required",
              category: "authorization",
              message: "delete-all-data is only available in host maintenance mode",
            },
            "system.deleteAllData",
          ),
        );
        return;
      }
      if (typeof body.grant !== "string" || body.grant.length === 0) {
        responseJson(
          response,
          400,
          runtimeErrorEnvelope(
            requestId,
            {
              code: "confirmation_required",
              category: "authorization",
              message: "a Confirmation Grant is required",
            },
            "system.deleteAllData",
          ),
        );
        return;
      }
      if (!isSafeRequestId(requestId)) {
        responseJson(
          response,
          400,
          runtimeErrorEnvelope(
            requestId,
            {
              code: "invalid_request_id",
              category: "protocol",
              message: "requestId is not safe for maintenance deletion",
            },
            "system.deleteAllData",
          ),
        );
        return;
      }
      try {
        const result = await deleteDataRoot(requestId);
        responseJson(response, 200, {
          protocolVersion: capabilityIndex.protocolVersion,
          requestId,
          capabilityId: "system.deleteAllData",
          result,
        });
      } catch (error) {
        responseJson(response, 500, runtimeErrorEnvelope(requestId, error, "system.deleteAllData"));
      }
      return;
    }
    if (body.operation !== "invoke" || !capabilityId) {
      responseJson(
        response,
        400,
        runtimeErrorEnvelope(
          requestId,
          {
            code: "unknown_operation",
            category: "protocol",
            message: `unknown broker operation: ${String(body.operation)}`,
          },
          capabilityId,
        ),
      );
      return;
    }
    try {
      const result = await executeCapability(
        capabilityId,
        body.input ?? {},
        normalizeInvocationContext(body.context, audience),
      );
      responseJson(response, 200, {
        protocolVersion: capabilityIndex.protocolVersion,
        requestId,
        capabilityId,
        result,
      });
    } catch (error) {
      const status =
        capabilityError(error).code === "capability_unauthorized"
          ? 403
          : capabilityError(error).code === "unknown_capability"
            ? 404
            : 422;
      responseJson(response, status, runtimeErrorEnvelope(requestId, error, capabilityId));
    }
  }

  function serveClientAsset(request, response, pathname) {
    if (request.method !== "GET" && request.method !== "HEAD") return false;
    const relativePath = pathname.replace(/^\/+/, "");
    if (!relativePath || relativePath === "index.html") return false;
    const absolutePath = resolve(resolvedClientRoot, relativePath);
    if (
      !isInside(resolvedClientRoot, absolutePath) ||
      !existsSync(absolutePath) ||
      !statSync(absolutePath).isFile()
    ) {
      return false;
    }
    response.statusCode = 200;
    response.setHeader(
      "content-type",
      CONTENT_TYPES[extname(absolutePath).toLowerCase()] ?? "application/octet-stream",
    );
    response.setHeader("cache-control", "public, max-age=31536000, immutable");
    if (request.method === "HEAD") response.end();
    else createReadStream(absolutePath).pipe(response);
    return true;
  }

  function bootstrapShellResponse(response) {
    const packageLabel = escapeHtml(packageJson.name ?? contract.id);
    responseText(
      response,
      200,
      `<!doctype html>
<html><head><meta charset="utf-8"><title>${packageLabel}</title></head>
<body><p>Opening ${packageLabel}…</p><script>
(async () => {
  const params = new URLSearchParams(location.hash.startsWith('#') ? location.hash.slice(1) : location.hash);
  const bootstrapCode = params.get('bootstrapCode');
  if (!bootstrapCode) { document.body.textContent = 'Missing bootstrap code.'; return; }
  const response = await fetch('/_thefoolai/v1/bootstrap/exchange', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bootstrapCode })
  });
  if (!response.ok) { document.body.textContent = 'Bootstrap failed.'; return; }
  history.replaceState(null, '', location.pathname + location.search);
  location.reload();
})();
</script></body></html>`,
      "text/html; charset=utf-8",
    );
  }

  async function handleRequest(request, response) {
    let url;
    let pathname;
    try {
      url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${hostname}:${port}`}`);
      pathname = decodeURIComponent(url.pathname);
    } catch {
      responseJson(
        response,
        400,
        runtimeErrorEnvelope(randomUUID(), {
          code: "invalid_request_url",
          category: "protocol",
          message: "request URL is invalid",
        }),
      );
      return;
    }
    if (hosted && !isLoopbackRequest(request)) {
      responseJson(response, 403, {
        error: { code: "host_not_allowed", message: "host not allowed" },
      });
      return;
    }
    if (request.method === "GET" && pathname === "/_thefoolai/v1/runtime/identity") {
      responseJson(response, runtimeId ? 200 : 503, { runtimeId, packageId: contract.id });
      return;
    }
    if (request.method === "GET" && pathname === "/_thefoolai/v1/health") {
      const payload = healthPayload();
      responseJson(response, ["ready", "degraded"].includes(payload.status) ? 200 : 503, payload);
      return;
    }
    if (pathname === "/_thefoolai/v1/bootstrap/exchange" && request.method === "POST") {
      if (!isAllowedOrigin(request)) {
        responseJson(
          response,
          403,
          runtimeErrorEnvelope(randomUUID(), {
            code: "origin_not_allowed",
            category: "authorization",
            message: "origin not allowed",
          }),
        );
        return;
      }
      let body;
      try {
        body = await readJsonBody(request);
      } catch (error) {
        responseJson(response, 400, runtimeErrorEnvelope(randomUUID(), error));
        return;
      }
      if (typeof body.bootstrapCode !== "string" || !consumeBootstrapCode(body.bootstrapCode)) {
        responseJson(
          response,
          401,
          runtimeErrorEnvelope(randomUUID(), {
            code: "invalid_bootstrap",
            category: "authorization",
            message: "invalid or consumed bootstrap code",
          }),
        );
        return;
      }
      response.statusCode = 204;
      response.setHeader(
        "set-cookie",
        `${BROWSER_COOKIE_NAME}=${encodeURIComponent(browserToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`,
      );
      response.setHeader("cache-control", "no-store");
      response.end();
      return;
    }

    const suppliedBootstrap = url.searchParams.get("bootstrapCode");
    if (
      hosted &&
      suppliedBootstrap &&
      request.method === "GET" &&
      isDocumentRequest(request, pathname) &&
      isAllowedOrigin(request)
    ) {
      if (!consumeBootstrapCode(suppliedBootstrap)) {
        responseJson(
          response,
          401,
          runtimeErrorEnvelope(randomUUID(), {
            code: "invalid_bootstrap",
            category: "authorization",
            message: "invalid or consumed bootstrap code",
          }),
        );
        return;
      }
      url.searchParams.delete("bootstrapCode");
      response.statusCode = 302;
      response.setHeader(
        "set-cookie",
        `${BROWSER_COOKIE_NAME}=${encodeURIComponent(browserToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`,
      );
      response.setHeader("location", `${url.pathname}${url.search}`);
      response.end();
      return;
    }

    if (request.method === "GET" && pathname === "/_thefoolai/v1/system/selfCheck") {
      const audience = resolveAudience(request);
      if (audience !== "host" && audience !== "agent") {
        responseJson(
          response,
          403,
          runtimeErrorEnvelope(randomUUID(), {
            code: "capability_unauthorized",
            category: "authorization",
            message: "self-check is not authorized for this caller",
          }),
        );
        return;
      }
      responseJson(response, 200, selfCheck());
      return;
    }

    if (pathname === WEB_CHANNEL_PATH && request.method === "GET") {
      const routeId = url.searchParams.get("routeId") ?? "";
      if (!/^[a-z0-9-]{0,64}$/.test(routeId)) {
        responseJson(
          response,
          400,
          runtimeErrorEnvelope(randomUUID(), {
            code: "invalid_route_id",
            category: "protocol",
            message: "routeId must be a short kebab-case identifier",
          }),
        );
        return;
      }
      await handleWebChannelConnect(request, response, routeId || null);
      return;
    }
    if (pathname === WEB_CHANNEL_INVOKE_PATH && request.method === "POST") {
      await handleWebChannelUplink(request, response);
      return;
    }

    if (serveClientAsset(request, response, pathname)) return;
    const audience = resolveAudience(request);
    if (!audience) {
      if (isDocumentRequest(request, pathname)) {
        bootstrapShellResponse(response);
        return;
      }
      responseJson(
        response,
        401,
        runtimeErrorEnvelope(randomUUID(), {
          code: "unauthorized",
          category: "authorization",
          message: "unauthorized",
        }),
      );
      return;
    }

    if (pathname === "/_thefoolai/v1/broker" && request.method === "POST") {
      await handleBroker(request, response, audience);
      return;
    }
    if (pathname === "/_thefoolai/v1/capabilities" && request.method === "GET") {
      responseJson(response, 200, visibleCapabilities(audience));
      return;
    }
    const capabilityMatch = pathname.match(/^\/_thefoolai\/v1\/capabilities\/([^/]+)$/);
    if (capabilityMatch && request.method === "GET") {
      const capabilityId = capabilityMatch[1];
      const capability = capabilityById.get(capabilityId);
      if (
        !capability ||
        !visibleCapabilities(audience).some((entry) => entry.id === capability.id)
      ) {
        responseJson(
          response,
          404,
          runtimeErrorEnvelope(
            randomUUID(),
            {
              code: "unknown_capability",
              category: "capability",
              message: "unknown capability",
            },
            capabilityId,
          ),
        );
        return;
      }
      responseJson(response, 200, capability);
      return;
    }
    const invokeMatch = pathname.match(/^\/_thefoolai\/v1\/capabilities\/([^/]+)\/invoke$/);
    if (invokeMatch && request.method === "POST") {
      let body;
      try {
        body = await readJsonBody(request);
      } catch (error) {
        responseJson(response, 400, runtimeErrorEnvelope(randomUUID(), error));
        return;
      }
      const capabilityId = invokeMatch[1];
      try {
        const result = await executeCapability(
          capabilityId,
          body.input ?? body,
          normalizeInvocationContext(body.context, audience),
        );
        responseJson(response, 200, {
          protocolVersion: capabilityIndex.protocolVersion,
          requestId: normalizeRequestId(body),
          capabilityId,
          result,
        });
      } catch (error) {
        const envelope = capabilityError(error);
        responseJson(
          response,
          envelope.code === "capability_unauthorized" ? 403 : 422,
          runtimeErrorEnvelope(normalizeRequestId(body), error, capabilityId),
        );
      }
      return;
    }

    const legacyCapabilityMatch = pathname.match(/^\/api\/v1\/capabilities\/([^/]+)$/);
    if (legacyCapabilityMatch) {
      const capabilityId = legacyCapabilityMatch[1];
      const capability = capabilityById.get(capabilityId);
      if (!capability || !capabilityAllows(capability, audience)) {
        responseJson(
          response,
          capability ? 403 : 404,
          runtimeErrorEnvelope(
            randomUUID(),
            {
              code: capability ? "capability_unauthorized" : "unknown_capability",
              category: capability ? "authorization" : "capability",
              message: capability
                ? "capability is not authorized for this caller"
                : "unknown capability",
            },
            capabilityId,
          ),
        );
        return;
      }
      if (capabilityId === "system.deleteAllData") {
        responseJson(
          response,
          403,
          runtimeErrorEnvelope(
            randomUUID(),
            {
              code: "maintenance_required",
              category: "authorization",
              message: "system.deleteAllData requires the maintenance path",
            },
            capabilityId,
          ),
        );
        return;
      }
    }

    try {
      await requestHandler(request, response);
    } catch (error) {
      logger.error?.(
        `[${contract.id}] request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (!response.headersSent) {
        responseJson(response, 500, runtimeErrorEnvelope(randomUUID(), error));
      } else if (!response.writableEnded) {
        response.end();
      }
    }
  }

  function startHttpServer() {
    if (started || httpServer) return;
    started = true;
    lifecycleState = "starting";
    httpServer = createServer((request, response) => {
      void handleRequest(request, response).catch((error) => {
        logger.error?.(
          `[${contract.id}] request failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        if (!response.headersSent) {
          responseJson(response, 500, runtimeErrorEnvelope(randomUUID(), error));
        } else if (!response.writableEnded) {
          response.end();
        }
      });
    });
    httpServer.on("error", (error) => {
      lifecycleState = "failed";
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      const envelope = {
        category: "runtime",
        code: "server_error",
        message: error instanceof Error ? error.message : String(error),
        retryable: false,
      };
      sendToHost({ type: "host:error", error: envelope });
      if (hosted) {
        sendToHost({ type: "host:stopped", reason: "server-error" });
        setTimeout(() => exit(1), 50);
      }
    });
    httpServer.listen(port, hostname, () => {
      lifecycleState = "ready";
      const address = httpServer.address();
      const actualPort = address && typeof address === "object" ? address.port : port;
      logger.log?.(
        JSON.stringify({
          status: "ready",
          packageId: contract.id,
          port: actualPort,
          host: hostname,
        }),
      );
      sendToHost({
        type: "host:ready",
        port: actualPort,
        packageId: contract.id,
        packageVersion,
        protocolVersion: capabilityIndex.protocolVersion,
      });
      heartbeatTimer = setInterval(() => {
        sendToHost({
          type: "host:heartbeat",
          state: lifecycleState,
          pid: process.pid,
          port: actualPort,
          packageId: contract.id,
        });
      }, heartbeatIntervalMs);
      heartbeatTimer.unref?.();
    });
  }

  function closeHttpServer(onClosed) {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    closeActiveWebPage();
    failPendingWebInvocations(
      "runtime_stopping",
      "the package runtime is stopping while the action was running",
    );
    if (!httpServer) {
      onClosed();
      return;
    }
    const closingServer = httpServer;
    httpServer = null;
    closingServer.close(onClosed);
    closingServer.closeAllConnections?.();
  }

  function stopHttpServer(reason = "stopped", exitProcess = hosted) {
    if (stopped || maintenanceMode) return;
    stopped = true;
    lifecycleState = "stopping";
    sendToHost({ type: "host:stopping", reason });
    closeHttpServer(() => {
      void closeRepository()
        .then(() => {
          lifecycleState = "stopped";
          sendToHost({ type: "host:stopped", reason });
          if (exitProcess) setTimeout(() => exit(0), 50);
        })
        .catch((error) => {
          lifecycleState = "failed";
          const envelope = capabilityError(error);
          sendToHost({ type: "host:error", error: envelope });
          if (exitProcess) setTimeout(() => exit(1), 50);
        });
    });
  }

  function enterMaintenance(request) {
    if (stopped || maintenanceMode) return;
    stopped = true;
    maintenanceMode = true;
    lifecycleState = "stopping";
    sendToHost({ type: "host:stopping", reason: "maintenance" });
    closeHttpServer(async () => {
      try {
        if (
          request?.capabilityId !== "system.deleteAllData" ||
          !isSafeRequestId(request.requestId) ||
          typeof request.grant !== "string" ||
          request.grant.length === 0
        ) {
          throw new Error("system.deleteAllData requires a Confirmation Grant and safe request id");
        }
        const result = await deleteDataRoot(request.requestId);
        sendToHost({ type: "host:maintenance.result", requestId: request.requestId, ...result });
        lifecycleState = "stopped";
        sendToHost({ type: "host:stopped", reason: "maintenance" });
        setTimeout(() => exit(0), 50);
      } catch (error) {
        lifecycleState = "failed";
        const envelope = capabilityError(error);
        sendToHost({
          type: "host:maintenance.result",
          requestId: request?.requestId,
          ok: false,
          error: envelope,
        });
        sendToHost({ type: "host:error", error: envelope.message });
      }
    });
  }

  /**
   * Read-only view of what the host negotiated at `host:start` (per-capability contract versions).
   * `get()` returns a frozen snapshot, or `null` before `host:start` / when running standalone.
   */
  function publishHostCapabilityNegotiation() {
    const capabilitiesSnapshot = {};
    for (const [id, entry] of hostSupportedCapabilities) {
      capabilitiesSnapshot[id] = entry.contractVersion;
    }
    hostCapabilityNegotiation = Object.freeze({
      capabilities: Object.freeze(capabilitiesSnapshot),
    });
  }

  function handleParentMessage(event) {
    const message = event?.data ?? event;
    if (message?.type === "host:start") {
      if (
        typeof message.hostToken !== "string" ||
        typeof message.agentToken !== "string" ||
        typeof message.browserToken !== "string" ||
        typeof message.bootstrapCode !== "string" ||
        typeof message.runtimeId !== "string" ||
        !message.hostToken ||
        !message.agentToken ||
        !message.browserToken ||
        !message.bootstrapCode ||
        !message.runtimeId
      ) {
        sendToHost({
          type: "host:error",
          error: {
            category: "protocol",
            code: "invalid_start",
            message: "host:start is missing runtime credentials",
            retryable: false,
          },
        });
        return;
      }
      hostToken = message.hostToken;
      agentToken = message.agentToken;
      browserToken = message.browserToken;
      runtimeId = message.runtimeId;
      hostSupportedCapabilities = new Map(
        (Array.isArray(message.supportedHostCapabilities) ? message.supportedHostCapabilities : [])
          .filter(
            (entry) =>
              entry && typeof entry.id === "string" && typeof entry.contractVersion === "string",
          )
          .map((entry) => [entry.id, entry]),
      );
      publishHostCapabilityNegotiation();
      addBootstrapCode(message.bootstrapCode);
      startHttpServer();
      return;
    }
    if (message?.type === "host:bootstrap") {
      if (!addBootstrapCode(message.bootstrapCode)) {
        sendToHost({
          type: "host:error",
          error: {
            category: "protocol",
            code: "invalid_bootstrap_request",
            message: "host:bootstrap is missing bootstrapCode",
            retryable: false,
          },
        });
      }
      return;
    }
    if (message?.type === "host:capability.response") {
      handleHostCapabilityResponse(message);
      return;
    }
    if (message?.type === "host:event") {
      handleHostEvent(message);
      return;
    }
    if (message?.type === "host:maintenance.request") {
      enterMaintenance(message);
      return;
    }
    if (message?.type === "host:stop") {
      stopHttpServer();
    }
  }

  function run() {
    // Read-only: no write entry point; `null` until host:start (and always in standalone mode).
    globalThis.THEFOOLAI_HOST_CAPABILITY_NEGOTIATION = Object.freeze({
      get: () => hostCapabilityNegotiation,
    });
    if (hosted) {
      globalThis.THEFOOLAI_HOST_CAPABILITY_BRIDGE = requestHostCapability;
      parentPort.on("close", () => stopHttpServer("parent-port-disconnected"));
      parentPort.on("message", handleParentMessage);
    } else {
      startHttpServer();
    }
    process.once("SIGTERM", () => stopHttpServer("SIGTERM"));
    process.once("SIGINT", () => stopHttpServer("SIGINT"));
    return {
      startHttpServer,
      stopHttpServer,
      handleParentMessage,
      requestHostCapability,
      getState: () => ({ lifecycleState, maintenanceMode, runtimeId }),
      getWebChannelState: webChannelState,
    };
  }

  return {
    run,
    startHttpServer,
    stopHttpServer,
    handleParentMessage,
    requestHostCapability,
    getState: () => ({ lifecycleState, maintenanceMode, runtimeId }),
    getWebChannelState: webChannelState,
  };
}
