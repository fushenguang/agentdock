import { spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createDomainPackage } from './domainPackages.js'
import { deliverGiteeRepository, giteeTarget } from './giteeRepository.js'
import { getTemplate } from './registry.js'
import { getTemplateSourceDir, scaffoldProject } from './scaffold.js'

const MAX_SPEC_BYTES = 64 * 1024

async function readSpec(source: string) {
  let text: string
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(source)) {
    const url = new URL(source)
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('Online specs require HTTPS without URL credentials')
    }
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) })
    if (!response.ok || !response.body)
      throw new Error(`Spec download failed: HTTP ${response.status}`)
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8', { fatal: true })
    text = ''
    let size = 0
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_SPEC_BYTES) throw new Error('Spec exceeds 64 KiB')
        text += decoder.decode(value, { stream: true })
      }
      text += decoder.decode()
    } finally {
      await reader.cancel().catch(() => {})
    }
  } else {
    const file = lstatSync(source)
    if (!file.isFile() || file.size > MAX_SPEC_BYTES)
      throw new Error('Expected a JSON file up to 64 KiB')
    text = readFileSync(source, 'utf8')
    if (Buffer.byteLength(text) > MAX_SPEC_BYTES) throw new Error('Spec exceeds 64 KiB')
  }
  let input: unknown
  try {
    input = JSON.parse(text)
  } catch {
    throw new Error('Spec is not valid JSON')
  }
  const validator = join(
    getTemplateSourceDir('templates/domain-packages'),
    'tools',
    'validate-spec.mjs',
  )
  const { validateSpec } = await import(pathToFileURL(validator).href)
  if (typeof validateSpec !== 'function')
    throw new Error(
      'Bundled domain package validator is missing. Reinstall or rebuild the AgentDock CLI.',
    )
  const spec: { id: string; hasWeb: boolean } = validateSpec(input)
  if (typeof spec?.id !== 'string' || typeof spec.hasWeb !== 'boolean') {
    throw new Error('Invalid result from the bundled domain package validator')
  }
  return { text, id: spec.id, hasWeb: spec.hasWeb }
}

interface CreationState {
  operationId: string
  specSha256: string
  destination: string | null
  commit?: string
  checks?: string[]
  repoId?: number
}

export async function provisionDomainPackage(options: {
  spec?: string
  dir?: string
  provider?: string
  namespace?: string
  visibility?: string
  'dry-run'?: boolean
}) {
  let phase = 'input'
  let localPath: string | undefined
  try {
    if (!options.spec) throw new Error('--spec is required')
    const spec = await readSpec(options.spec)
    const name = `dp-${spec.id}`
    localPath = resolve(options.dir ?? name)
    const specSha256 = createHash('sha256').update(spec.text).digest('hex')
    const target = giteeTarget(options, name)
    const destination = target ? `${target.url}#${target.visibility}` : null
    const stateFile = join(localPath, '.git', 'agentdock-domain-package.json')
    const state: CreationState | undefined = existsSync(stateFile)
      ? JSON.parse(readFileSync(stateFile, 'utf8'))
      : undefined
    const firstDelivery = Boolean(state?.commit && state.destination === null && target)
    if (
      state?.checks !== undefined &&
      (!Array.isArray(state.checks) || !state.checks.every((check) => typeof check === 'string'))
    ) {
      throw new Error('Invalid check list in the saved domain package creation state')
    }
    if (
      existsSync(localPath) &&
      (!state ||
        state.specSha256 !== specSha256 ||
        (state.destination !== destination && !firstDelivery))
    ) {
      throw new Error('Target directory already exists and does not belong to this creation')
    }
    const result = {
      schemaVersion: 1,
      ok: true as const,
      packageId: spec.id,
      localPath,
      specSha256,
    }
    const checks =
      state?.commit && state.checks
        ? state.checks
        : [
            'check',
            ...(state?.commit ? [] : ['test']),
            ...(spec.hasWeb ? [`build:${spec.id}-package`] : []),
          ]
    if (options['dry-run']) return { ...result, status: 'planned', destination, checks }

    // Never pass the Gitee API token to package scripts or Git.
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CI: 'true',
      GIT_TERMINAL_PROMPT: '0',
      GIT_SSH_COMMAND: 'ssh -o BatchMode=yes',
    }
    delete env.GITEE_TOKEN
    const cwd = localPath
    function run(bin: string, args: string[], optional = false): string | undefined {
      const output = spawnSync(bin, args, {
        cwd,
        env,
        encoding: 'utf8',
        timeout: 600_000,
        maxBuffer: 16 * 1024 * 1024,
      })
      if (output.status === 0) return output.stdout.trim()
      if (optional && output.status === 1) return undefined
      if (output.stdout) process.stderr.write(output.stdout)
      if (output.stderr) process.stderr.write(output.stderr)
      throw new Error(`${bin} ${args.join(' ')} failed: ${output.error?.message ?? output.status}`)
    }
    const creation = state ?? { specSha256, destination, operationId: randomUUID() }
    function save() {
      const temporary = `${stateFile}.${process.pid}`
      writeFileSync(temporary, JSON.stringify(creation) + '\n', { mode: 0o600 })
      renameSync(temporary, stateFile)
    }
    phase = 'scaffold'
    if (!state) {
      const template = getTemplate('domain-packages')
      if (!template) throw new Error('domain-packages template not found')
      const scaffold = scaffoldProject({
        name,
        targetDir: cwd,
        template,
        mode: 'standalone',
        packageManager: template.packageManager,
      })
      if (!scaffold.ok) throw new Error(scaffold.message)
      const specPath = join(cwd, 'package-spec.json')
      writeFileSync(specPath, spec.text, { flag: 'wx' })
      const generated = createDomainPackage({
        targetDir: cwd,
        input: { spec: specPath },
        quiet: true,
        env,
      })
      if (!generated.ok) throw new Error(generated.stderr || generated.message)
      run('git', ['init', '-b', 'main'])
      save()
    }
    phase = 'verify'
    if (!creation.commit) {
      run('pnpm', ['install', '--no-frozen-lockfile'])
      for (const check of checks) run('pnpm', ['run', check])
      if (spec.hasWeb) run('git', ['check-ignore', `apps/${spec.id}/web/`])
      run('git', ['add', '--all'])
      run('git', ['commit', '-m', `chore(${spec.id}): scaffold domain package`])
      creation.commit = run('git', ['rev-parse', 'HEAD'])!
      creation.checks = checks
      save()
    }
    phase = 'git'
    if (firstDelivery) {
      creation.destination = destination
      save()
    }
    const repo = target
      ? await deliverGiteeRepository(
          target,
          creation.operationId,
          creation.commit,
          creation.repoId,
          run,
          (id) => {
            creation.repoId = id
            save()
          },
        )
      : null
    return { ...result, status: 'ready', initialCommitSha: creation.commit, repo, checks }
  } catch (error) {
    return {
      schemaVersion: 1,
      ok: false as const,
      phase,
      localPath,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
