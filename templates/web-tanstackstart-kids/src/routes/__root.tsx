import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Heading } from "@astryxdesign/core/Heading";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { getLocaleDirection, useTranslator } from "@astryxdesign/core/i18n";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import {
  ChildExperienceProvider,
  KIDS_PROFILES,
  resolveChildCapabilities,
  type KidsExperienceState,
} from "@/components/appearance";
import { getServerKidsExperience } from "@/components/appearance/kids-experience-data";
import { readKidsExperienceCookie } from "@/components/appearance/kids-experience-persistence";
import { AppI18nProvider, DEFAULT_LOCALE, useCurrentLocale } from "@/i18n";
import * as stylex from "@stylexjs/stylex";
import appCss from "../styles/app.css?url";

const styles = stylex.create({
  copy: {
    textAlign: "center",
  },
});

async function getInitialKidsExperience(): Promise<KidsExperienceState> {
  if (import.meta.env.SSR) {
    return getServerKidsExperience();
  }

  return readKidsExperienceCookie();
}

export const Route = createRootRoute({
  beforeLoad: async () => ({
    kidsExperience: await getInitialKidsExperience(),
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
  const { kidsExperience } = Route.useRouteContext();

  return (
    <RootDocument experience={kidsExperience}>
      <ChildExperienceProvider initialExperience={kidsExperience}>
        <LinkProvider component={Link}>
          <Outlet />
        </LinkProvider>
      </ChildExperienceProvider>
    </RootDocument>
  );
}

function NotFound() {
  const { kidsExperience } = Route.useRouteContext();
  const locale = useCurrentLocale();

  return (
    <ChildExperienceProvider initialExperience={kidsExperience}>
      <AppI18nProvider locale={locale}>
        <NotFoundContent />
      </AppI18nProvider>
    </ChildExperienceProvider>
  );
}

function NotFoundContent() {
  const t = useTranslator();

  return (
    <Center minHeight="100vh" padding={6}>
      <Stack gap={5} hAlign="center" maxWidth={520}>
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
  readonly experience: KidsExperienceState;
  readonly children: React.ReactNode;
}

function RootDocument({ experience, children }: RootDocumentProps) {
  const locale = useCurrentLocale();
  const capabilities = resolveChildCapabilities(experience.ageBand);

  return (
    <html
      lang={locale}
      dir={getLocaleDirection(locale)}
      data-astryx-theme={KIDS_PROFILES[experience.ageBand].theme.name}
      data-kid-profile={experience.ageBand}
      data-kid-reading-mode={capabilities.readingSupport}
      data-theme={experience.mode === "system" ? undefined : experience.mode}
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
