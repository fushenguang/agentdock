#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function parseArgs(argv) {
  const options = { repoRoot: resolve(dirname(fileURLToPath(import.meta.url)), '..') }
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--repo-root') {
      index += 1
      options.repoRoot = resolve(argv[index])
    } else if (argv[index] === '--help' || argv[index] === '-h') {
      console.log('Usage: node tools/check-workspace.mjs [--repo-root <workspace>]')
      process.exit(0)
    } else {
      throw new Error(`unknown argument: ${argv[index]}`)
    }
  }
  return options
}

const workspaceRoot = parseArgs(process.argv.slice(2)).repoRoot
const errors = []

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function error(message) {
  errors.push(message)
}

function localPackageRoots() {
  return readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .filter((id) => existsSync(join(workspaceRoot, id, 'contract.json')))
}

const catalogFile = join(workspaceRoot, 'catalog.json')
const lockFile = join(workspaceRoot, 'standards-lock.json')
for (const file of [catalogFile, lockFile]) {
  if (!existsSync(file)) error(`missing ${file}`)
}
const catalog = existsSync(catalogFile) ? readJson(catalogFile) : { packages: [] }
const lock = existsSync(lockFile) ? readJson(lockFile) : { standards: {} }
const ids = new Set()

for (const entry of catalog.packages) {
  if (ids.has(entry.id)) error(`duplicate catalog id: ${entry.id}`)
  ids.add(entry.id)
  const packageRoot = join(workspaceRoot, entry.id)
  if (!existsSync(packageRoot)) {
    error(`missing package root: ${entry.id}`)
    continue
  }
  for (const file of ['package.json', 'contract.json', 'agent/surface.json', 'roadmap.yaml']) {
    if (!existsSync(join(packageRoot, file))) error(`${entry.id}/${file} is missing`)
  }
  try {
    const packageJson = readJson(join(packageRoot, 'package.json'))
    const contract = readJson(join(packageRoot, 'contract.json'))
    const surface = readJson(join(packageRoot, 'agent', 'surface.json'))
    if (packageJson.version !== entry.packageVersion)
      error(`${entry.id}: catalog/package version mismatch`)
    if (contract.id !== entry.id) error(`${entry.id}: catalog/contract id mismatch`)
    if (contract.hasWeb !== entry.hasWeb) error(`${entry.id}: catalog/contract hasWeb mismatch`)
    if (surface.identity?.packageId !== entry.id) error(`${entry.id}: surface package id mismatch`)
    if (entry.contextEntry !== `${entry.id}/AGENTS.md`)
      error(`${entry.id}: context entry must be package-local AGENTS.md`)
    if (entry.hasWeb) {
      const webSurfaceFile = join(packageRoot, 'agent', 'web-surface.json')
      if (!existsSync(webSurfaceFile)) {
        error(`${entry.id}/agent/web-surface.json is missing`)
      } else {
        const webSurface = readJson(webSurfaceFile)
        if (!Array.isArray(webSurface.routes) || webSurface.routes.length === 0) {
          error(`${entry.id}: Web surface has no routes`)
        }
        for (const route of webSurface.routes ?? []) {
          for (const action of route.actions ?? []) {
            if (!action.capabilityId || action.agentSafe !== true) {
              error(`${entry.id}: action ${action.actionId ?? '<unknown>'} is not agent-safe`)
            }
          }
        }
      }
      if (!existsSync(join(workspaceRoot, 'apps', `${entry.id}-web`, 'package.json'))) {
        error(`${entry.id}: Web source project is missing`)
      }
    } else if (!entry.noWebException) {
      error(`${entry.id}: formal no-Web package lacks exception`)
    }
    const capabilityIndexFile = join(packageRoot, 'capabilities', 'index.json')
    if (!existsSync(capabilityIndexFile)) {
      error(`${entry.id}/capabilities/index.json is missing`)
    } else {
      const index = readJson(capabilityIndexFile)
      for (const capabilityPath of index.capabilities ?? []) {
        if (capabilityPath.includes('..') || capabilityPath.startsWith('/')) {
          error(`${entry.id}: unsafe capability path ${capabilityPath}`)
          continue
        }
        if (!existsSync(join(packageRoot, 'capabilities', capabilityPath))) {
          error(`${entry.id}: capability file missing ${capabilityPath}`)
        }
      }
    }
  } catch (caught) {
    error(`${entry.id}: ${caught.message}`)
  }
}

for (const id of localPackageRoots()) {
  if (!ids.has(id)) error(`local package missing from catalog: ${id}`)
}

if (!lock.standards?.['domain-package-workspace']) {
  error('standards-lock.json is missing domain-package-workspace version')
}

if (errors.length > 0) {
  console.error(`workspace check failed with ${errors.length} error(s):`)
  for (const message of errors) console.error(`- ${message}`)
  process.exitCode = 1
} else {
  console.log(`workspace check passed (${catalog.packages.length} package(s))`)
}
