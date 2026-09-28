import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const normalizeMessage = createStep({
  id: "normalize-message",
  description: "Trim a message and collapse repeated whitespace.",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async ({ inputData }) => ({
    message: inputData.message.trim().replace(/\s+/g, " "),
  }),
});

export const messageWorkflow = createWorkflow({
  id: "message-workflow",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    message: z.string(),
  }),
})
  .then(normalizeMessage)
  .commit();
