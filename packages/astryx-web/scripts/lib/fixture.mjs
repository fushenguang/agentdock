import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const REPO_ROOT = resolve(PACKAGE_ROOT, '../..')
const TEMPLATE_ROOT = join(REPO_ROOT, 'templates', 'web-tanstackstart')
const TEMPLATE_IDS = [
  'dock-landing',
  'dock-workbench',
  'dock-list',
  'dock-form-flow',
  'dock-settings',
  'dock-editor-frame',
]

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
    maxBuffer: 20 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    )
  }
  return result.stdout
}

function fixtureBin(fixture, name) {
  return join(fixture, 'node_modules', '.bin', name)
}

export function createFixture() {
  const fixture = mkdtempSync(join(tmpdir(), 'astryx-web-fixture-'))
  cpSync(TEMPLATE_ROOT, fixture, {
    recursive: true,
    filter(source) {
      const name = basename(source)
      return ![
        'node_modules',
        'dist',
        '.output',
        '.tanstack',
        '.turbo',
        'coverage',
        'app.db',
      ].includes(name)
    },
  })
  return fixture
}

export function installIntegration(fixture) {
  run(
    'pnpm',
    ['dlx', 'pnpm@10.34.5', 'add', `link:${PACKAGE_ROOT}`, '--config.engine-strict=false'],
    fixture,
  )
}

export function scaffoldTemplates(fixture) {
  const results = []
  for (const id of TEMPLATE_IDS) {
    const target = `src/components/check-${id}.tsx`
    const stdout = run(fixtureBin(fixture, 'astryx'), ['template', id, target, '--json'], fixture)
    const result = JSON.parse(stdout)
    if ((result.data?.missingPackages ?? []).length > 0) {
      throw new Error(`${id} needs packages the template does not install`)
    }

    const route = `src/routes/$locale/check-${id}.tsx`
    writeFileSync(
      join(fixture, route),
      [
        `import Page from "@/components/check-${id}";`,
        'import { createFileRoute } from "@tanstack/react-router";',
        '',
        `export const Route = createFileRoute("/$locale/check-${id}")({`,
        '  component: Page,',
        '});',
        '',
      ].join('\n'),
    )
    results.push({ id, source: target, route })
  }
  return results
}

export function checkFixtureTypes(fixture) {
  run(fixtureBin(fixture, 'tsr'), ['generate'], fixture)
  run(fixtureBin(fixture, 'tsc'), ['--noEmit'], fixture)
}

export function runAstryxBuild(fixture, intent) {
  return run(fixtureBin(fixture, 'astryx'), ['build', intent, '--json'], fixture)
}

export function cleanupFixture(fixture) {
  rmSync(fixture, { recursive: true, force: true })
}

export function readFixtureFile(fixture, path) {
  return readFileSync(join(fixture, path), 'utf8')
}

export { PACKAGE_ROOT, TEMPLATE_IDS }
