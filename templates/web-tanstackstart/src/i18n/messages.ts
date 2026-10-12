import type { Catalog, MessagesByLocale } from "@astryxdesign/core/i18n";
import astryxZhCNSource from "../../node_modules/@astryxdesign/core/locales/zh-CN.json?raw";

function message(defaultMessage: string, description?: string) {
  return description ? { defaultMessage, description } : { defaultMessage };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMessageEntry(value: unknown): value is Catalog[string] {
  if (!isRecord(value) || typeof value.defaultMessage !== "string") {
    return false;
  }
  return value.description === undefined || typeof value.description === "string";
}

function parseCatalog(source: string, name: string): Catalog {
  const parsed: unknown = JSON.parse(source);
  if (!isRecord(parsed)) {
    throw new Error(`${name} must contain a catalog object`);
  }

  const catalog: Catalog = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!isMessageEntry(value)) {
      throw new Error(`${name} contains an invalid message entry: ${key}`);
    }
    catalog[key] = value;
  }
  return catalog;
}

const astryxZhCN = parseCatalog(astryxZhCNSource, "Astryx zh-CN catalog");

export const enCatalog: Catalog = {
  "agentdock.notFound.title": message("404"),
  "agentdock.notFound.description": message("The requested page does not exist."),
  "agentdock.notFound.backHome": message("Back home"),
  "agentdock.nav.label": message("Application navigation"),
  "agentdock.nav.overview": message("Overview"),
  "agentdock.nav.hello": message("Hello feature"),
  "agentdock.nav.settings": message("Settings"),
  "agentdock.page.back": message("Back"),
  "agentdock.overview.tagline": message("An embedded workbench for the App."),
  "agentdock.overview.module.hello.title": message("Hello feature"),
  "agentdock.overview.module.hello.description": message(
    "The reference feature: route, server function, feature contract and repository.",
  ),
  "agentdock.overview.module.settings.title": message("Settings"),
  "agentdock.overview.module.settings.description": message(
    "Appearance and language for this workbench.",
  ),
  "agentdock.appearance.theme": message("Theme"),
  "agentdock.appearance.mode": message("Color mode"),
  "agentdock.appearance.system": message("System"),
  "agentdock.appearance.light": message("Light"),
  "agentdock.appearance.dark": message("Dark"),
  "agentdock.locale.label": message("Language"),
  "agentdock.settings.sections": message("Settings sections"),
  "agentdock.settings.appearance.title": message("Appearance"),
  "agentdock.settings.appearance.description": message("Theme and color mode for every page."),
  "agentdock.settings.language.title": message("Language"),
  "agentdock.settings.language.description": message(
    "Interface language; the current page is kept.",
  ),
  "agentdock.hello.title": message("Hello feature"),
  "agentdock.hello.newGreeting": message("New greeting"),
  "agentdock.hello.placeholder": message("Write something worth persisting"),
  "agentdock.hello.add": message("Add greeting"),
  "agentdock.hello.empty": message("No greetings yet."),
  "agentdock.hello.fieldMessage": message("Note"),
  "agentdock.hello.viewOptions": message("View options"),
  "agentdock.hello.sort": message("Sort"),
  "agentdock.hello.sort.newest": message("Newest"),
  "agentdock.hello.sort.oldest": message("Oldest"),
  "agentdock.hello.showTime": message("Time"),
  "agentdock.hello.options": message("Options"),
  "agentdock.hello.fillSample": message("Fill sample"),
  "agentdock.hello.resetOptions": message("Reset options"),
  "agentdock.hello.sample": message("Hello from the web-tanstackstart template."),
  "agentdock.hello.error.save": message("Unable to save the greeting"),
};

export const zhCNCatalog: Catalog = {
  "agentdock.notFound.title": message("404"),
  "agentdock.notFound.description": message("你访问的页面不存在。"),
  "agentdock.notFound.backHome": message("返回首页"),
  "agentdock.nav.label": message("应用导航"),
  "agentdock.nav.overview": message("概览"),
  "agentdock.nav.hello": message("Hello 示例"),
  "agentdock.nav.settings": message("设置"),
  "agentdock.page.back": message("返回"),
  "agentdock.overview.tagline": message("App 内嵌的工作台。"),
  "agentdock.overview.module.hello.title": message("Hello 示例"),
  "agentdock.overview.module.hello.description": message(
    "参考 feature：路由、server function、feature 契约与仓储。",
  ),
  "agentdock.overview.module.settings.title": message("设置"),
  "agentdock.overview.module.settings.description": message("本工作台的外观与语言。"),
  "agentdock.appearance.theme": message("主题"),
  "agentdock.appearance.mode": message("颜色模式"),
  "agentdock.appearance.system": message("跟随系统"),
  "agentdock.appearance.light": message("浅色"),
  "agentdock.appearance.dark": message("深色"),
  "agentdock.locale.label": message("语言"),
  "agentdock.settings.sections": message("设置分区"),
  "agentdock.settings.appearance.title": message("外观"),
  "agentdock.settings.appearance.description": message("所有页面的主题与颜色模式。"),
  "agentdock.settings.language.title": message("语言"),
  "agentdock.settings.language.description": message("界面语言；当前页面保持不变。"),
  "agentdock.hello.title": message("Hello 示例"),
  "agentdock.hello.newGreeting": message("新问候"),
  "agentdock.hello.placeholder": message("写一条需要持久化的内容"),
  "agentdock.hello.add": message("添加问候"),
  "agentdock.hello.empty": message("暂无问候。"),
  "agentdock.hello.fieldMessage": message("留言"),
  "agentdock.hello.viewOptions": message("视图选项"),
  "agentdock.hello.sort": message("排序"),
  "agentdock.hello.sort.newest": message("最新"),
  "agentdock.hello.sort.oldest": message("最早"),
  "agentdock.hello.showTime": message("时间"),
  "agentdock.hello.options": message("选项"),
  "agentdock.hello.fillSample": message("填入示例"),
  "agentdock.hello.resetOptions": message("重置选项"),
  "agentdock.hello.sample": message("来自 web-tanstackstart 模板的问候。"),
  "agentdock.hello.error.save": message("无法保存问候"),
};

export const APP_MESSAGES: MessagesByLocale = {
  en: enCatalog,
  "zh-CN": {
    ...astryxZhCN,
    ...zhCNCatalog,
  },
};
