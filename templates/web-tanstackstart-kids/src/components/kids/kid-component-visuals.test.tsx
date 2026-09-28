// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ChildExperienceProvider } from "@/components/appearance";
import { AppI18nProvider } from "@/i18n";
import { KidBackground, KidComponentsPage, KidTitleRibbon } from ".";

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  window.scrollTo = () => undefined;
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
});

function Providers({ children }: { readonly children: React.ReactNode }) {
  return (
    <AppI18nProvider locale="en">
      <ChildExperienceProvider initialExperience={{ ageBand: "explorer", mode: "light" }}>
        {children}
      </ChildExperienceProvider>
    </AppI18nProvider>
  );
}

describe("child component visual primitives", () => {
  it("renders a title ribbon with Astryx heading semantics and decorative artwork", () => {
    render(
      <Providers>
        <KidTitleRibbon title="A bright idea" subtitle="A calm subtitle" />
      </Providers>,
    );

    expect(screen.getByRole("heading", { name: "A bright idea" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.querySelector("svg[aria-hidden='true']")).toBeTruthy();
  });

  it("renders a non-interactive patterned background around Astryx content", () => {
    render(
      <Providers>
        <KidBackground pattern="grid">
          <p>Content stays readable</p>
        </KidBackground>
      </Providers>,
    );

    expect(screen.getByText("Content stays readable")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders every phase-one component in the localized showcase", () => {
    render(
      <Providers>
        <KidComponentsPage />
      </Providers>,
    );

    for (const id of [
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
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it("keeps controlled form and disclosure components keyboard-operable", async () => {
    const user = userEvent.setup();

    render(
      <Providers>
        <KidComponentsPage />
      </Providers>,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Add a paper kite" });
    await user.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(false);

    const radio = screen.getByRole("radio", { name: "Workshop" });
    await user.click(radio);
    expect((radio as HTMLInputElement).checked).toBe(true);

    const switchControl = screen.getByRole("switch", { name: "Gentle sounds" });
    await user.click(switchControl);
    expect((switchControl as HTMLInputElement).checked).toBe(false);

    const input = screen.getByRole("textbox", { name: "What should we call your project?" });
    await user.type(input, "Sky plan");
    expect((input as HTMLInputElement).value).toBe("Sky plan");

    const gardenTab = screen.getByRole("tab", { name: "Garden" });
    await user.click(gardenTab);
    await user.keyboard("{ArrowRight}");
    const workshopTab = screen.getByRole("tab", { name: "Workshop" });
    expect(document.activeElement).toBe(workshopTab);
    await user.click(workshopTab);
    expect(workshopTab.getAttribute("aria-selected")).toBe("true");

    const collapse = screen.getByRole("button", { name: "How does this work?" });
    expect(collapse.getAttribute("aria-expanded")).toBe("true");
    await user.click(collapse);
    expect(collapse.getAttribute("aria-expanded")).toBe("false");
  });

  it("uses the Astryx dialog lifecycle and restores the invoking action", async () => {
    const user = userEvent.setup();

    render(
      <Providers>
        <KidComponentsPage />
      </Providers>,
    );

    const dialogSection = screen.getByTestId("component-dialog");
    const openButton = within(dialogSection).getByRole("button", { name: "Open modal dialog" });
    await user.click(openButton);
    expect(screen.getByRole("dialog", { name: "Ready to continue?" })).toBeTruthy();
  });
});
