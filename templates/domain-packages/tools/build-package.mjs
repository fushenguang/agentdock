#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'

const repositoryRoot = process.cwd()
const packageId = process.argv[2]

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(packageId ?? '')) {
  console.error('Usage: node tools/build-package.mjs <package-id>')
  process.exit(1)
}

const appRoot = join(repositoryRoot, 'apps', 'web')
const packageRoot = join(repositoryRoot, 'apps', packageId)
const outputRoot = join(packageRoot, 'web')

for (const requiredPath of [
  join(appRoot, 'package.json'),
  join(packageRoot, 'package.json'),
  join(packageRoot, 'contract.json'),
]) {
  if (!existsSync(requiredPath)) {
    console.error(`missing required path: ${requiredPath}`)
    process.exit(1)
  }
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const build = spawnSync(pnpm, ['--filter', 'web', 'build'], {
  cwd: appRoot,
  stdio: 'inherit',
})
if (build.error) throw build.error
if (build.status !== 0) process.exit(build.status ?? 1)

rmSync(outputRoot, { recursive: true, force: true })
mkdirSync(outputRoot, { recursive: true })

for (const assetDirectory of ['client', 'server']) {
  const source = join(appRoot, 'dist', assetDirectory)
  if (existsSync(source)) {
    cpSync(source, join(outputRoot, assetDirectory), { recursive: true })
  }
}
function packagedTextFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const candidate = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...packagedTextFiles(candidate))
    } else if (/\.(?:js|mjs|cjs|json|html|css|map|txt)$/.test(entry.name)) {
      files.push(candidate)
    }
  }
  return files
}

function stripBuildMachinePaths() {
  const absoluteBuildPath =
    /(?:\/(?:Users|home|root|github)\/[^\s"'`]+|\/(?:build|workspace|opt|srv|var)\/[^\s"'`/]+\/[^\s"'`]+|[A-Za-z]:\\(?:Users|home|root|build|workspace|github|opt|srv|var)\\[^\s"'`]+)/
  const leaks = []
  let rewritten = 0

  for (const file of packagedTextFiles(outputRoot)) {
    const source = readFileSync(file, 'utf8')
    let next = source.split(`${appRoot}/`).join('apps/web/')
    next = next.split(`${repositoryRoot}/`).join('')
    if (next !== source) rewritten += 1
    if (absoluteBuildPath.test(next)) leaks.push(file)
    if (next !== source) writeFileSync(file, next)
  }

  if (leaks.length > 0) {
    console.error(
      `packaged output contains build-machine paths:\n  ${leaks
        .map((file) => file.slice(outputRoot.length + 1))
        .join('\n  ')}`,
    )
    process.exit(1)
  }
  console.log(`Rewrote build-machine paths in ${rewritten} packaged file(s); none remain`)
}

stripBuildMachinePaths()

const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const contract = JSON.parse(readFileSync(join(packageRoot, 'contract.json'), 'utf8'))
writeFileSync(
  join(outputRoot, 'package.json'),
  `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
)
writeFileSync(
  join(outputRoot, 'build.json'),
  `${JSON.stringify(
    {
      packageId,
      packageVersion: packageJson.version,
      source: 'apps/web',
      specVersion: contract.constraints?.specVersion ?? null,
      protocolVersion: contract.constraints?.protocolVersion ?? null,
      contentVersion: contract.constraints?.contentVersion ?? null,
      buildChannel: 'agentdock-domain-packages-template',
    },
    null,
    2,
  )}\n`,
)

console.log(`Built ${packageId} web staging at ${resolve(outputRoot)}`)
console.log('The staging directory is ignored by Git and must be packaged by release CI.')
