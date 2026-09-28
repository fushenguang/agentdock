import path from "node:path";
import { existsSync } from "node:fs";

function normalizeFilename(filename) {
  return filename.replaceAll("\\", "/");
}

function featureName(filename) {
  const match = normalizeFilename(filename).match(/\/src\/features\/([^/]+)\//);
  return match?.[1] ?? null;
}

function featureRoot(filename) {
  const match = normalizeFilename(filename).match(/\/src\/features\/([^/]+)\//);
  return match ? match[0].slice(0, -1) : null;
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

function sourceFromNode(node) {
  if (typeof node.source?.value === "string") return node.source.value;
  return null;
}

const requireFeatureContract = {
  meta: {
    type: "problem",
    schema: [],
  },
  create(context) {
    const name = featureName(context.filename);
    if (!name || name === "_experiments") return {};

    const root = featureRoot(context.filename);
    const contractPath = root
      ? path.join(process.cwd(), ...root.split("/").filter(Boolean), "__contract__.ts")
      : null;

    if (contractPath && existsSync(contractPath)) return {};

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

    function check(node) {
      const source = sourceFromNode(node);
      if (!source) return;
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
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
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

    function check(node) {
      const source = sourceFromNode(node);
      if (!source) return;
      const resolved = resolvedImport(context.filename, source);
      const pointsToMutableLayer =
        source.startsWith("@/features/") ||
        source.startsWith("@/infra/") ||
        resolved?.includes("/src/features/") ||
        resolved?.includes("/src/infra/");

      if (pointsToMutableLayer) {
        reportRestricted(
          context,
          node,
          "Core is a read-only foundational layer and cannot import features or infra.",
        );
      }
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

export default {
  meta: {
    name: "agentdock-arch",
  },
  rules: {
    "require-feature-contract": requireFeatureContract,
    "no-cross-feature": noCrossFeature,
    "no-core-mutation": noCoreMutation,
  },
};
