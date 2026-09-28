import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const enRoot = join(root, 'apps', 'docs', 'content', 'docs', 'en', 'templates')
const zhRoot = join(root, 'apps', 'docs', 'content', 'docs', 'zh', 'templates')
const failures = []

function listFiles(directory) {
  return readdirSync(directory)
    .filter((entry) => statSync(join(directory, entry)).isFile())
    .map((entry) => entry)
    .sort()
}

function parseMeta(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid template docs meta.json: ${path}: ${error.message}`)
    return null
  }
}

function checkDirectory(relativeDirectory) {
  const enDirectory = join(enRoot, relativeDirectory)
  const zhDirectory = join(zhRoot, relativeDirectory)

  if (!existsSync(enDirectory) || !existsSync(zhDirectory)) {
    failures.push(`missing localized template docs directory: ${relativeDirectory}`)
    return
  }

  const enFiles = listFiles(enDirectory)
  const zhFiles = listFiles(zhDirectory)

  if (enFiles.join('\n') !== zhFiles.join('\n')) {
    failures.push(
      `template docs file mismatch for ${relativeDirectory}: en=[${enFiles.join(', ')}] zh=[${zhFiles.join(', ')}]`,
    )
  }

  const enMetaPath = join(enDirectory, 'meta.json')
  const zhMetaPath = join(zhDirectory, 'meta.json')

  if (!existsSync(enMetaPath) || !existsSync(zhMetaPath)) {
    failures.push(`missing template docs meta.json for ${relativeDirectory}`)
    return
  }

  const enMeta = parseMeta(enMetaPath)
  const zhMeta = parseMeta(zhMetaPath)
  if (!enMeta || !zhMeta) return

  if (JSON.stringify(enMeta.pages) !== JSON.stringify(zhMeta.pages)) {
    failures.push(`template docs meta page mismatch for ${relativeDirectory}`)
  }
}

const directoryNames = [...new Set([...readdirSync(enRoot), ...readdirSync(zhRoot)])].sort()

for (const entry of directoryNames) {
  const enPath = join(enRoot, entry)
  const zhPath = join(zhRoot, entry)
  const isDirectory =
    (existsSync(enPath) && statSync(enPath).isDirectory()) ||
    (existsSync(zhPath) && statSync(zhPath).isDirectory())
  if (isDirectory) {
    checkDirectory(entry)
  }
}

if (failures.length > 0) {
  console.error('Template docs parity check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Template docs parity check passed.')
