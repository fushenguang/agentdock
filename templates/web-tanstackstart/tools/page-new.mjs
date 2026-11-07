#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readDesignContract } from "./design-contract.mjs";

const PACKAGE = "@cogito.ai/astryx-web";
const PAGES_DIR = "src/i18n/pages";
const MESSAGE_BLOCK = /\n*\/\*\s*astryx-messages\s*([\s\S]*?)\*\/\s*$/;

function fail(message) {
  throw new Error(message);
}

function run(command, args, cwd) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout.trim() : "";
    const stderr = typeof error.stderr === "string" ? error.stderr.trim() : "";
    throw new Error([stderr, stdout, error.message].filter(Boolean).join("\n"), {
      cause: error,
    });
  }
}

function parseJson(output) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`Expected JSON from Astryx, received:\n${output}`);
  }
}

function parseArgs(argv) {
  const intent = [];
  let route = null;
  let template = null;
  let allowCore = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--route") {
      route = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--template") {
      template = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--allow-core") {
      allowCore = true;
    } else if (arg.startsWith("-")) {
      fail(`Unknown option ${arg}`);
    } else {
      intent.push(arg);
    }
  }

  const normalizedIntent = intent.join(" ").trim();
  if (!normalizedIntent) fail('A page intent is required: pnpm page:new "<intent>" --route <path>');
  if (!route) fail("--route is required");
  if (route.startsWith("/") || route.includes("..") || route.includes("\\")) {
    fail(`Invalid route ${route}`);
  }
  const routePath = route.replace(/^\/+|\/+$/g, "");
  if (!/^[A-Za-z0-9_$/-]+$/.test(routePath)) {
    fail("Route may contain only letters, digits, _, $, - and /");
  }

  return { intent: normalizedIntent, route: routePath, template, allowCore };
}

function pageIdFor(route) {
  return route.replaceAll("$", "").replaceAll("/", ".");
}

function localBin(cwd, name) {
  return join(cwd, "node_modules", ".bin", process.platform === "win32" ? `${name}.cmd` : name);
}

function catalogFileFor(pageId) {
  const base = pageId === "index" ? "index__page" : pageId.replaceAll(".", "__");
  return join(PAGES_DIR, `${base}.ts`);
}

function printCandidates(pages) {
  const candidates = pages.filter((page) => page.package === PACKAGE).slice(0, 3);
  if (candidates.length === 0) return "";
  return [
    "Closest @cogito.ai/astryx-web templates:",
    ...candidates.map((page) => `  ${page.name} — ${page.description ?? "page template"}`),
  ].join("\n");
}

