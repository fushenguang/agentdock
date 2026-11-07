import {
  cleanupFixture,
  checkFixtureTypes,
  createFixture,
  installIntegration,
  PACKAGE_ROOT,
  scaffoldTemplates,
} from './lib/fixture.mjs'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript'

const TEMPLATE_DIR = join(PACKAGE_ROOT, 'templates')
const IMPORT_ALLOWLIST = [
  /^react$/,
  /^@astryxdesign\/core\//,
  /^@tanstack\/react-router$/,
  /^@stylexjs\/stylex$/,
  /^@\/components(?:\/.*)?$/,
  /^@\/i18n$/,
]
const PROHIBITED_IDENTIFIERS = new Set([
  'CSSProperties',
  'Theme',
  'AppShell',
  'matchMedia',
  'useMediaQuery',
])

function addFinding(findings, file, rule, message) {
  findings.push({ file, rule, message })
}

function walk(node, visit) {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

function textOf(node, source) {
  return node.getText(source)
}

function importedModule(node) {
  return ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : null
}

function parseMessages(source, file, findings) {
  const blocks = [...source.matchAll(/\/\*\s*astryx-messages\s*([\s\S]*?)\*\//g)]
  if (blocks.length !== 1) {
    addFinding(findings, file, 'messages', 'expected exactly one astryx-messages block')
    return null
  }
  if (!source.trimEnd().endsWith(blocks[0][0])) {
    addFinding(findings, file, 'messages', 'astryx-messages must be the final block')
  }

  try {
    return JSON.parse(blocks[0][1])
  } catch {
    addFinding(findings, file, 'messages', 'astryx-messages must contain valid JSON')
    return null
  }
}

export function scanTemplateSource(source, file) {
  const findings = []
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const messages = parseMessages(source, file, findings)
  const usedKeys = new Set()

  if (source.includes('@media')) {
    addFinding(findings, file, 'viewport-query', 'viewport media queries are prohibited')
  }

  walk(sourceFile, (node) => {
    const moduleName = importedModule(node)
    if (moduleName && !IMPORT_ALLOWLIST.some((pattern) => pattern.test(moduleName))) {
      addFinding(findings, file, 'import', `import is not allowed: ${moduleName}`)
    }

    if (ts.isJsxAttribute(node) && node.name.getText(sourceFile) === 'style') {
      addFinding(findings, file, 'style-attribute', 'style attributes are prohibited')
    }

    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(sourceFile) === 'div'
    ) {
      addFinding(findings, file, 'layout-div', 'layout <div> is prohibited')
    }

    if (ts.isIdentifier(node) && PROHIBITED_IDENTIFIERS.has(node.text)) {
      addFinding(findings, file, 'prohibited-api', `${node.text} is prohibited`)
    }

    if (ts.isJsxText(node) && /[A-Za-z]/.test(node.getText(sourceFile))) {
      addFinding(findings, file, 'jsx-text', 'JSX text must go through the translator')
    }

    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(node.text)
    ) {
      addFinding(findings, file, 'color-literal', `color literal is prohibited: ${node.text}`)
    }

    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      node.text.startsWith('page.__PAGE__.')
    ) {
      usedKeys.add(node.text)
    }

    if (ts.isTemplateExpression(node) && node.head.text.startsWith('page.__PAGE__.') && !messages) {
      addFinding(findings, file, 'translator-key', 'dynamic translator key has no message catalog')
    }
  })

  if (messages) {
    const enKeys = Object.keys(messages.en ?? {}).sort()
    const zhKeys = Object.keys(messages['zh-CN'] ?? {}).sort()
    if (enKeys.join('\n') !== zhKeys.join('\n')) {
      addFinding(findings, file, 'messages', 'en and zh-CN message keys must match')
    }
    for (const key of usedKeys) {
      if (!(key in (messages.en ?? {}))) {
        addFinding(findings, file, 'translator-key', `translated key is missing: ${key}`)
      }
    }
    for (const match of source.matchAll(/t\(`(page\.__PAGE__\.[^`$]*)\$\{/g)) {
      if (!enKeys.some((key) => key.startsWith(match[1]))) {
        addFinding(
          findings,
          file,
          'translator-key',
          `dynamic key prefix has no messages: ${match[1]}`,
        )
      }
    }
  }

  return findings
}

function proveTheCheckBites() {
  const temp = mkdtempSync(join(tmpdir(), 'astryx-web-bad-template-'))
  const file = join(temp, 'bad.tsx')
  const source = `import { BellIcon } from "@heroicons/react/24/outline";
import { useMediaQuery } from "somewhere";

export default function Bad() {
  const isWide = useMediaQuery("(min-width: 900px)");
  return <div style={{ color: "#fff" }}>Visible English {isWide ? "wide" : "narrow"}</div>;
}

/*
astryx-messages
{"en":{"page.__PAGE__.title":"Bad"},"zh-CN":{"page.__PAGE__.title":"坏"}}
*/`
  try {
    writeFileSync(file, source)
    const findings = scanTemplateSource(readFileSync(file, 'utf8'), file)
    const expected = ['import', 'style-attribute', 'layout-div', 'jsx-text']
    for (const rule of expected) {
      if (!findings.some((finding) => finding.rule === rule)) {
        throw new Error(`self-check did not report ${rule}`)
      }
    }
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
}

function checkSources() {
  const findings = []
  for (const name of readdirSync(TEMPLATE_DIR)
    .filter((entry) => entry.endsWith('.tsx'))
    .sort()) {
    const file = join(TEMPLATE_DIR, name)
    findings.push(...scanTemplateSource(readFileSync(file, 'utf8'), file))
  }
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`${finding.file}: ${finding.rule}: ${finding.message}`)
    }
    throw new Error(`${findings.length} template source finding(s)`)
  }
}

proveTheCheckBites()
checkSources()

const fixture = createFixture()
try {
  installIntegration(fixture)
  const templates = scaffoldTemplates(fixture)
  checkFixtureTypes(fixture)
  console.log(`Checked ${templates.length} templates in the web-tanstackstart fixture.`)
} finally {
  cleanupFixture(fixture)
}
