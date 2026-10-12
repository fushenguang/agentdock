import { Button } from "@astryxdesign/core/Button";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { useTranslator } from "@astryxdesign/core/i18n";
import * as stylex from "@stylexjs/stylex";
import { useState, useTransition } from "react";
import type { Greeting } from "@/core/types/greeting";
import { useCurrentLocale } from "@/i18n";
import { HorizontalFields, PageShell, SideDrawer } from "./layout";

/**
 * The reference **second-level page**, and the live sample of the page contract.
 *
 * - It opens on the one-screen skeleton (`PageShell`): the top bar holds the way back plus this page's
 *   action, the page itself does not scroll, and only the content region scrolls.
 * - **The page holds the thing itself** — here, the board — and everything that is a form or a
 *   setting is pushed into the right-hand drawer (`SideDrawer`). The drawer does not dim the page, so
 *   the board stays visible while the drawer changes it (that is the point of the no-scrim rule).
 * - The drawer's secondary group is a `Collapsible` with `chevronPosition="start"` and an explicit
 *   `defaultIsOpen={false}` — Astryx's default is `true`, so collapsing has to be said out loud.
 *   Its row ends in an end-aligned `MoreMenu` (`alignment="end"`, icon + text items) instead of a row
 *   of buttons.
 * - Short labels with plain controls read across in `HorizontalFields`; the message stays a stacked
 *   `TextArea` because it is multi-line, and the switch stays on its own line because its label
 *   travels with the track.
 * - The list keys on `greeting.id`. A content-derived key would remount the row as you type and drop
 *   the input's focus.
 */
const styles = stylex.create({
  section: {
    flex: 1,
    minWidth: 0,
  },
  sectionBody: {
    paddingBlockStart: "0.75rem",
  },
  actions: {
    justifyContent: "flex-end",
  },
});

type SortOrder = "newest" | "oldest";

interface HelloWorkspaceProps {
  readonly greetings: readonly Greeting[];
  readonly onCreate: (message: string) => Promise<void>;
}

export function HelloWorkspace({ greetings, onCreate }: HelloWorkspaceProps) {
  const locale = useCurrentLocale();
  const t = useTranslator();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [showTime, setShowTime] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // The board's view options are session state: they change what this page shows, and that is all
  // they are for, so they never claim to be stored.
  const ordered = sort === "newest" ? greetings : greetings.toReversed();

  function resetOptions() {
    setSort("newest");
    setShowTime(true);
  }

  function submit() {
    const nextMessage = message.trim();
    if (!nextMessage) return;

    startTransition(async () => {
      try {
        await onCreate(nextMessage);
        setMessage("");
        setError(null);
        setIsDrawerOpen(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("agentdock.hello.error.save"));
      }
    });
  }

  return (
    <PageShell
      title={t("agentdock.hello.title")}
      backHref={`/${locale}`}
      backLabel={t("agentdock.page.back")}
      actions={
        <Button
          label={t("agentdock.hello.add")}
          size="sm"
          variant="primary"
          onClick={() => setIsDrawerOpen(true)}
        />
      }
    >
      {greetings.length === 0 ? (
        <Text type="body" color="secondary">
          {t("agentdock.hello.empty")}
        </Text>
      ) : (
        <List density="balanced" hasDividers>
          {ordered.map((greeting) => (
            <ListItem
              key={greeting.id}
              label={greeting.message}
              description={
                showTime ? (
                  <Timestamp
                    value={greeting.createdAt.toISOString()}
                    format="date_time"
                    type="supporting"
                    color="secondary"
                  />
                ) : undefined
              }
            />
          ))}
        </List>
      )}

      <SideDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        label={t("agentdock.hello.newGreeting")}
        header={t("agentdock.hello.newGreeting")}
      >
        <Stack gap={4}>
          <TextArea
            label={t("agentdock.hello.fieldMessage")}
            value={message}
            onChange={setMessage}
            placeholder={t("agentdock.hello.placeholder")}
            isRequired
            status={error ? { type: "error", message: error } : undefined}
          />

          <Stack direction="horizontal" gap={1} vAlign="start">
            <Collapsible
              trigger={t("agentdock.hello.viewOptions")}
              chevronPosition="start"
              defaultIsOpen={false}
              xstyle={styles.section}
            >
              <Stack gap={3} xstyle={styles.sectionBody}>
                <HorizontalFields>
                  <Selector
                    label={t("agentdock.hello.sort")}
                    value={sort}
                    onChange={(value) => setSort(value as SortOrder)}
                    options={[
                      { value: "newest", label: t("agentdock.hello.sort.newest") },
                      { value: "oldest", label: t("agentdock.hello.sort.oldest") },
                    ]}
                  />
                </HorizontalFields>
                {/* A switch stays on its own line: its label travels with the track, so it does not
                    join the label column and would break the group's shared alignment. */}
                <Switch
                  label={t("agentdock.hello.showTime")}
                  value={showTime}
                  onChange={setShowTime}
                />
              </Stack>
            </Collapsible>
            <MoreMenu
              size="sm"
              alignment="end"
              label={t("agentdock.hello.options")}
              items={[
                {
                  id: "fill-sample",
                  label: t("agentdock.hello.fillSample"),
                  icon: <Icon icon="check" size="sm" />,
                  onClick: () => setMessage(t("agentdock.hello.sample")),
                },
                {
                  id: "reset-options",
                  label: t("agentdock.hello.resetOptions"),
                  icon: <Icon icon="close" size="sm" />,
                  onClick: resetOptions,
                },
              ]}
            />
          </Stack>

          <Stack direction="horizontal" hAlign="end" xstyle={styles.actions}>
            <Button
              label={t("agentdock.hello.add")}
              variant="primary"
              onClick={submit}
              isLoading={isPending}
              isDisabled={!message.trim()}
            />
          </Stack>
        </Stack>
      </SideDrawer>
    </PageShell>
  );
}
