import { DropdownMenu, type DropdownMenuOption } from "@astryxdesign/core/DropdownMenu";
import { useTranslator } from "@astryxdesign/core/i18n";
import { APPEARANCE_MODES, THEME_NAMES, THEME_OPTIONS, type AppearanceMode } from "./appearance";
import { useAppearance } from "./AppearanceProvider";

const MODE_LABEL_KEYS = {
  system: "agentdock.appearance.system",
  light: "agentdock.appearance.light",
  dark: "agentdock.appearance.dark",
} satisfies Record<AppearanceMode, string>;

export function AppearanceSwitcher() {
  const { themeName, mode, setThemeName, setMode } = useAppearance();
  const t = useTranslator();

  const items: DropdownMenuOption[] = [
    {
      type: "section",
      title: t("agentdock.appearance.theme"),
      items: THEME_NAMES.map((name) => ({
        label: THEME_OPTIONS[name].label,
        icon: name === themeName ? "check" : undefined,
        onClick: () => setThemeName(name),
      })),
    },
    { type: "divider" },
    {
      type: "section",
      title: t("agentdock.appearance.mode"),
      items: APPEARANCE_MODES.map((appearanceMode) => ({
        label: t(MODE_LABEL_KEYS[appearanceMode]),
        icon: appearanceMode === mode ? "check" : undefined,
        onClick: () => setMode(appearanceMode),
      })),
    },
  ];

  return (
    <DropdownMenu
      button={{
        label: t("agentdock.nav.appearance"),
        variant: "ghost",
        size: "sm",
      }}
      items={items}
      hasChevron
      presentation="adaptive"
    />
  );
}
