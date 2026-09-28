import { Mastra } from "@mastra/core/mastra";
import { assistantAgent } from "./agents/assistant-agent";
import { messageWorkflow } from "./workflows/message-workflow";

export const mastra = new Mastra({
  agents: { assistantAgent },
  workflows: { messageWorkflow },
});
