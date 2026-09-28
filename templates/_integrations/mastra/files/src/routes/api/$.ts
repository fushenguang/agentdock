import { createStartRouteHandler } from "@mastra/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { authorizeMastraRequest } from "../../mastra/auth";
import { withMastraAuth } from "../../mastra/handler";
import { mastra } from "../../mastra";

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: withMastraAuth(createStartRouteHandler({ mastra }), authorizeMastraRequest),
  },
});
