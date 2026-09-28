import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { AGE_BANDS, ChildExperienceProvider, type KidsThemeMode } from "@/components/appearance";
import { AppI18nProvider, type AppLocale } from "@/i18n";
import {
  KidActivityPage,
  KidAdvancedComponentsPage,
  KidComponentsPage,
  KidGuardianPage,
  KidHomePage,
  KidStatesPage,
} from ".";

const PAGES = [
  ["home", () => <KidHomePage completionCount={0} />],
  ["activity", () => <KidActivityPage completionCount={0} onComplete={async () => undefined} />],
  ["guardian", () => <KidGuardianPage />],
  ["states", () => <KidStatesPage />],
  ["components", () => <KidComponentsPage />],
  ["advanced-components", () => <KidAdvancedComponentsPage />],
] as const;
const LOCALES: readonly AppLocale[] = ["en", "zh-CN"];
const MODES: readonly KidsThemeMode[] = ["light", "dark"];

function TestRouter({ children }: { readonly children: React.ReactNode }) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => children,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/en"] }),
  });

  return <RouterProvider router={router} />;
}

describe("child experience accessibility", () => {
  it.each(AGE_BANDS)("has no axe violations for the %s profile matrix", async (ageBand) => {
    for (const locale of LOCALES) {
      for (const mode of MODES) {
        for (const [name, renderPage] of PAGES) {
          const view = render(
            <AppI18nProvider locale={locale}>
              <ChildExperienceProvider initialExperience={{ ageBand, mode }}>
                <TestRouter>
                  <main aria-label={`${name} page`}>{renderPage()}</main>
                </TestRouter>
              </ChildExperienceProvider>
            </AppI18nProvider>,
          );

          const results = await axe(view.container, {
            rules: {
              "color-contrast": { enabled: false },
            },
          });

          expect(results.violations, `${ageBand} ${locale} ${mode} ${name}`).toEqual([]);
          view.unmount();
        }
      }
    }
  });
});
