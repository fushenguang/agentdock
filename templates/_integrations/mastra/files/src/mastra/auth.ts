export type MastraAuthorizer = (
  request: Request,
) => Response | undefined | Promise<Response | undefined>;

/**
 * Development-only default authorization hook.
 *
 * Replace this function with an identity-provider or session check before
 * exposing the generated Mastra API to a production environment.
 */
export const authorizeMastraRequest: MastraAuthorizer = async (_request) => undefined;
