import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  cleanupFixture,
  createFixture,
  installIntegration,
  PACKAGE_ROOT,
  runAstryxBuild,
} from './lib/fixture.mjs'

const cases = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'test', 'golden-intents.json'), 'utf8'))
const fixture = createFixture()

try {
  installIntegration(fixture)
  for (const testCase of cases.direct) {
    const response = JSON.parse(runAstryxBuild(fixture, testCase.intent))
    const start = response.data?.start
    if (start?.name !== testCase.name || start?.package !== '@cogito.ai/astryx-web') {
      throw new Error(
        `${testCase.intent}: expected ${testCase.name} from @cogito.ai/astryx-web, got ` +
          `${start?.name ?? 'nothing'} from ${start?.package ?? 'nothing'}`,
      )
    }
  }

  for (const testCase of cases.rejected) {
    const response = JSON.parse(runAstryxBuild(fixture, testCase.intent))
    const start = response.data?.start
    if (start?.name !== 'shell-top-nav' || start?.package !== '@astryxdesign/core') {
      throw new Error(
        `${testCase.intent}: expected the Core app-shell fallback, got ` +
          `${start?.name ?? 'nothing'} from ${start?.package ?? 'nothing'}`,
      )
    }

    const packagePages = (response.data?.pages ?? []).filter(
      (page) => page.package === '@cogito.ai/astryx-web',
    )
    const rank = packagePages.findIndex((page) => page.name === testCase.name)
    if (rank < 0 || rank >= 3) {
      throw new Error(
        `${testCase.intent}: expected ${testCase.name} among the first three ` +
          `@cogito.ai/astryx-web pages, got ${packagePages
            .slice(0, 3)
            .map((page) => page.name)
            .join(', ')}`,
      )
    }
  }

  const version = JSON.parse(
    readFileSync(join(fixture, 'node_modules', '@astryxdesign', 'core', 'package.json'), 'utf8'),
  ).version
  console.log(
    `Checked ${cases.direct.length} direct and ${cases.rejected.length} rejected ` +
      `golden intents with Astryx ${version}.`,
  )
} finally {
  cleanupFixture(fixture)
}
