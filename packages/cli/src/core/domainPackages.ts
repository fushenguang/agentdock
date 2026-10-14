import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export interface DomainPackageOnboardingInput {
  id?: string | undefined
  intent?: string | undefined
  displayName?: string | undefined
  owner?: string | undefined
  spec?: string | undefined
}

export interface DomainPackageCreationSuccess {
  ok: true
  id: string
  packagePath: string
  webPath: string
}

export interface DomainPackageCreationFailure {
  ok: false
  error: 'DOMAIN_PACKAGE_GENERATOR_NOT_FOUND' | 'DOMAIN_PACKAGE_CREATION_FAILED'
  message: string
  stderr?: string
}

export type DomainPackageCreationResult =
  | DomainPackageCreationSuccess
  | DomainPackageCreationFailure

function readPackageIdFromSpec(specPath: string): string | undefined {
  try {
    const spec = JSON.parse(readFileSync(specPath, 'utf8')) as { id?: unknown }
    return typeof spec.id === 'string' ? spec.id : undefined
  } catch {
    return undefined
  }
}

export function createDomainPackage(options: {
  targetDir: string
  input: DomainPackageOnboardingInput
  quiet?: boolean
}): DomainPackageCreationResult {
  const generator = join(options.targetDir, 'tools', 'create-package.mjs')
  if (!existsSync(generator)) {
    return {
      ok: false,
      error: 'DOMAIN_PACKAGE_GENERATOR_NOT_FOUND',
      message: `Domain package generator is missing: ${generator}`,
    }
  }

  const args = [
    generator,
    '--repo-root',
    options.targetDir,
    ...(options.quiet ? ['--quiet'] : []),
    ...(options.input.spec
      ? ['--spec', options.input.spec]
      : [
          ...(options.input.id ? ['--id', options.input.id] : []),
          ...(options.input.intent ? ['--intent', options.input.intent] : []),
          ...(options.input.displayName ? ['--display-name', options.input.displayName] : []),
          ...(options.input.owner ? ['--owner', options.input.owner] : []),
        ]),
  ]

  const result = spawnSync(process.execPath, args, {
    cwd: options.targetDir,
    encoding: options.quiet ? 'utf8' : undefined,
    stdio: options.quiet ? 'pipe' : 'inherit',
  })

  if (result.error) {
    return {
      ok: false,
      error: 'DOMAIN_PACKAGE_CREATION_FAILED',
      message: result.error.message,
    }
  }
  if (result.status !== 0) {
    const stderr = typeof result.stderr === 'string' ? result.stderr : result.stderr?.toString()
    return {
      ok: false,
      error: 'DOMAIN_PACKAGE_CREATION_FAILED',
      message: `Domain package generator exited with status ${result.status}.`,
      ...(stderr ? { stderr } : {}),
    }
  }

  const id =
    options.input.id ?? (options.input.spec ? readPackageIdFromSpec(options.input.spec) : undefined)
  if (!id) {
    return {
      ok: false,
      error: 'DOMAIN_PACKAGE_CREATION_FAILED',
      message: 'Domain package generator did not report a package id.',
    }
  }

  return {
    ok: true,
    id,
    packagePath: join(options.targetDir, 'apps', id),
    webPath: join(options.targetDir, 'apps', 'web'),
  }
}
