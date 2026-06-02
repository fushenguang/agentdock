/**
 * Contract for the `hello` feature.
 *
 * Defines the public API boundary: input/output types and the exported function signature.
 * Only symbols declared here may be exported from `index.ts`.
 */

/** Input accepted by the hello feature. */
export interface HelloInput {
  name: string;
}

/** Output returned by the hello feature. */
export interface HelloOutput {
  greeting: string;
}
