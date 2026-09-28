import { describe, expect, it } from "vitest";
import { authorizeMastraRequest } from "./auth";
import { withMastraAuth } from "./handler";
import { mastra } from "./index";

describe("Mastra integration", () => {
  it("registers the agent and deterministic workflow without requiring a model key", () => {
    expect(mastra.getAgentById("assistant-agent").id).toBe("assistant-agent");
    expect(mastra.getWorkflowById("message-workflow").id).toBe("message-workflow");
  });

  it("runs the deterministic workflow", async () => {
    const workflow = mastra.getWorkflowById("message-workflow");
    const run = await workflow.createRun();
    const result = await run.start({
      inputData: {
        message: "  hello   mastra  ",
      },
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result).toEqual({ message: "hello mastra" });
    }
  });

  it("allows the development default and honors an enabled authorization hook", async () => {
    const request = new Request("http://localhost/api/agents");
    expect(await authorizeMastraRequest(request)).toBeUndefined();

    const deny = new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
    const handlers = withMastraAuth(
      {
        GET: async () => new Response("ok"),
        POST: async () => new Response("ok"),
        PUT: async () => new Response("ok"),
        DELETE: async () => new Response("ok"),
        PATCH: async () => new Response("ok"),
        OPTIONS: async () => new Response("ok"),
        HEAD: async () => new Response(null),
      },
      async () => deny,
    );

    expect(await handlers.GET({ request, params: {} })).toBe(deny);
  });
});
