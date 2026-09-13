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
  "agentdock.nav.openFeature": message("Open feature"),
  "agentdock.nav.appearance": message("Appearance"),
  "agentdock.appearance.theme": message("Theme"),
  "agentdock.appearance.mode": message("Color mode"),
  "agentdock.appearance.system": message("System"),
  "agentdock.appearance.light": message("Light"),
  "agentdock.appearance.dark": message("Dark"),
  "agentdock.locale.label": message("Language"),
  "agentdock.overview.title": message("Application overview"),
  "agentdock.overview.description": message(
    "A clean starting point for internal products built with TanStack Start, Astryx and Drizzle.",
  ),
  "agentdock.overview.openFeature": message("Open hello feature"),
  "agentdock.overview.featureContracts.title": message("Feature contracts"),
  "agentdock.overview.featureContracts.description": message(
    "Business behavior lives under src/features and exposes a typed contract through index.ts.",
  ),
  "agentdock.overview.repository.title": message("Repository data flow"),
  "agentdock.overview.repository.description": message(
    "Features depend on core repository contracts. Infrastructure implementations stay behind the provider.",
  ),
  "agentdock.overview.design.title": message("Design system"),
  "agentdock.overview.design.description": message(
    "Astryx provides components and tokens. StyleX owns first-party layout and product styling.",
  ),
  "agentdock.overview.start.title": message("Start a new feature"),
  "agentdock.overview.start.step1": message("Define the domain contract under src/core."),
  "agentdock.overview.start.step2": message(
    "Create src/features/<name>/__contract__.ts and index.ts.",
  ),
  "agentdock.overview.start.step3": message(
    "Add the route under src/routes and compose the shared page layout.",
  ),
  "agentdock.overview.start.step4": message("Add tests, then run pnpm check before finishing."),
  "agentdock.hello.title": message("Hello feature"),
  "agentdock.hello.description": message(
    "This reference feature demonstrates the route, server function, feature contract and repository flow.",
  ),
  "agentdock.hello.newGreeting": message("New greeting"),
  "agentdock.hello.placeholder": message("Write something worth persisting"),
  "agentdock.hello.add": message("Add greeting"),
  "agentdock.hello.stored": message("Stored greetings"),
  "agentdock.hello.empty": message("No greetings yet. The SQLite default starts empty."),
  "agentdock.hello.error.empty": message("Greeting cannot be empty"),
  "agentdock.hello.error.save": message("Unable to save the greeting"),
};

export const zhCNCatalog: Catalog = {
  "agentdock.notFound.title": message("404"),
  "agentdock.notFound.description": message("你访问的页面不存在。"),
  "agentdock.notFound.backHome": message("返回首页"),
  "agentdock.nav.label": message("应用导航"),
  "agentdock.nav.overview": message("概览"),
  "agentdock.nav.hello": message("Hello 示例"),
  "agentdock.nav.openFeature": message("打开示例"),
  "agentdock.nav.appearance": message("外观"),
  "agentdock.appearance.theme": message("主题"),
  "agentdock.appearance.mode": message("颜色模式"),
  "agentdock.appearance.system": message("跟随系统"),
  "agentdock.appearance.light": message("浅色"),
  "agentdock.appearance.dark": message("深色"),
  "agentdock.locale.label": message("语言"),
  "agentdock.overview.title": message("应用概览"),
  "agentdock.overview.description": message(
    "基于 TanStack Start、Astryx 与 Drizzle 的企业内部应用起点。",
  ),
  "agentdock.overview.openFeature": message("打开 Hello 示例"),
  "agentdock.overview.featureContracts.title": message("Feature 契约"),
  "agentdock.overview.featureContracts.description": message(
    "业务行为放在 src/features，通过 index.ts 暴露类型化契约。",
  ),
  "agentdock.overview.repository.title": message("仓储数据流"),
  "agentdock.overview.repository.description": message(
    "Feature 依赖 core 仓储契约，基础设施实现隐藏在 provider 之后。",
  ),
  "agentdock.overview.design.title": message("设计系统"),
  "agentdock.overview.design.description": message(
    "Astryx 提供组件和 token，StyleX 负责业务布局和产品样式。",
  ),
  "agentdock.overview.start.title": message("开始开发 Feature"),
  "agentdock.overview.start.step1": message("在 src/core 定义领域契约。"),
  "agentdock.overview.start.step2": message(
    "创建 src/features/<name>/__contract__.ts 和 index.ts。",
  ),
  "agentdock.overview.start.step3": message("在 src/routes 添加路由并组合共享页面布局。"),
  "agentdock.overview.start.step4": message("补充测试，完成后运行 pnpm check。"),
  "agentdock.hello.title": message("Hello 示例"),
  "agentdock.hello.description": message(
    "该参考 feature 演示路由、server function、feature 契约与仓储数据流。",
  ),
  "agentdock.hello.newGreeting": message("新问候"),
  "agentdock.hello.placeholder": message("写一条需要持久化的内容"),
  "agentdock.hello.add": message("添加问候"),
  "agentdock.hello.stored": message("已保存的问候"),
  "agentdock.hello.empty": message("暂无问候，默认 SQLite 从空数据库开始。"),
  "agentdock.hello.error.empty": message("问候内容不能为空"),
  "agentdock.hello.error.save": message("无法保存问候"),
};

export const APP_MESSAGES: MessagesByLocale = {
  en: enCatalog,
  "zh-CN": {
    ...astryxZhCN,
    ...zhCNCatalog,
  },
};
