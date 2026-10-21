const { existsSync, readFileSync } = require('node:fs')
const { join } = require('node:path')

const ENV_FILES = ['.env', '.env.local', '.env.production', '.env.production.local']
const ASSIGNMENT_PATTERN = /^(?:export\s+)?EXPO_PUBLIC_AGENT_API_KEY\s*=\s*["']?[^\s"'#][^\s#]*/
const ERROR_MESSAGE =
  'EXPO_PUBLIC_AGENT_API_KEY is set for a production build. Public Expo values are embedded in release bundles; use an authenticated server-side proxy instead.'

function fail(location) {
  console.error(`${location}: ${ERROR_MESSAGE}`)
  process.exit(1)
}

function verifyProductionEnv({ productionOnly = false } = {}) {
  if (productionOnly && process.env.NODE_ENV !== 'production') return
  if (process.env.EXPO_PUBLIC_AGENT_API_KEY) fail('Build environment')

  for (const file of ENV_FILES) {
    const path = join(__dirname, '..', file)
    if (!existsSync(path)) continue

    const offendingLine = readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .find((line) => ASSIGNMENT_PATTERN.test(line.trim()))

    if (offendingLine) fail(file)
  }
}

if (require.main === module) verifyProductionEnv()

module.exports = { verifyProductionEnv }
