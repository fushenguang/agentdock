import { join } from 'path'
import { getTemplates, getTemplate } from '../../core/registry.js'
import { scaffoldProject } from '../../core/scaffold.js'
import { INIT_MODES, isInitMode, type InitMode } from '../../core/workspace.js'

export interface McpTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  handler: (input: Record<string, unknown>) => Promise<unknown>
}

export const listTemplatesTool: McpTool = {
  name: 'list_templates',
  description: 'List all available AgentDock project templates',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  async handler(_input) {
    const templates = getTemplates()
    return {
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        minCliVersion: t.minCliVersion,
        workspaceMember: Boolean(t.workspaceMember),
      })),
    }
  },
}

export const scaffoldProjectTool: McpTool = {
  name: 'scaffold_project',
  description: 'Scaffold a new AgentDock project from a template into the specified directory',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Project name (used as directory name and package name)',
      },
      template: {
        type: 'string',
        description: 'Template ID (e.g. web-nextjs)',
      },
      targetDir: {
        type: 'string',
        description: 'Absolute path to the target directory. Defaults to cwd/<name>.',
      },
      packageManager: {
        type: 'string',
        enum: ['pnpm', 'npm', 'yarn', 'bun'],
        description: 'Package manager to suggest in README. Defaults to pnpm.',
      },
      mode: {
        type: 'string',
        enum: INIT_MODES,
        description:
          'Placement mode: auto detects an existing pnpm workspace member, workspace forces member mode, standalone forces a self-contained project. Defaults to auto.',
      },
    },
    required: ['name', 'template'],
  },
  async handler(input) {
    const {
      name,
      template: templateId,
      targetDir,
      packageManager,
      mode,
    } = input as {
      name: string
      template: string
      targetDir?: string
      packageManager?: 'pnpm' | 'npm' | 'yarn' | 'bun'
      mode?: string
    }

    const template = getTemplate(templateId)
    if (!template) {
      return {
        ok: false,
        error: 'TEMPLATE_NOT_FOUND',
        template: templateId,
      }
    }

    if (mode !== undefined && !isInitMode(mode)) {
      return {
        ok: false,
        error: 'INVALID_MODE',
        mode,
        supportedModes: INIT_MODES,
      }
    }

    const resolvedTargetDir = targetDir ?? join(process.cwd(), name)

    return scaffoldProject({
      targetDir: resolvedTargetDir,
      name,
      template,
      packageManager: packageManager ?? 'pnpm',
      mode: (mode as InitMode | undefined) ?? 'auto',
    })
  },
}

export const getTemplateSchemaTool: McpTool = {
  name: 'get_template_schema',
  description: 'Get the full metadata and resolved dependency schema for a specific template',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Template ID (e.g. web-nextjs)',
      },
    },
    required: ['id'],
  },
  async handler(input) {
    const { id } = input as { id: string }
    const template = getTemplate(id)
    if (!template) {
      return {
        ok: false,
        error: 'TEMPLATE_NOT_FOUND',
        template: id,
      }
    }
    return { ok: true, template }
  },
}

export const ALL_TOOLS: McpTool[] = [listTemplatesTool, scaffoldProjectTool, getTemplateSchemaTool]
