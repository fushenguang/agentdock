import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Heading } from "@astryxdesign/core/Heading";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { getLocaleDirection, useTranslator } from "@astryxdesign/core/i18n";
import {
  Link,
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { AppearanceProvider } from "@/components/appearance";
import type { AppearanceState } from "@/components/appearance/appearance";
import { getServerAppearance } from "@/components/appearance/appearance-data";
import { readAppearanceCookie } from "@/components/appearance/appearance-persistence";
import { AppI18nProvider, DEFAULT_LOCALE, isSupportedLocale } from "@/i18n";
import * as stylex from "@stylexjs/stylex";
import appCss from "../styles/app.css?url";

const styles = stylex.create({
  copy: {
    textAlign: "center",
  },
});

async function getInitialAppearance(): Promise<AppearanceState> {
  if (import.meta.env.SSR) {
    return getServerAppearance();
  }

  return readAppearanceCookie();
}

export const Route = createRootRoute({
  beforeLoad: async () => ({
    appearance: await getInitialAppearance(),
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "{{PROJECT_NAME}}" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      ...(import.meta.env.DEV ? [{ rel: "stylesheet", href: "/virtual:stylex.css" }] : []),
    ],
  }),
});

function RootComponent() {
  const { appearance } = Route.useRouteContext();

  return (
    <RootDocument appearance={appearance}>
      <AppearanceProvider initialAppearance={appearance}>
        <LinkProvider component={Link}>
          <Outlet />
        </LinkProvider>
      </AppearanceProvider>
    </RootDocument>
  );
}

function NotFound() {
  const { appearance } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const pathLocale = pathname.split("/")[1] ?? "";
  const locale = isSupportedLocale(pathLocale) ? pathLocale : DEFAULT_LOCALE;

  return (
    <AppearanceProvider initialAppearance={appearance}>
      <AppI18nProvider locale={locale}>
        <NotFoundContent />
      </AppI18nProvider>
    </AppearanceProvider>
  );
}

function NotFoundContent() {
  const t = useTranslator();

  return (
    <Center minHeight="100vh" padding={6}>
      <Stack gap={4} hAlign="center" maxWidth={480}>
        <Heading level={1}>{t("agentdock.notFound.title")}</Heading>
        <Text type="body" color="secondary" xstyle={styles.copy}>
          {t("agentdock.notFound.description")}
        </Text>
        <Button
          label={t("agentdock.notFound.backHome")}
          variant="primary"
          href={`/${DEFAULT_LOCALE}`}
        />
      </Stack>
    </Center>
  );
}

interface RootDocumentProps {
  readonly appearance: AppearanceState;
  readonly children: React.ReactNode;
}

function RootDocument({ appearance, children }: RootDocumentProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const pathLocale = pathname.split("/")[1] ?? "";
  const locale = isSupportedLocale(pathLocale) ? pathLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      data-astryx-theme={appearance.themeName}
      data-theme={appearance.mode === "system" ? undefined : appearance.mode}
    >
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
