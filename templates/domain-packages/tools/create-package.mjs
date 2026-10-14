#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const toolRoot = dirname(fileURLToPath(import.meta.url))
const defaultWorkspaceRoot = resolve(toolRoot, '..')

function usage() {
  return `Create a conforming domain package.

Usage:
  pnpm create:package                              # interactive human mode
  pnpm create:package --spec package-spec.json     # non-interactive agent/CI mode
  node tools/create-package.mjs --id example-domain --intent "..." [--display-name ...] [--owner ...]
  node tools/create-package.mjs --spec package-spec.json --repo-root /path/to/workspace
`
}

function parseArgs(argv) {
  const options = {
    spec: null,
    id: null,
    intent: null,
    displayName: null,
    owner: null,
    repoRoot: defaultWorkspaceRoot,
    quiet: false,
    help: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const next = () => {
      if (index + 1 >= argv.length) throw new Error(`${argument} requires a value`)
      index += 1
      return argv[index]
    }
    if (argument === '--spec') options.spec = resolve(next())
    else if (argument === '--id') options.id = next()
    else if (argument === '--intent') options.intent = next()
    else if (argument === '--display-name') options.displayName = next()
    else if (argument === '--owner') options.owner = next()
    else if (argument === '--repo-root') options.repoRoot = resolve(next())
    else if (argument === '--quiet') options.quiet = true
    else if (argument === '--help' || argument === '-h') options.help = true
    else throw new Error(`unknown argument: ${argument}`)
  }
  return options
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function writeText(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, value)
}

function fail(message) {
  console.error(`create-package: ${message}`)
  process.exit(1)
}

function hasExplicitFields(options) {
  return Boolean(options.id ?? options.intent ?? options.displayName ?? options.owner)
}

function defaultDisplayName(id) {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function ask(question, defaultValue) {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await readline.question(
      defaultValue ? `${question} (${defaultValue}): ` : `${question}: `,
    )
    return answer.trim() || defaultValue || ''
  } finally {
    readline.close()
  }
}

async function promptSpec() {
  const id = await ask('Domain package id (kebab-case)')
  const intent = await ask('One-sentence domain intent (at least 20 characters)')
  const displayName = (await ask('Display name', defaultDisplayName(id))) || defaultDisplayName(id)
  const owner = (await ask('Owner', '@product-team')) || '@product-team'

  return {
    id,
    displayName,
    intent,
    owner,
    lifecycle: 'active',
    repositoryClass: 'product',
    hasWeb: true,
  }
}

async function loadSpec(options, repositoryRoot) {
  const explicitFields = hasExplicitFields(options)

  if (options.spec && explicitFields) {
    fail('use either --spec or explicit id/intent fields, not both')
  }

  if (options.spec) {
    if (!existsSync(options.spec)) {
      fail(
        `package spec file not found: ${options.spec}\n` +
          'Create it from schemas/package-spec.schema.json, or run `pnpm create:package` without --spec in an interactive terminal.',
      )
    }
    try {
      const spec = JSON.parse(readFileSync(options.spec, 'utf8'))
      if (typeof spec !== 'object' || spec === null || Array.isArray(spec)) {
        fail(`package spec must contain a JSON object: ${options.spec}`)
      }
      return spec
    } catch (error) {
      if (error instanceof SyntaxError) {
        fail(`package spec is not valid JSON: ${options.spec}\n${error.message}`)
      }
      throw error
    }
  }

  if (explicitFields) {
    if (!options.id || !options.intent) {
      fail('explicit generator input requires both --id and --intent')
    }
    return {
      id: options.id,
      displayName: options.displayName ?? defaultDisplayName(options.id),
      intent: options.intent,
      owner: options.owner ?? '@product-team',
      lifecycle: 'active',
      repositoryClass: 'product',
      hasWeb: true,
    }
  }

  if (!process.stdin.isTTY) {
    fail(
      '--spec is required in non-interactive mode. Provide a package-spec.json, or pass --id and --intent explicitly.',
    )
  }

  return promptSpec()
}

