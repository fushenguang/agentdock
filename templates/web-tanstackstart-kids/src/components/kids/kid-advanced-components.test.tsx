// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ChildExperienceProvider } from "@/components/appearance";
import { AppI18nProvider } from "@/i18n";
import { KidAdvancedComponentsPage } from ".";

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  window.scrollTo = () => undefined;
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.show = function show() {
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

describe("phase-two child component visuals", () => {
  it("renders every phase-two category", () => {
    render(
      <Providers>
        <KidAdvancedComponentsPage />
      </Providers>,
    );

    for (const id of [
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
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
  });

  it("keeps phase-two controls keyboard-operable and locally scoped", async () => {
    const user = userEvent.setup();

    render(
      <Providers>
        <KidAdvancedComponentsPage />
      </Providers>,
    );

    const range = screen.getByRole("slider", { name: "How much support feels right?" });
    range.focus();
    expect(document.activeElement).toBe(range);
    await user.keyboard("{ArrowRight}");
    expect(range.getAttribute("aria-valuenow")).toBe("3");

    const date = screen.getByRole("combobox", { name: "Review day" });
    await user.click(date);
    expect(document.activeElement).toBe(date);

    const time = screen.getByRole("textbox", { name: "Preferred time" });
    await user.click(time);
    expect(document.activeElement).toBe(time);

    const paginationSection = screen.getByTestId("component-pagination");
    const nextPage = within(paginationSection).getByRole("button", { name: /next/i });
    await user.click(nextPage);
    expect(within(paginationSection).getByRole("button", { name: /page 2/i })).toBeTruthy();

    const fileSection = screen.getByTestId("component-file-input");
    const fileInput = fileSection.querySelector<HTMLInputElement>("input[type=file]");
    expect(fileInput).not.toBeNull();
    if (!fileInput) {
      throw new Error("Expected FileInput to render a file input");
    }
    const file = new File(["local drawing"], "drawing.png", { type: "image/png" });
    await user.upload(fileInput, file);
    expect(await screen.findByText("drawing.png")).toBeTruthy();
  });

  it("opens Astryx-owned lightbox and bottom sheet surfaces", async () => {
    const user = userEvent.setup();

    render(
      <Providers>
        <KidAdvancedComponentsPage />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: "Open local preview" }));
    expect(
      screen.getByRole("dialog", { name: "A simple original landscape illustration." }),
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Open bottom sheet" }));
    expect(screen.getByRole("dialog", { name: "Comfort options" })).toBeTruthy();
  });

  it("renders table and code block through Astryx semantics", () => {
    render(
      <Providers>
        <KidAdvancedComponentsPage />
      </Providers>,
    );

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("button", { name: /copy code/i })).toBeTruthy();
    expect(screen.getByText("Getting things ready")).toBeTruthy();
  });
});
