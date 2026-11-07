// astryx-template: dock-workbench | package: @cogito.ai/astryx-web | intent: "workbench page with a top bar and sections" | astryx: 0.7.5
import { Button } from "@astryxdesign/core/Button";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
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
import { createFileRoute, useRouter } from "@tanstack/react-router";
import * as stylex from "@stylexjs/stylex";
import { useState, useTransition } from "react";
import { HorizontalFields, PageShell, SideDrawer } from "@/components/layout";
import type { Greeting } from "@/core/types/greeting";
import { createGreeting, listGreetings } from "@/features/hello";
import { useCurrentLocale } from "@/i18n";

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

const SORT_ORDERS = ["newest", "oldest"] as const;
type SortOrder = (typeof SORT_ORDERS)[number];

function isSortOrder(value: string): value is SortOrder {
  return SORT_ORDERS.some((order) => order === value);
}

interface DockWorkbenchProps {
  readonly greetings: readonly Greeting[];
  readonly onCreate: (message: string) => Promise<void>;
}

function DockWorkbench({ greetings, onCreate }: DockWorkbenchProps) {
  const locale = useCurrentLocale();
  const t = useTranslator();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [showTime, setShowTime] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        setError(cause instanceof Error ? cause.message : t("page.hello.error.save"));
      }
    });
  }

  return (
    <PageShell
      title={t("page.hello.title")}
      backHref={`/${locale}`}
      backLabel={t("page.hello.back")}
      actions={
        <Button
          label={t("page.hello.add")}
          size="sm"
          variant="primary"
          onClick={() => setIsDrawerOpen(true)}
        />
      }
    >
      <Stack gap={4}>
        <Stack as="section" gap={3}>
          <Heading level={2}>{t("page.hello.section.current")}</Heading>
          {greetings.length === 0 ? (
            <Text type="body" color="secondary">
              {t("page.hello.empty")}
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
        </Stack>

        <Divider variant="subtle" />

        <Stack as="section" gap={3}>
          <Heading level={2}>{t("page.hello.section.review")}</Heading>
          <Text type="body" color="secondary">
            {t("page.hello.section.empty")}
          </Text>
        </Stack>
      </Stack>

      <SideDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        label={t("page.hello.newGreeting")}
        header={t("page.hello.newGreeting")}
      >
        <Stack gap={4}>
          <TextArea
            label={t("page.hello.fieldMessage")}
            value={message}
            onChange={setMessage}
            placeholder={t("page.hello.placeholder")}
            isRequired
            status={error ? { type: "error", message: error } : undefined}
          />

          <Stack direction="horizontal" gap={1} vAlign="start">
            <Collapsible
              trigger={t("page.hello.viewOptions")}
              chevronPosition="start"
              defaultIsOpen={false}
              xstyle={styles.section}
            >
              <Stack gap={3} xstyle={styles.sectionBody}>
                <HorizontalFields>
                  <Selector
                    label={t("page.hello.sort")}
                    value={sort}
                    onChange={(value) => {
                      if (isSortOrder(value)) setSort(value);
                    }}
                    options={[
                      { value: "newest", label: t("page.hello.sort.newest") },
                      { value: "oldest", label: t("page.hello.sort.oldest") },
                    ]}
                  />
                </HorizontalFields>
                <Switch label={t("page.hello.showTime")} value={showTime} onChange={setShowTime} />
              </Stack>
            </Collapsible>
            <MoreMenu
              size="sm"
              alignment="end"
              label={t("page.hello.options")}
              items={[
                {
                  id: "fill-sample",
                  label: t("page.hello.fillSample"),
                  icon: <Icon icon="check" size="sm" />,
                  onClick: () => setMessage(t("page.hello.sample")),
                },
                {
                  id: "reset-options",
                  label: t("page.hello.resetOptions"),
                  icon: <Icon icon="close" size="sm" />,
                  onClick: resetOptions,
                },
              ]}
            />
          </Stack>

          <Stack direction="horizontal" hAlign="end" xstyle={styles.actions}>
            <Button
              label={t("page.hello.add")}
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

export const Route = createFileRoute("/$locale/hello")({
  loader: () => listGreetings(),
  component: HelloPage,
});

function HelloPage() {
  const greetings = Route.useLoaderData();
  const router = useRouter();

  return (
    <DockWorkbench
      greetings={greetings}
      onCreate={async (message) => {
        await createGreeting({ data: { message } });
        await router.invalidate();
      }}
    />
  );
}
