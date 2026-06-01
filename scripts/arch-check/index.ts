import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

type CheckTarget = {
  name: string
  cwd: string
  srcPath: string
}

function listWorkspaceDirs(root: string, container: string): string[] {
  const containerPath = join(root, container)
  if (!existsSync(containerPath)) return []

  return readdirSync(containerPath)
    .map((name) => join(containerPath, name))
    .filter((fullPath) => statSync(fullPath).isDirectory())
}

function collectTargets(root: string): CheckTarget[] {
  const candidates = ['apps', 'packages', 'templates']
  const targets: CheckTarget[] = []

  const rootSrc = join(root, 'src')
  if (existsSync(rootSrc) && statSync(rootSrc).isDirectory()) {
    targets.push({
      name: '.',
      cwd: root,
      srcPath: rootSrc,
    })
  }

  for (const candidate of candidates) {
    const dirs = listWorkspaceDirs(root, candidate)
    for (const dir of dirs) {
      const srcPath = join(dir, 'src')
      if (!existsSync(srcPath) || !statSync(srcPath).isDirectory()) continue
      targets.push({
        name: dir.replace(`${root}/`, ''),
        cwd: dir,
        srcPath,
      })
    }
  }

  return targets
}

function runArchCheck(root: string, target: CheckTarget): number {
  const configPath = resolve(root, '.dependency-cruiser.cjs')
  const result = spawnSync(
    'pnpm',
    ['exec', 'dependency-cruiser', '--config', configPath, '--output-type', 'err', 'src'],
    {
      cwd: target.cwd,
      stdio: 'inherit',
    },
  )

  return result.status ?? 1
}

function main() {
  const root = process.cwd()
  const targets = collectTargets(root)

  if (targets.length === 0) {
    console.log('arch:check: no workspace with src/ directory found, skipping.')
    process.exit(0)
  }

  console.log(`arch:check: scanning ${targets.length} workspace(s)`)

  let failed = false
  for (const target of targets) {
    console.log(`\narch:check: ${target.name}`)
    const code = runArchCheck(root, target)
    if (code !== 0) failed = true
  }

  process.exit(failed ? 1 : 0)
}

main()
