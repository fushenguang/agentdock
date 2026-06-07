import { defineCommand } from 'citty'

export const mcpCommand = defineCommand({
  meta: {
    name: 'mcp',
    description: 'Start an MCP (Model Context Protocol) Stdio server exposing AgentDock tools',
  },
  async run() {
    const { startMcpServer } = await import('../adapters/mcp/server.js')
    await startMcpServer()
  },
})
