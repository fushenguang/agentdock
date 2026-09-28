import { join } from 'path'
import { getTemplates, getTemplate, getIntegrations } from '../../core/registry.js'
import { scaffoldProject } from '../../core/scaffold.js'
import { INIT_MODES, isInitMode, type InitMode } from '../../core/workspace.js'
import { normalizeIntegrations } from '../../core/integrations.js'

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

export const SCAFFOLD_PROJECT_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: {
      type: 'string',
      description: 'Project name (used as directory name and package name)',
    },
    displayName: {
      type: 'string',
      description: 'Human-facing title substituted into generated source. Defaults to name.',
    },
    template: {
      type: 'string',
      description: 'Template ID (e.g. web-tanstackstart)',
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
    dataLayer: {
      type: 'string',
      enum: ['supabase', 'drizzle', 'sqlite'],
      description: 'Template-dependent data layer. Defaults to the selected template default.',
    },
    schema: {
      type: 'string',
      description: 'Supabase schema name. Defaults to public when supported.',
    },
    integrations: {
      type: 'array',
      items: {
        type: 'string',
        enum: getIntegrations().map((integration) => integration.id),
      },
      uniqueItems: true,
      default: [],
      description: 'Optional integrations to compose onto the selected template.',
    },
  },
  required: ['name', 'template'],
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
    const integrations = getIntegrations()
    return {
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        minCliVersion: t.minCliVersion,
        workspaceMember: Boolean(t.workspaceMember),
        integrations: integrations
          .filter((integration) => integration.compatibleTemplates.includes(t.id))
          .map((integration) => integration.id),
      })),
    }
  },
}

export const scaffoldProjectTool: McpTool = {
  name: 'scaffold_project',
  description: 'Scaffold a new AgentDock project from a template into the specified directory',
  inputSchema: SCAFFOLD_PROJECT_INPUT_SCHEMA,
  async handler(input) {
    const {
      name,
      template: templateId,
      targetDir,
      packageManager,
      mode,
      displayName,
      dataLayer,
      schema,
      integrations,
    } = input as {
      name: string
      template: string
      targetDir?: string
      packageManager?: 'pnpm' | 'npm' | 'yarn' | 'bun'
      mode?: string
      displayName?: string
      dataLayer?: string
      schema?: string
      integrations?: unknown
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
    const effectiveDataLayer = dataLayer ?? template.defaultDataLayer
    const normalizedIntegrations = normalizeIntegrations(integrations)

    return scaffoldProject({
      targetDir: resolvedTargetDir,
      name,
      template,
      packageManager: packageManager ?? 'pnpm',
      mode: (mode as InitMode | undefined) ?? 'auto',
      dataLayer: effectiveDataLayer,
      ...(effectiveDataLayer === 'supabase' && template.supportsSchema
        ? { schema: schema ?? 'public' }
        : {}),
      ...(displayName !== undefined ? { displayName } : {}),
      ...(normalizedIntegrations.length > 0 ? { integrations: normalizedIntegrations } : {}),
    })
  },
}

export const getTemplateSchemaTool: McpTool = {
  name: 'get_template_schema',
  description: 'Get the full metadata and resolved dependency schema for a specific template',
  inputSchema: {
    type: 'object',
    properties: {
      templateId: {
        type: 'string',
        description: 'Template ID (e.g. web-nextjs)',
      },
      id: {
        type: 'string',
        description: 'Legacy template ID alias for templateId.',
      },
    },
    required: [],
  },
  async handler(input) {
    const { templateId, id } = input as { templateId?: string; id?: string }
    const resolvedTemplateId = templateId ?? id
    if (!resolvedTemplateId) {
      return {
        ok: false,
        error: 'MISSING_ARG',
        field: 'templateId',
      }
    }
    const template = getTemplate(resolvedTemplateId)
    if (!template) {
      return {
        ok: false,
        error: 'TEMPLATE_NOT_FOUND',
        template: resolvedTemplateId,
      }
    }
    const supportedIntegrations = getIntegrations()
      .filter((integration) => integration.compatibleTemplates.includes(resolvedTemplateId))
      .map((integration) => integration.id)

    return {
      ok: true,
      template,
      initParams: {
        ...SCAFFOLD_PROJECT_INPUT_SCHEMA,
        properties: {
          ...SCAFFOLD_PROJECT_INPUT_SCHEMA.properties,
          integrations: {
            ...SCAFFOLD_PROJECT_INPUT_SCHEMA.properties.integrations,
            items: {
              type: 'string',
              ...(supportedIntegrations.length > 0 ? { enum: supportedIntegrations } : {}),
            },
          },
        },
      },
    }
  },
}

export const ALL_TOOLS: McpTool[] = [listTemplatesTool, scaffoldProjectTool, getTemplateSchemaTool]