function validateSpec(spec) {
  const errors = []
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.id ?? '')) errors.push('id must be kebab-case')
  for (const key of ['displayName', 'intent', 'owner']) {
    if (typeof spec[key] !== 'string' || spec[key].trim() === '') errors.push(`${key} is required`)
  }
  if (typeof spec.intent !== 'string' || spec.intent.trim().length < 20) {
    errors.push('intent must be at least 20 characters')
  }
  if (spec.lifecycle !== 'active') errors.push('created formal packages must use lifecycle active')
  if (spec.repositoryClass !== 'product')
    errors.push('created formal packages must use repositoryClass product')
  if (spec.hasWeb === false && typeof spec.noWebException !== 'object') {
    errors.push('hasWeb=false requires noWebException')
  }
  if (spec.hasWeb === false) {
    const exception = spec.noWebException ?? {}
    if (typeof exception.reason !== 'string' || exception.reason.trim().length < 20) {
      errors.push('noWebException.reason must be at least 20 characters')
    }
    if (typeof exception.approvedBy !== 'string' || exception.approvedBy.trim() === '') {
      errors.push('noWebException.approvedBy is required')
    }
  }
  if (errors.length > 0) fail(errors.join('; '))
  return {
    id: spec.id,
    displayName: spec.displayName,
    intent: spec.intent.trim(),
    owner: spec.owner,
    version: spec.version ?? '0.1.0',
    lifecycle: 'active',
    repositoryClass: 'product',
    residency: 'external',
    hasWeb: spec.hasWeb ?? true,
    artifactChannel: spec.artifactChannel ?? 'pending',
    noWebException: spec.hasWeb === false ? spec.noWebException : undefined,
  }
}

function jsonSchema(properties, required = []) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  }
}

function descriptor({ id, kind, title, description, access, risk, whenToUse }) {
  return {
    id,
    kind,
    title,
    description,
    inputSchema: jsonSchema({}),
    outputSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      additionalProperties: true,
    },
    effects: { read: true, write: false, delete: false },
    idempotency: 'natural',
    cancellable: false,
    errors: [
      {
        code: 'not_ready',
        category: 'system',
        message: 'The package runtime is not ready.',
        retryable: true,
      },
    ],
    examples: [{ name: title, input: {} }],
    access,
    risk,
    whenToUse,
    whenNotToUse: 'Do not use this capability to bypass a declared Web action.',
  }
}

