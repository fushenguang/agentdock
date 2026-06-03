import { defineCommand } from "citty";
import { initCommand } from "./commands/init.js";
import { mcpCommand } from "./commands/mcp.js";

export const main = defineCommand({
  meta: {
    name: "agentdock",
    description: "AgentDock CLI – scaffold projects for humans and AI agents",
    version: "0.1.0",
  },
  subCommands: {
    init: initCommand,
    mcp: mcpCommand,
  },
});
