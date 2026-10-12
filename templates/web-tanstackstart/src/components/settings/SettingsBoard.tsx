/**
 * The Settings Surface: **section navigation plus one section at a time**.
 *
 * This is a first-level route, so it has no back link and no page-level action — instead the surface
 * itself is the skeleton: with the shell on `isFullHeight`, **the page does not scroll and only the
 * panel column does**, so the section navigation never scrolls away with a long section. That is the
 * whole reason global preference lives here rather than in a shell top bar.
 *
 * Judgement calls, all keyed to the **container** (the panel is the screen here, not the viewport):
 * - the navigation is a vertical `SideNav` from a 640px container and a horizontally scrollable
 *   `TabList` (`hasDivider`) below it;
 * - the nav column owns its width (13rem) and `SideNav`'s own fixed 260px width is pinned back to
 *   `100%`, or it bleeds over the content column;
 * - the section's group heading is an `aria-labelledby` for assistive technology, so it is passed to
 *   `SideNavSection` as `isHeaderHidden` rather than dropped (dropping it would lose the group name);
 * - a row is icon + name + description on the left and its control on the right, and the icon is
 *   required on every row so the titles share one vertical line. The control reports the current
 *   value (the theme, the language) rather than repeating the row's name, so nothing is printed twice;
 * - when the panel narrows, **the whole row** collapses to a single column at one shared width
 *   (`@container (max-width: 480px)`) — rows that wrap on their own contents read as a bug.
 */
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { Stack } from "@astryxdesign/core/Stack";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
import { useTranslator } from "@astryxdesign/core/i18n";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { useState } from "react";
import { AppearanceSwitcher } from "@/components/appearance";
import { PageContainer } from "@/components/layout";
import { LocaleSwitcher } from "@/components/locale";
import type { SettingsIconName } from "./settings-icons";
import "./settings-icons";

const SECTIONS = [
  { id: "appearance", icon: "appdock:appearance" },
  { id: "language", icon: "appdock:language" },
] as const satisfies ReadonlyArray<{ id: string; icon: SettingsIconName }>;

type SectionId = (typeof SECTIONS)[number]["id"];

const styles = stylex.create({
  /** Whole-page column: it does not scroll, so the navigation stays put. */
  pageColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    flex: 1,
    minHeight: 0,
    width: "100%",
    overflow: "hidden",
    "@container (min-width: 420px)": { gap: "1.5rem" },
  },
  layout: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    flex: 1,
    minHeight: 0,
    width: "100%",
    "@container (min-width: 640px)": { flexDirection: "row", gap: "1.5rem" },
  },
  wideNav: {
    display: "none",
    "@container (min-width: 640px)": { display: "block", width: "13rem", flexShrink: 0 },
  },
  /** `SideNav` ships a fixed 260px root width; pin it back to the column or it overflows. */
  sideNav: {
    width: "100%",
  },
  narrowNav: {
    width: "100%",
    "@container (min-width: 640px)": { display: "none" },
  },
  /** Section panel: fills the remaining height and is the **only** thing that scrolls. */
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: "100%",
    overflowY: "auto",
    paddingBlockEnd: "1rem",
  },
  /** A row: stacked while the panel is narrow, one line from 481px. */
  row: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "0.75rem",
    "@container (min-width: 481px)": {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  },
  copy: {
    minWidth: 0,
  },
  control: {
    flexShrink: 0,
    "@container (max-width: 480px)": { width: "100%" },
  },
});

interface SettingsRowProps {
  readonly icon: SettingsIconName;
  /** The row owns the visible name; the control beside it reports the current value. */
  readonly title: string;
  readonly description?: string;
  readonly control: ReactNode;
}

function SettingsRow({ icon, title, description, control }: SettingsRowProps) {
  return (
    <Stack xstyle={styles.row}>
      <Stack direction="horizontal" gap={2} vAlign="start" xstyle={styles.copy}>
        <Icon icon={icon} size="sm" color="secondary" />
        <VStack gap={0.5} xstyle={styles.copy}>
          <Text type="body" weight="semibold">
            {title}
          </Text>
          {description ? (
            <Text type="supporting" color="secondary">
              {description}
            </Text>
          ) : null}
        </VStack>
      </Stack>
      <div {...stylex.props(styles.control)}>{control}</div>
    </Stack>
  );
}

export function SettingsBoard() {
  const t = useTranslator();
  const [section, setSection] = useState<SectionId>("appearance");

  return (
    <PageContainer isFullHeight>
      <VisuallyHidden>
        <Heading level={1}>{t("agentdock.nav.settings")}</Heading>
      </VisuallyHidden>

      <div {...stylex.props(styles.pageColumn)}>
        <div {...stylex.props(styles.layout)}>
          <TabList
            aria-label={t("agentdock.settings.sections")}
            value={section}
            onChange={(value) => setSection(value as SectionId)}
            size="sm"
            hasDivider
            xstyle={styles.narrowNav}
          >
            {SECTIONS.map((candidate) => (
              <Tab
                key={candidate.id}
                value={candidate.id}
                label={t(`agentdock.settings.${candidate.id}.title`)}
                icon={<Icon icon={candidate.icon} size="sm" />}
              />
            ))}
          </TabList>

          <div {...stylex.props(styles.wideNav)}>
            <SideNav aria-label={t("agentdock.settings.sections")} xstyle={styles.sideNav}>
              <SideNavSection title={t("agentdock.settings.sections")} isHeaderHidden>
                {SECTIONS.map((candidate) => (
                  <SideNavItem
                    key={candidate.id}
                    label={t(`agentdock.settings.${candidate.id}.title`)}
                    icon={<Icon icon={candidate.icon} size="sm" color="primary" />}
                    isSelected={candidate.id === section}
                    onClick={() => setSection(candidate.id)}
                  />
                ))}
              </SideNavSection>
            </SideNav>
          </div>

          <div {...stylex.props(styles.panel)}>
            <Heading level={2}>{t(`agentdock.settings.${section}.title`)}</Heading>
            {section === "appearance" ? (
              <SettingsRow
                icon="appdock:appearance"
                title={t("agentdock.settings.appearance.title")}
                description={t("agentdock.settings.appearance.description")}
                control={<AppearanceSwitcher />}
              />
            ) : (
              <SettingsRow
                icon="appdock:language"
                title={t("agentdock.settings.language.title")}
                description={t("agentdock.settings.language.description")}
                control={<LocaleSwitcher />}
              />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