function packageFiles(spec, standards) {
  const capabilitySlug = `${spec.id}.workbench.get-state`.replaceAll('.', '-')
  const capabilityFiles = spec.hasWeb
    ? [
        `${capabilitySlug}.json`,
        'system-health.json',
        'web-surface-describe.json',
        'web-surface-state.json',
      ]
    : ['system-health.json']
  const files = {
    'package.json': {
      name: `@thefoolai/domain-package-${spec.id}`,
      version: spec.version,
      description: spec.intent,
      type: 'module',
      scripts: spec.hasWeb ? { 'start:web': 'pnpm --dir ../.. --filter web start' } : {},
      license: 'Apache-2.0',
    },
    'contract.json': {
      id: spec.id,
      ownership: { dataOwner: 'user' },
      constraints: {
        specVersion: '=0.6.0',
        protocolVersion: '=2.0.0',
        contentVersion: `=${spec.version}`,
      },
      scopeBoundary: {
        in: [spec.intent],
        out: [
          'package-owned LLM calls, agent loops, conversation context, or tool policy',
          'unrelated domain work that belongs in another package',
        ],
        outOfScopeAction: 'redirect_workspace',
      },
      hasWeb: spec.hasWeb,
    },
    'declarations.json': {
      starterPrompts: [
        `帮我开始：${spec.displayName}`,
        `查看当前 ${spec.displayName} 状态`,
        `为 ${spec.displayName} 制定下一步`,
      ],
    },
    'template.json': {
      id: `${spec.id}-outcome`,
      sections: [
        { kind: 'fields', heading: '领域意图', fields: [{ name: 'intent', label: 'Intent' }] },
        { kind: 'text', heading: '当前状态', from: 'stateSummary' },
        { kind: 'text', heading: '下一步', from: 'nextStep' },
      ],
    },
    'truth.json': {
      schemaVersion: '1.0.0',
      materials: [
        ...(spec.hasWeb
          ? [
              {
                id: `${spec.id}-web-runtime`,
                title: 'Generated package Web runtime',
                truthClass: 'package-canonical',
                paths: ['web/**'],
              },
            ]
          : []),
      ],
    },
    'upgrade.json': {
      schemaVersion: '1.0.0',
      migrationRequired: false,
      backupRequired: false,
      rollbackSupported: false,
      fromVersions: [`>=${spec.version} <1.0.0`],
      preUpgrade: null,
      postUpgrade: null,
      decision: `${spec.version} is the first generated package runtime; no installed user data migration is declared.`,
    },
    'system-prompt.md': [
      `You are the App Agent surface for the "${spec.id}" domain package.`,
      '',
      `Outcome: ${spec.intent}`,
      '',
      'Use package capabilities and the package Web workbench for domain state. Do not invent capabilities,',
      'do not call an LLM from the package, and do not treat chat history as the package system of record.',
      '',
    ].join('\n'),
    'roadmap.yaml': [
      'scope: package',
      `title: ${spec.displayName}`,
      `packageVersion: ${spec.version}`,
      '',
      'now:',
      '  - id: DP-1',
      '    title: Validate the generated package surface and first domain workflow',
      '    status: in-progress',
      '',
      'next: []',
      'later: []',
      'wont:',
      '  - Package-owned LLM calls or a second agent runtime',
      '',
    ].join('\n'),
    'AGENTS.md': [
      `# ${spec.displayName} package`,
      '',
      'Start with `contract.json`, `agent/surface.json`, and `roadmap.yaml`.',
      '',
      '## Verification',
      '',
      '```bash',
      `pnpm check:${spec.id}`,
      `pnpm build:${spec.id}-package`,
      '```',
      '',
      'Generated `web/` output is never edited or committed.',
      '',
    ].join('\n'),
    'agent/surface.json': {
      surfaceVersion: '1.0.0',
      identity: {
        packageId: spec.id,
        version: spec.version,
        purpose: spec.intent,
        audience: ['user', 'App Agent'],
      },
      directoryGuide: [
        { path: 'agent/', role: 'Machine-readable package and Web surfaces.', contextTier: 'L1' },
        { path: 'capabilities/', role: 'Package capability catalog.', contextTier: 'L1' },
        { path: 'resources/', role: 'Reviewed domain resources.', contextTier: 'L1' },
        { path: 'skills/', role: 'On-demand domain workflow.', contextTier: 'L2' },
        { path: 'wiki/', role: 'Knowledge vault seed only.', contextTier: 'L2' },
        ...(spec.hasWeb
          ? [{ path: 'web/', role: 'Generated package Web runtime.', contextTier: 'L1' }]
          : []),
      ],
      capabilitySummary: spec.hasWeb
        ? [
            {
              id: `${spec.id}.workbench.get-state`,
              title: 'Read the current workbench state',
              access: 'agent',
              risk: 'low',
              contextTier: 'L1',
            },
          ]
        : [],
      contextBudget: { maxL0Characters: 4000 },
      standards,
    },
    'agent/web-surface.json': {
      surfaceVersion: '1.0.0',
      routes: [
        {
          routeId: 'workbench',
          path: '/$locale',
          purpose: `Left Agent panel plus right ${spec.displayName} workbench for current state, artifacts, review, and next action.`,
          preconditions: ['The package Web runtime reports ready.'],
          actions: [
            {
              actionId: 'workbench:getState',
              label: 'Read workbench state',
              purpose: 'Return the current domain state summary and next action without writing.',
              inputSchema: jsonSchema({}),
              effects: { read: true, write: false, delete: false },
              authorization: { required: true, audience: 'agent', risk: 'low' },
              agentSafe: true,
              capabilityId: `${spec.id}.workbench.get-state`,
            },
          ],
          elements: [
            {
              agentId: 'workbench.state',
              label: 'Domain state',
              purpose: 'Current task, stage, key object, and next action.',
              inputShape: 'read-only',
              sideEffects: [],
              permissions: [],
              agentInvocable: true,
              actionId: 'workbench:getState',
            },
          ],
          capabilities: [],
          state: [
            { key: 'stage', purpose: 'Current domain stage.', agentVisible: true },
            { key: 'artifact', purpose: 'Current reviewable artifact.', agentVisible: true },
          ],
        },
      ],
    },
    'capabilities/index.json': {
      protocolVersion: '=2.0.0',
      capabilities: capabilityFiles,
      requiredHostCapabilities: [],
      optionalHostCapabilities: [],
    },
    [`capabilities/${capabilitySlug}.json`]: descriptor({
      id: `${spec.id}.workbench.get-state`,
      kind: 'query',
      title: 'Read workbench state',
      description: 'Return the current package workbench state summary and next action.',
      access: { web: true, agent: true, host: false },
      risk: 'low',
      whenToUse: 'Use before proposing the next domain action.',
    }),
    'capabilities/system-health.json': descriptor({
      id: 'system.health',
      kind: 'system',
      title: 'Runtime health',
      description: 'Read package runtime readiness without exposing user data.',
      access: { web: false, agent: true, host: true },
      risk: 'low',
      whenToUse: 'Use before relying on the package Web runtime.',
    }),
    'capabilities/web-surface-describe.json': descriptor({
      id: 'web.surface.describe',
      kind: 'query',
      title: 'Describe package Web surface',
      description: 'Return the declared package Web routes, actions, elements, and state keys.',
      access: { web: true, agent: true, host: false },
      risk: 'low',
      whenToUse: 'Use before interacting with the Web workbench.',
    }),
    'capabilities/web-surface-state.json': descriptor({
      id: 'web.surface.state',
      kind: 'query',
      title: 'Read package Web state',
      description: 'Return current Web runtime and page connection state.',
      access: { web: true, agent: true, host: true },
      risk: 'low',
      whenToUse: 'Use to determine whether page-bound actions are available.',
    }),
    'resources/README.md':
      '# Package resources\n\nAdd reviewed domain resources only; do not duplicate runtime truth.\n',
    'skills/README.md':
      '# Package skills\n\nAdd only long workflows that cannot be served by the Agent Surface.\n',
    'wiki/README.md':
      '# Knowledge vault seed\n\nThis directory is a seed bundle, not the runtime wiki or business truth store.\n',
  }
  if (!spec.hasWeb) {
    delete files['agent/web-surface.json']
    delete files[`capabilities/${capabilitySlug}.json`]
    delete files['capabilities/web-surface-describe.json']
    delete files['capabilities/web-surface-state.json']
  }
  return files
}

