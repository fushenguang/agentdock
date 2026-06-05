// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "changelog/index.mdx": () => import("../content/docs/changelog/index.mdx?collection=docs"), "decisions/turbo-package-manager.mdx": () => import("../content/docs/decisions/turbo-package-manager.mdx?collection=docs"), "features/auth.mdx": () => import("../content/docs/features/auth.mdx?collection=docs"), "features/hello.mdx": () => import("../content/docs/features/hello.mdx?collection=docs"), "roadmap/index.mdx": () => import("../content/docs/roadmap/index.mdx?collection=docs"), }),
};
export default browserCollections;