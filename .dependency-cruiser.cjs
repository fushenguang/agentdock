// @ts-check
// dependency-cruiser architecture guard configuration
// Enforces layered architecture boundaries in src/{core,features,infra}
//
// Rules use two severity levels (per design D5):
//   error  — architecture invariants (must never be violated)
//   warn   — advisory notices (human review recommended)
//
// Scope: src/{core,features,infra} only.
// app/ (Next.js App Router) is excluded — framework conventions take precedence.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // -----------------------------------------------------------------------
    // ARCHITECTURE INVARIANT — error
    // Features may not import from other features.
    // Cross-feature communication must go through src/core (shared services/repos).
    // -----------------------------------------------------------------------
    {
      name: "no-cross-feature-import",
      severity: "error",
      comment:
        "Features cannot import from other features. Use shared core abstractions instead.",
      from: {
        path: "^(src/features/[^/]+)/",
      },
      to: {
        path: "^src/features/",
        pathNot: "^$1/",
      },
    },

    // -----------------------------------------------------------------------
    // ARCHITECTURE INVARIANT — error
    // Core is a read-only foundational layer.
    // It must not depend on features or infra (would create reverse/circular deps).
    // -----------------------------------------------------------------------
    {
      name: "no-core-mutation",
      severity: "error",
      comment:
        "Core layer must not import from features or infra. Core is a foundational read-only layer.",
      from: {
        path: "^src/core/",
      },
      to: {
        path: "^src/(features|infra)/",
      },
    },

    // -----------------------------------------------------------------------
    // ADVISORY — warn
    // Any import into src/infra should be flagged for architecture review.
    // Infra changes affect all consumers — add arch-approval label to the PR.
    // -----------------------------------------------------------------------
    {
      name: "infra-approval-label",
      severity: "warn",
      comment:
        "Infra dependencies require architecture review. Ensure the arch-approval label is applied to this PR.",
      from: {
        path: "^src/",
        pathNot: "^src/infra/",
      },
      to: {
        path: "^src/infra/",
      },
    },
  ],

  options: {
    // Limit analysis to the layered application source.
    // app/ and pages/ are Next.js App Router / Pages Router — excluded (Decision D5).
    includeOnly: "^src/(core|features|infra)",
    exclude: {
      path: ["^(app|pages|src/app)/", "node_modules", "\\.d\\.ts$"],
    },

    // Resolve TypeScript path aliases from project tsconfig
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },

    // Enhanced module resolution for TypeScript projects
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },

    // Output format used by the arch:check script
    reporterOptions: {
      archi: {
        collapsePattern: "^(node_modules/[^/]+)",
      },
      "dot": {
        collapsePattern: "^(node_modules/[^/]+)",
      },
    },
  },
};
