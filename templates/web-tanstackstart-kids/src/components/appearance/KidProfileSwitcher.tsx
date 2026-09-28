import { DropdownMenu, type DropdownMenuOption } from "@astryxdesign/core/DropdownMenu";
import { useTranslator } from "@astryxdesign/core/i18n";
import { AGE_BANDS, KIDS_THEME_MODES, type KidsThemeMode } from "./kids-experience";
import { useChildExperience } from "./ChildExperienceProvider";

const MODE_LABEL_KEYS = {
  system: "agentdock.kids.mode.system",
  light: "agentdock.kids.mode.light",
  dark: "agentdock.kids.mode.dark",
} satisfies Record<KidsThemeMode, string>;

export function KidProfileSwitcher() {
  const { ageBand, mode, setAgeBand, setMode } = useChildExperience();
  const t = useTranslator();

  const items: DropdownMenuOption[] = [
    {
      type: "section",
      title: t("agentdock.kids.profile.label"),
      items: AGE_BANDS.map((profile) => ({
        label: t(`agentdock.kids.profile.${profile}`),
        icon: profile === ageBand ? "check" : undefined,
        onClick: () => setAgeBand(profile),
      })),
    },
    { type: "divider" },
    {
      type: "section",
      title: t("agentdock.kids.mode.label"),
      items: KIDS_THEME_MODES.map((themeMode) => ({
        label: t(MODE_LABEL_KEYS[themeMode]),
        icon: themeMode === mode ? "check" : undefined,
        onClick: () => setMode(themeMode),
      })),
    },
  ];

  return (
    <DropdownMenu
      button={{
        label: t("agentdock.kids.profile.open"),
        variant: "ghost",
        size: "sm",
      }}
      items={items}
      hasChevron
      presentation="adaptive"
    />
  );
}
