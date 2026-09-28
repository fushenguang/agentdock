// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ChildExperienceProvider } from "@/components/appearance";
import { AppI18nProvider } from "@/i18n";
import { GuardianGate, KidChoice, KidReadAlong } from ".";

beforeAll(() => {
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

describe("child-facing components", () => {
  it("keeps choice selection controlled and keyboard-operable", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [selected, setSelected] = useState(false);
      return (
        <KidChoice
          label="Round garden"
          title="Round garden"
          isSelected={selected}
          onSelect={() => setSelected((value) => !value)}
        />
      );
    }

    render(
      <Providers>
        <Harness />
      </Providers>,
    );

    const choice = screen.getByRole("checkbox", { name: "Round garden" });
    expect((choice as HTMLInputElement).checked).toBe(false);

    await user.click(choice);
    expect((choice as HTMLInputElement).checked).toBe(true);

    await user.keyboard(" ");
    expect((choice as HTMLInputElement).checked).toBe(false);
  });

  it("shows text fallback when read-aloud is unavailable", async () => {
    const user = userEvent.setup();

    render(
      <Providers>
        <KidReadAlong
          text="A short sentence."
          readLabel="Read aloud"
          stopLabel="Stop"
          transcriptLabel="Show words"
          unavailableLabel="Audio is unavailable."
        />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: "Read aloud" }));
    expect(screen.getByText("Audio is unavailable.")).toBeTruthy();
    expect(screen.getByText("A short sentence.")).toBeTruthy();
  });

  it("routes consequential actions through an explicit guardian dialog", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <Providers>
        <GuardianGate
          triggerLabel="Open grown-up action"
          title="Ask a grown-up first"
          description="A grown-up should decide."
          cancelLabel="Not now"
          confirmLabel="Continue with a grown-up"
          onConfirm={onConfirm}
        />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: "Open grown-up action" }));
    expect(screen.getByRole("alertdialog", { name: "Ask a grown-up first" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Continue with a grown-up" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
