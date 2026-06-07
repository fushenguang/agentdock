import { defineCommand } from 'citty'
import { initCommand } from './commands/init.js'
import { mcpCommand } from './commands/mcp.js'
import { VERSION } from './version.js'

export const main = defineCommand({
  meta: {
    name: 'agentdock',
    description: 'AgentDock CLI – scaffold projects for humans and AI agents',
    version: VERSION,
  },
  subCommands: {
    init: initCommand,
    mcp: mcpCommand,
  },
})
