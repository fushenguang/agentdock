// @ts-nocheck
import * as __fd_glob_19 from "../content/docs/features/hello.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/features/auth.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/template/wechat-pay.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/template/troubleshooting.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/template/supabase.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/template/stripe.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/template/getting-started.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/template/drizzle.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/template/deployment.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/template/alipay.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/roadmap/index.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/decisions/turbo-package-manager.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/changelog/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_5 } from "../content/docs/roadmap/meta.json?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/template/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/changelog/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/features/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/decisions/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "decisions/meta.json": __fd_glob_1, "features/meta.json": __fd_glob_2, "changelog/meta.json": __fd_glob_3, "template/meta.json": __fd_glob_4, "roadmap/meta.json": __fd_glob_5, }, {"index.mdx": __fd_glob_6, "changelog/index.mdx": __fd_glob_7, "decisions/turbo-package-manager.mdx": __fd_glob_8, "roadmap/index.mdx": __fd_glob_9, "template/alipay.mdx": __fd_glob_10, "template/deployment.mdx": __fd_glob_11, "template/drizzle.mdx": __fd_glob_12, "template/getting-started.mdx": __fd_glob_13, "template/stripe.mdx": __fd_glob_14, "template/supabase.mdx": __fd_glob_15, "template/troubleshooting.mdx": __fd_glob_16, "template/wechat-pay.mdx": __fd_glob_17, "features/auth.mdx": __fd_glob_18, "features/hello.mdx": __fd_glob_19, });