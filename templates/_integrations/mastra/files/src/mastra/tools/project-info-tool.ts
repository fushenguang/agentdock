import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const projectInfoTool = createTool({
  id: "project-info-tool",
  description: "Explain the AgentDock TanStack Start project structure and runtime boundaries.",
  inputSchema: z.object({
    topic: z
      .enum(["architecture", "mastra", "data-layer"])
      .describe("The project topic to describe."),
  }),
  outputSchema: z.object({
    topic: z.string(),
    guidance: z.string(),
  }),
  execute: async ({ topic }) => ({
    topic,
    guidance: {
      architecture:
        "Routes compose features, features own behavior and contracts, and infra owns persistence implementations.",
      mastra:
        "Mastra is an opt-in server runtime at /api. Astryx remains the UI and interaction kernel.",
      "data-layer":
        "Application persistence stays behind the repository/provider contract and is independent from Mastra.",
    }[topic],
  }),
});