function isGeneratedWebProject(appRoot) {
  if (!existsSync(appRoot)) return false
  const entries = readdirSync(appRoot)
  return entries.length > 1 || (entries[0] !== '.gitkeep' && entries.length > 0)
}

function clearInitialWebReservation(appRoot) {
  if (!existsSync(appRoot)) return
  const entries = readdirSync(appRoot)
  if (entries.length === 1 && entries[0] === '.gitkeep') {
    rmSync(appRoot, { recursive: true, force: true })
    return
  }
  throw new Error('apps/web already contains a Web project or unexpected files')
}

async function scaffoldWeb(workspaceRoot, spec, quiet) {
  const appRoot = join(workspaceRoot, 'apps', 'web')
  const lock = readJson(join(workspaceRoot, 'standards-lock.json'))
  try {
    clearInitialWebReservation(appRoot)
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
  const args = [
    '-y',
    `@cogito.ai/cli@${lock.agentdockCliVersion}`,
    'init',
    '--name',
    'web',
    '--display-name',
    spec.displayName,
    '--template',
    'web-tanstackstart',
    '--dir',
    'apps/web',
    '--mode',
    'workspace',
    '--pm',
    'pnpm',
    '--json',
  ]
  const result = spawnSync('npx', args, {
    cwd: workspaceRoot,
    stdio: quiet ? 'ignore' : 'pipe',
    encoding: quiet ? undefined : 'utf8',
  })
  if (result.error || result.status !== 0) {
    return new Error(`agentdock web scaffold exited with ${result.status ?? result.error?.message}`)
  }
  try {
    const generatedPackage = readJson(join(appRoot, 'package.json'))
    if (generatedPackage.name !== 'web') {
      return new Error('agentdock web scaffold did not create the "web" workspace member')
    }
    return null
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
}

function updateWorkspace(workspaceRoot, spec, standards) {
  const rootPackageFile = join(workspaceRoot, 'package.json')
  const rootPackage = readJson(rootPackageFile)
  rootPackage.scripts ??= {}
  if (spec.hasWeb) {
    rootPackage.scripts[`dev:${spec.id}`] = 'pnpm --filter web dev'
    rootPackage.scripts.check = 'node tools/check-workspace.mjs && pnpm --filter web check'
    rootPackage.scripts[`check:${spec.id}`] = 'pnpm --filter web check'
    rootPackage.scripts[`build:${spec.id}-package`] = `node tools/build-package.mjs ${spec.id}`
  } else {
    rootPackage.scripts[`check:${spec.id}`] = 'node tools/check-workspace.mjs'
  }
  writeJson(rootPackageFile, rootPackage)

  const catalogFile = join(workspaceRoot, 'catalog.json')
  const catalog = readJson(catalogFile)
  catalog.updatedAt = new Date().toISOString().slice(0, 10)
  catalog.specVersion = standards['domain-package-workspace']
  catalog.packages.push({
    id: spec.id,
    title: spec.displayName,
    packageVersion: spec.version,
    lifecycle: spec.lifecycle,
    repositoryClass: spec.repositoryClass,
    residency: spec.residency,
    owner: spec.owner,
    hasWeb: spec.hasWeb,
    standardsVersion: standards['domain-package-workspace'],
    artifactChannel: spec.artifactChannel,
    contextEntry: `apps/${spec.id}/AGENTS.md`,
    ...(spec.noWebException ? { noWebException: spec.noWebException } : {}),
  })
  writeJson(catalogFile, catalog)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(usage())
    return
  }
  const workspaceRoot = options.repoRoot
  const lock = readJson(join(workspaceRoot, 'standards-lock.json'))
  const spec = validateSpec(await loadSpec(options, workspaceRoot))
  const packageRoot = join(workspaceRoot, 'apps', spec.id)
  const appRoot = join(workspaceRoot, 'apps', 'web')
  if (existsSync(packageRoot) || isGeneratedWebProject(appRoot)) {
    fail(`package path already exists: ${spec.id}`)
  }

  for (const [relativePath, value] of Object.entries(packageFiles(spec, lock.standards))) {
    const target = join(packageRoot, relativePath)
    if (relativePath.endsWith('.json')) writeJson(target, value)
    else writeText(target, value)
  }

  if (spec.hasWeb) {
    const error = await scaffoldWeb(workspaceRoot, spec, options.quiet)
    if (error) {
      rmSync(packageRoot, { recursive: true, force: true })
      rmSync(appRoot, { recursive: true, force: true })
      fail(error.message)
    }
  }
  updateWorkspace(workspaceRoot, spec, lock.standards)
  console.log(`Created package ${spec.id} at ${packageRoot}`)
}

try {
  await main()
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
