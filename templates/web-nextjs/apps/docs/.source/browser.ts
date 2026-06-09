// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "changelog/index.mdx": () => import("../content/docs/changelog/index.mdx?collection=docs"), "decisions/turbo-package-manager.mdx": () => import("../content/docs/decisions/turbo-package-manager.mdx?collection=docs"), "roadmap/index.mdx": () => import("../content/docs/roadmap/index.mdx?collection=docs"), "template/alipay.mdx": () => import("../content/docs/template/alipay.mdx?collection=docs"), "template/deployment.mdx": () => import("../content/docs/template/deployment.mdx?collection=docs"), "template/drizzle.mdx": () => import("../content/docs/template/drizzle.mdx?collection=docs"), "template/getting-started.mdx": () => import("../content/docs/template/getting-started.mdx?collection=docs"), "template/stripe.mdx": () => import("../content/docs/template/stripe.mdx?collection=docs"), "template/supabase.mdx": () => import("../content/docs/template/supabase.mdx?collection=docs"), "template/troubleshooting.mdx": () => import("../content/docs/template/troubleshooting.mdx?collection=docs"), "template/wechat-pay.mdx": () => import("../content/docs/template/wechat-pay.mdx?collection=docs"), "features/auth.mdx": () => import("../content/docs/features/auth.mdx?collection=docs"), "features/hello.mdx": () => import("../content/docs/features/hello.mdx?collection=docs"), }),
};
export default browserCollections;