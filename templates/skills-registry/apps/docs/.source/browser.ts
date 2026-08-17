// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser'
import type * as Config from '../source.config'

const create = browser<
  typeof Config,
  import('fumadocs-mdx/runtime/types').InternalTypeConfig & {
    DocData: {}
  }
>()
const browserCollections = {
  docs: create.doc('docs', {
    'index.mdx': () => import('../content/docs/index.mdx?collection=docs'),
    'changelog/index.mdx': () => import('../content/docs/changelog/index.mdx?collection=docs'),
    'decisions/turbo-package-manager.mdx': () =>
      import('../content/docs/decisions/turbo-package-manager.mdx?collection=docs'),
    'roadmap/index.mdx': () => import('../content/docs/roadmap/index.mdx?collection=docs'),
    'skills/example-skill.mdx': () =>
      import('../content/docs/skills/example-skill.mdx?collection=docs'),
    'template/gates.mdx': () => import('../content/docs/template/gates.mdx?collection=docs'),
    'template/getting-started.mdx': () =>
      import('../content/docs/template/getting-started.mdx?collection=docs'),
    'template/skill-authoring.mdx': () =>
      import('../content/docs/template/skill-authoring.mdx?collection=docs'),
  }),
}
export default browserCollections
