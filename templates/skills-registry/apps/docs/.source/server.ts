// @ts-nocheck
import * as __fd_glob_13 from '../content/docs/skills/example-skill.mdx?collection=docs'
import * as __fd_glob_12 from '../content/docs/template/skill-authoring.mdx?collection=docs'
import * as __fd_glob_11 from '../content/docs/template/getting-started.mdx?collection=docs'
import * as __fd_glob_10 from '../content/docs/template/gates.mdx?collection=docs'
import * as __fd_glob_9 from '../content/docs/roadmap/index.mdx?collection=docs'
import * as __fd_glob_8 from '../content/docs/decisions/turbo-package-manager.mdx?collection=docs'
import * as __fd_glob_7 from '../content/docs/changelog/index.mdx?collection=docs'
import * as __fd_glob_6 from '../content/docs/index.mdx?collection=docs'
import { default as __fd_glob_5 } from '../content/docs/template/meta.json?collection=docs'
import { default as __fd_glob_4 } from '../content/docs/skills/meta.json?collection=docs'
import { default as __fd_glob_3 } from '../content/docs/roadmap/meta.json?collection=docs'
import { default as __fd_glob_2 } from '../content/docs/decisions/meta.json?collection=docs'
import { default as __fd_glob_1 } from '../content/docs/changelog/meta.json?collection=docs'
import { default as __fd_glob_0 } from '../content/docs/meta.json?collection=docs'
import { server } from 'fumadocs-mdx/runtime/server'
import type * as Config from '../source.config'

const create = server<
  typeof Config,
  import('fumadocs-mdx/runtime/types').InternalTypeConfig & {
    DocData: {}
  }
>({ doc: { passthroughs: ['extractedReferences'] } })

export const docs = await create.docs(
  'docs',
  'content/docs',
  {
    'meta.json': __fd_glob_0,
    'changelog/meta.json': __fd_glob_1,
    'decisions/meta.json': __fd_glob_2,
    'roadmap/meta.json': __fd_glob_3,
    'skills/meta.json': __fd_glob_4,
    'template/meta.json': __fd_glob_5,
  },
  {
    'index.mdx': __fd_glob_6,
    'changelog/index.mdx': __fd_glob_7,
    'decisions/turbo-package-manager.mdx': __fd_glob_8,
    'roadmap/index.mdx': __fd_glob_9,
    'template/gates.mdx': __fd_glob_10,
    'template/getting-started.mdx': __fd_glob_11,
    'template/skill-authoring.mdx': __fd_glob_12,
    'skills/example-skill.mdx': __fd_glob_13,
  },
)
