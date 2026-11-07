import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseArgs, routeSlug, sampleFileName } from '../bin/astryx-web.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const cli = join(packageRoot, 'bin', 'astryx-web.mjs')

test('parses repeated sample options and storage', () => {
  const config = parseArgs([
    'samples',
    '--base-url',
    'http://localhost:3000',
    '--route',
    '/zh-CN/settings',
    '--theme',
    'neutral',
    '--mode',
    'light',
    '--mode',
    'dark',
    '--size',
    '390x844',
    '--out',
    'samples',
    '--storage',
    'session=abc',
    'density=compact',
  ])
  assert.deepEqual(config.modes, ['light', 'dark'])
  assert.deepEqual(config.sizes, [{ width: 390, height: 844 }])
  assert.deepEqual(config.storage, { session: 'abc', density: 'compact' })
})

test('makes stable route slugs and file names', () => {
  assert.equal(routeSlug('/'), 'root')
  assert.equal(routeSlug('/zh-CN/settings'), 'zh-CN-settings')
  assert.equal(
    sampleFileName('/zh-CN/settings', 'neutral', 'dark', { width: 1440, height: 900 }),
    'zh-CN-settings__neutral__dark__1440x900.png',
  )
})

test('names CHROME_PATH when it is missing', () => {
  const env = { ...process.env }
  delete env.CHROME_PATH
  const result = spawnSync(
    process.execPath,
    [
      cli,
      'samples',
      '--base-url',
      'http://localhost:3000',
      '--route',
      '/',
      '--theme',
      'neutral',
      '--mode',
      'light',
      '--size',
      '390x844',
      '--out',
      'samples',
    ],
    { encoding: 'utf8', env },
  )
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}${result.stderr}`, /CHROME_PATH/)
})
