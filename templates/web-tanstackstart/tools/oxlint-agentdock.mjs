import path from "node:path";
import { existsSync } from "node:fs";

function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

function featureName(filename) {
  const match = normalizeFilename(filename).match(/\/src\/features\/([^/]+)\//);
  return match?.[1] ?? null;
}

function resolvedImport(filename, source) {
  if (source.startsWith("@/")) return `src/${source.slice(2)}`;
  if (!source.startsWith(".")) return null;
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(normalizeFilename(filename)), source),
  );
}

function reportRestricted(context, node, message) {
  context.report({ node, message });
}

function isUiFile(filename) {
  const normalized = normalizeFilename(filename);
  if (!normalized.includes("/src/routes/") && !normalized.includes("/src/components/")) {
    return false;
  }
  return (
    !/\.(?:test|spec)\.[jt]sx?$/.test(normalized) &&
    !normalized.includes("/src/components/appearance/") &&
    !normalized.includes("/src/themes/")
  );
}

const requireFeatureContract = {
  meta: {
    type: "problem",
    schema: [],
  },
  create(context) {
    const name = featureName(context.filename);
    if (!name || name === "_experiments") return {};

    const featureDir = normalizeFilename(context.filename).replace(/\/[^/]+$/, "");
    const contractPath = path.join(featureDir, "__contract__.ts");

    if (existsSync(contractPath)) return {};

    return {
      Program(node) {
        reportRestricted(
          context,
          node,
          `Feature "${name}" is missing __contract__.ts. Every feature directory must expose a typed contract.`,
        );
      },
    };
  },
};

const noCrossFeature = {
  meta: {
    type: "problem",
    schema: [],
  },
  create(context) {
    const currentFeature = featureName(context.filename);
    if (!currentFeature) return {};

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") return;
        const source = node.source.value;
        const resolved = resolvedImport(context.filename, source);
        const targetFeature =
          source.match(/^@\/features\/([^/]+)/)?.[1] ??
          resolved?.match(/\/src\/features\/([^/]+)/)?.[1];

        if (targetFeature && targetFeature !== currentFeature) {
          reportRestricted(
            context,
            node,
            `Feature "${currentFeature}" cannot import feature "${targetFeature}" directly. Move shared behavior to src/core.`,
          );
        }
      },
    };
  },
};

const noCoreMutation = {
  meta: {
    type: "problem",
    schema: [],
  },
  create(context) {
    const filename = normalizeFilename(context.filename);
    if (!filename.includes("/src/core/")) return {};

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value !== "string") return;
        const resolved = resolvedImport(context.filename, node.source.value);
        const pointsToMutableLayer =
          node.source.value.startsWith("@/features/") ||
          node.source.value.startsWith("@/infra/") ||
          resolved?.includes("/src/features/") ||
          resolved?.includes("/src/infra/");

        if (pointsToMutableLayer) {
          reportRestricted(
            context,
            node,
            "Core is a read-only foundational layer and cannot import features or infra.",
          );
        }
      },
    };
  },
};

const noInlineStyle = {
  meta: {
    type: "problem",
    schema: [],
  },
  create(context) {
    if (!isUiFile(context.filename)) return {};
    return {
      JSXAttribute(node) {
        if (node.name?.name === "style") {
          reportRestricted(
            context,
            node,
            "Use component props or xstyle instead of a JSX style attribute.",
          );
        }
      },
      Identifier(node) {
        if (node.name === "CSSProperties") {
          reportRestricted(
            context,
            node,
            "Use component props or StyleX instead of CSSProperties.",
          );
        }
      },
    };
  },
};

const noColorLiteral = {
  meta: {
    type: "problem",
    schema: [],
  },
  create(context) {
    if (!isUiFile(context.filename)) return {};
    return {
      Literal(node) {
        if (
          typeof node.value === "string" &&
          (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(node.value) ||
            /^(?:rgb|hsl|oklch)a?\(/i.test(node.value))
        ) {
          reportRestricted(context, node, "Use an Astryx color token instead of a color literal.");
        }
      },
    };
  },
};

const noViewportMediaQuery = {
  meta: {
    type: "problem",
    schema: [],
  },
  create(context) {
    if (!isUiFile(context.filename)) return {};
    return {
      CallExpression(node) {
        const name =
          node.callee?.name ??
          (node.callee?.type === "MemberExpression" ? node.callee.property?.name : null);
        if (name === "useMediaQuery" || name === "matchMedia") {
          reportRestricted(
            context,
            node,
            "Use a container query instead of a viewport media query.",
          );
        }
      },
    };
  },
};

export const uiRules = {
  "no-inline-style": noInlineStyle,
  "no-color-literal": noColorLiteral,
  "no-viewport-media-query": noViewportMediaQuery,
};

export default {
  meta: {
    name: "agentdock-arch",
  },
  rules: {
    "require-feature-contract": requireFeatureContract,
    "no-cross-feature": noCrossFeature,
    "no-core-mutation": noCoreMutation,
    ...uiRules,
  },
};
