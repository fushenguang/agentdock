import { Agent } from "@mastra/core/agent";
import { projectInfoTool } from "../tools/project-info-tool";

export const assistantAgent = new Agent({
  id: "assistant-agent",
  name: "Assistant Agent",
  instructions: `
You are a concise application assistant.

Use the projectInfoTool when the user asks about this generated project. Do not claim access to private data, child profiles, billing systems, or external accounts.
`,
  model: process.env.MASTRA_MODEL ?? "openai/gpt-5-mini",
  tools: { projectInfoTool },
});
