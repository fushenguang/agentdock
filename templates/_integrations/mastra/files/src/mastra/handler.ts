import type { StartRouteHandler, StartRouteHandlers } from "@mastra/tanstack-start";
import type { MastraAuthorizer } from "./auth";

export function withMastraAuth(
  handlers: StartRouteHandlers,
  authorize: MastraAuthorizer,
): StartRouteHandlers {
  const wrap = (handler: StartRouteHandler): StartRouteHandler => {
    if (!handler) return handler;
    return async (context) => {
      const denied = await authorize(context.request);
      return denied ?? handler(context);
    };
  };

  return {
    GET: wrap(handlers.GET),
    POST: wrap(handlers.POST),
    PUT: wrap(handlers.PUT),
    DELETE: wrap(handlers.DELETE),
    PATCH: wrap(handlers.PATCH),
    OPTIONS: wrap(handlers.OPTIONS),
    HEAD: wrap(handlers.HEAD),
  };
}
