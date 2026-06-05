// @ts-nocheck
import * as __fd_glob_10 from "../content/docs/roadmap/index.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/features/hello.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/features/auth.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/decisions/turbo-package-manager.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/changelog/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/roadmap/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/features/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/decisions/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/changelog/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "changelog/meta.json": __fd_glob_1, "decisions/meta.json": __fd_glob_2, "features/meta.json": __fd_glob_3, "roadmap/meta.json": __fd_glob_4, }, {"index.mdx": __fd_glob_5, "changelog/index.mdx": __fd_glob_6, "decisions/turbo-package-manager.mdx": __fd_glob_7, "features/auth.mdx": __fd_glob_8, "features/hello.mdx": __fd_glob_9, "roadmap/index.mdx": __fd_glob_10, });