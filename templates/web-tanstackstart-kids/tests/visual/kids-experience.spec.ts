import { expect, test } from "@playwright/test";

const profiles = ["sprout", "explorer", "creator"] as const;
const locales = ["zh-CN", "en"] as const;
const modes = ["light", "dark"] as const;
const viewports = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 720 },
] as const;

const componentSections = [
  "component-button",
  "component-checkbox",
  "component-radio",
  "component-switch",
  "component-input",
  "component-select",
  "component-tabs",
  "component-collapse",
  "component-tag",
  "component-badge",
  "component-tooltip",
  "component-toast",
  "component-skeleton",
  "component-states",
  "component-title",
  "component-background",
  "component-divider",
  "component-dialog",
  "component-carousel",
] as const;

const advancedSections = [
  "component-card",
  "component-progress",
  "component-form",
  "component-date-input",
  "component-time-input",
  "component-timestamp",
  "component-table",
  "component-pagination",
  "component-file-input",
  "component-thumbnail",
  "component-lightbox",
  "component-bottom-sheet",
  "component-code-block",
] as const;

for (const profile of profiles) {
  for (const locale of locales) {
    for (const mode of modes) {
      for (const viewport of viewports) {
        test(`${profile} ${locale} ${mode} ${viewport.name} home`, async ({ context, page }) => {
          await context.addCookies([
            {
              name: "agentdock.kids.experience",
              value: `${profile}.${mode}`,
              domain: "127.0.0.1",
              path: "/",
            },
          ]);

          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(`/${locale}`);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

          if (viewport.width < 1024) {
            await expect(page.getByTestId("mobile-nav-toggle").first()).toBeVisible();
          }
          await expect(page).toHaveScreenshot(`${profile}-${locale}-${mode}-${viewport.name}.png`, {
            animations: "disabled",
            fullPage: true,
          });
        });
      }
    }
  }
}

for (const profile of profiles) {
  for (const mode of modes) {
    test(`${profile} ${mode} advanced component visual matrix`, async ({ context, page }) => {
      await context.addCookies([
        {
          name: "agentdock.kids.experience",
          value: `${profile}.${mode}`,
          domain: "127.0.0.1",
          path: "/",
        },
      ]);

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto("/en/advanced-components");
      await page.addStyleTag({ content: ".astryx-top-nav { visibility: hidden !important; }" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      for (const sectionId of advancedSections) {
        const section = page.getByTestId(sectionId);
        const target = section.locator(":scope > .astryx-card");

        await expect(target).toHaveScreenshot(`advanced-${profile}-${mode}-${sectionId}.png`, {
          animations: "disabled",
        });
      }
    });
  }
}

for (const profile of profiles) {
  for (const mode of modes) {
    test(`${profile} ${mode} component visual matrix`, async ({ context, page }) => {
      await context.addCookies([
        {
          name: "agentdock.kids.experience",
          value: `${profile}.${mode}`,
          domain: "127.0.0.1",
          path: "/",
        },
      ]);

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto("/en/components");
      await page.addStyleTag({ content: ".astryx-top-nav { visibility: hidden !important; }" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      for (const sectionId of componentSections) {
        const section = page.getByTestId(sectionId);

        if (sectionId === "component-tooltip") {
          await section.getByRole("button", { name: "What is this?" }).focus();
        }

        const target =
          sectionId === "component-tooltip" ? section : section.locator(":scope > .astryx-card");

        await expect(target).toHaveScreenshot(`components-${profile}-${mode}-${sectionId}.png`, {
          animations: "disabled",
        });
      }
    });
  }
}

test("server renders the stored profile without client JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 768, height: 1024 },
  });
  await context.addCookies([
    {
      name: "agentdock.kids.experience",
      value: "sprout.light",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  const page = await context.newPage();
  await page.goto("/zh-CN");

  await expect(page.locator("html")).toHaveAttribute("data-kid-profile", "sprout");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-astryx-theme", "kids-sprout");

  await context.close();
});

test("server renders the component showcase without client JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 768, height: 1024 },
  });
  await context.addCookies([
    {
      name: "agentdock.kids.experience",
      value: "creator.dark",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  const page = await context.newPage();
  await page.goto("/en/components");

  await expect(page.locator("html")).toHaveAttribute("data-kid-profile", "creator");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-astryx-theme", "kids-creator");
  await expect(
    page.getByRole("heading", { level: 1, name: "Small parts, friendly places" }),
  ).toBeVisible();
  await expect(page.getByTestId("component-carousel")).toBeVisible();

  await context.close();
});

test("server renders the advanced component showcase without client JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 768, height: 1024 },
  });
  await context.addCookies([
    {
      name: "agentdock.kids.experience",
      value: "explorer.light",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  const page = await context.newPage();
  await page.goto("/en/advanced-components");

  await expect(
    page.getByRole("heading", { level: 1, name: "More tools for bigger ideas" }),
  ).toBeVisible();
  await expect(page.getByTestId("component-table")).toBeVisible();
  await expect(page.getByTestId("component-code-block")).toBeVisible();

  await context.close();
});

test("reduced motion removes perceptible transition and animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");

  const duration = await page
    .getByRole("link", { name: "Start an activity" })
    .evaluate((element) => getComputedStyle(element).transitionDuration);

  expect(duration).toContain("0.001s");

  await page.goto("/en/components");

  const skeletonDuration = await page
    .getByTestId("component-skeleton-shape")
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(skeletonDuration).toContain("0.001s");

  const carouselScrollBehavior = await page
    .getByTestId("component-carousel-region")
    .locator(".astryx-carousel-scroller")
    .evaluate((element) => getComputedStyle(element).scrollBehavior);
  expect(carouselScrollBehavior).toBe("auto");

  await page.goto("/en/advanced-components");
  await expect(page.getByTestId("component-progress")).toBeVisible();
  await expect(page.getByTestId("component-code-block")).toBeVisible();
});