function transformTemplate(source, details) {
  const messagesMatch = source.match(MESSAGE_BLOCK);
  if (!messagesMatch) fail(`${details.name} has no trailing astryx-messages block`);

  let messages;
  try {
    messages = JSON.parse(messagesMatch[1]);
  } catch {
    fail(`${details.name} has an invalid astryx-messages block`);
  }
  messages = Object.fromEntries(
    Object.entries(messages).map(([locale, catalog]) => [
      locale,
      Object.fromEntries(
        Object.entries(catalog).map(([key, value]) => [
          key.replaceAll("__PAGE__", details.pageId),
          value,
        ]),
      ),
    ]),
  );

  let body = source.slice(0, messagesMatch.index).trimEnd();
  body = body.replaceAll("__PAGE__", details.pageId);

  const namedFunction = body.match(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(/);
  let componentName;
  if (namedFunction) {
    componentName = namedFunction[1];
    body = body.replace(
      /export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(/,
      `function ${componentName}(`,
    );
  } else {
    const defaultName = body.match(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;/);
    if (!defaultName) fail(`${details.name} must default-export a named component`);
    componentName = defaultName[1];
    body = body.replace(defaultName[0], "");
    if (!new RegExp(`function\\s+${componentName}\\s*\\(`).test(body)) {
      fail(`${details.name} does not declare ${componentName}`);
    }
  }

  const routePath = details.route === "index" ? "/$locale/" : `/$locale/${details.route}`;
  const marker = [
    `// astryx-template: ${details.name} | package: ${details.package} |`,
    ` intent: ${JSON.stringify(details.intent)} | astryx: ${details.astryxVersion}`,
  ].join("");
  const routeImport = 'import { createFileRoute } from "@tanstack/react-router";';
  const directive = body.match(/^(['"]use client['"];?\s*)/);
  if (directive) {
    body = `${directive[1]}${routeImport}\n${body.slice(directive[1].length)}`;
  } else {
    body = `${routeImport}\n\n${body}`;
  }

  const route = [
    "",
    `export const Route = createFileRoute(${JSON.stringify(routePath)})({`,
    `  component: ${componentName},`,
    "});",
    "",
  ].join("\n");

  return {
    source: `${marker}\n${body}${route}`,
    messages,
  };
}

function emitCatalog(catalog) {
  return Object.entries(catalog)
    .map(
      ([key, value]) => `  ${JSON.stringify(key)}: { defaultMessage: ${JSON.stringify(value)} },`,
    )
    .join("\n");
}

function catalogSource(messages) {
  return [
    'import type { Catalog } from "@astryxdesign/core/i18n";',
    "",
    "export const en: Catalog = {",
    emitCatalog(messages.en),
    "};",
    "",
    "export const zhCN: Catalog = {",
    emitCatalog(messages["zh-CN"]),
    "};",
    "",
  ].join("\n");
}

function registerCatalog(cwd, catalogFile) {
  const indexPath = join(cwd, PAGES_DIR, "index.ts");
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      [
        'import type { Catalog } from "@astryxdesign/core/i18n";',
        "",
        "export interface PageCatalog {",
        "  readonly en: Catalog;",
        '  readonly "zh-CN": Catalog;',
        "}",
        "",
        "export const pageCatalogs: readonly PageCatalog[] = [];",
        "",
      ].join("\n"),
    );
  }

  const importPath = `./${posix.basename(catalogFile, ".ts")}`;
  const identifier = `page_${posix.basename(catalogFile, ".ts").replaceAll("-", "_")}`;
  let source = readFileSync(indexPath, "utf8");
  if (!source.includes(`from ${JSON.stringify(importPath)}`)) {
    source = source.replace(
      "export const pageCatalogs",
      [
        `import { en as ${identifier}En, zhCN as ${identifier}ZhCN } from ${JSON.stringify(importPath)};`,
        "",
        "export const pageCatalogs",
      ].join("\n"),
    );
    source = source.replace("];", `  { en: ${identifier}En, "zh-CN": ${identifier}ZhCN },\n];`);
  }
  writeFileSync(indexPath, source);
}

function chooseTemplate(payload, options, loadCatalog) {
  const pages = payload.data?.pages ?? [];
  if (options.template) {
    const catalog = loadCatalog();
    const template = catalog.data?.find((entry) => entry.id === options.template);
    if (!template) fail(`Unknown template ${options.template}`);
    return {
      name: template.id,
      package: template.package,
      isReady: template.isReady,
      basis: "explicit",
      pages,
      astryxVersion: catalog.meta?.answeredBy?.cli,
    };
  }

  const start = payload.data?.start;
  if (!start) {
    fail(
      ["Page creation rejected: Astryx returned no start template.", printCandidates(pages)]
        .filter(Boolean)
        .join("\n"),
    );
  }
  const template = loadCatalog().data?.find((entry) => entry.id === start.name);
  return {
    ...start,
    isReady: template?.isReady ?? true,
    pages,
    astryxVersion: payload.meta?.answeredBy?.cli,
  };
}

function rejectChoice(template, options) {
  const reasons = [];
  if (template.basis === "fallback") reasons.push("Astryx fell back to the app shell.");
  if (template.isReady === false) reasons.push(`${template.name} is not ready.`);
  if (!options.allowCore && template.package !== PACKAGE) {
    reasons.push(`${template.name} is from ${template.package}, not ${PACKAGE}.`);
  }
  if (reasons.length === 0) return;

  const hint =
    template.basis === "fallback"
      ? 'Put the page type last: write "mobile settings page", not "settings page on mobile".'
      : null;
  fail(
    [`Page creation rejected: ${reasons.join(" ")}`, printCandidates(template.pages), hint]
      .filter(Boolean)
      .join("\n"),
  );
}

export function runPageNew(argv, dependencies = {}) {
  const options = parseArgs(argv);
  const cwd = resolve(dependencies.cwd ?? process.cwd());
  if (readDesignContract(cwd).status !== "approved") {
    fail(
      "Design direction is not approved. Run the astryx-web-design skill (references/design-direction.md) and wait for the owner.",
    );
  }
  const exec = dependencies.execFile ?? run;
  const external = (command, args) => exec(command, args, cwd);
  const astryx = dependencies.astryx ?? localBin(cwd, "astryx");
  const payload = parseJson(external(astryx, ["build", options.intent, "--json"]));
  const template = chooseTemplate(payload, options, () =>
    parseJson(external(astryx, ["template", "--list", "--json"])),
  );
  rejectChoice(template, options);

  const targetRelative = posix.join("src/routes/$locale", `${options.route}.tsx`);
  const target = join(cwd, targetRelative);
  if (existsSync(target)) fail(`Refusing to overwrite existing page ${target}`);
  mkdirSync(dirname(target), { recursive: true });

  const scaffold = parseJson(
    external(astryx, [
      "template",
      template.name,
      targetRelative,
      "--package",
      template.package,
      "--json",
    ]),
  );
  if ((scaffold.data?.missingPackages ?? []).length > 0) {
    fail(
      `${template.name} needs packages the template does not install: ${scaffold.data.missingPackages.join(
        ", ",
      )}`,
    );
  }

  const pageId = pageIdFor(options.route);
  const transformed = transformTemplate(readFileSync(target, "utf8"), {
    name: template.name,
    package: template.package,
    intent: options.intent,
    astryxVersion: template.astryxVersion ?? "unknown",
    route: options.route,
    pageId,
  });
  writeFileSync(target, transformed.source);

  mkdirSync(join(cwd, PAGES_DIR), { recursive: true });
  const catalogFile = catalogFileFor(pageId);
  const catalogPath = join(cwd, catalogFile);
  writeFileSync(catalogPath, catalogSource(transformed.messages));
  registerCatalog(cwd, catalogFile);

  external(localBin(cwd, "oxfmt"), ["--write", target, catalogPath]);
  external(localBin(cwd, "tsr"), ["generate"]);

  console.log(`Created ${target}`);
  console.log(`Template: ${template.name} (${template.package})`);
  console.log("Missing packages: none");
  console.log(
    "Next: replace SAMPLE_* data, adapt inside the template sections, write real copy in both locales, and run pnpm check.",
  );
  return { target, template: template.name, package: template.package, pageId };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runPageNew(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
