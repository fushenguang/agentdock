import type { Catalog } from "@astryxdesign/core/i18n";

export interface PageCatalog {
  readonly en: Catalog;
  readonly "zh-CN": Catalog;
}

import { en as page_index__pageEn, zhCN as page_index__pageZhCN } from "./index__page";

import { en as page_helloEn, zhCN as page_helloZhCN } from "./hello";

export const pageCatalogs: readonly PageCatalog[] = [
  { en: page_index__pageEn, "zh-CN": page_index__pageZhCN },
  { en: page_helloEn, "zh-CN": page_helloZhCN },
];
