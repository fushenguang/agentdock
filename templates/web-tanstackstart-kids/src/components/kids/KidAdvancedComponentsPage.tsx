import { Badge } from "@astryxdesign/core/Badge";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { CodeBlock } from "@astryxdesign/core/CodeBlock";
import { DateInput } from "@astryxdesign/core/DateInput";
import { Divider } from "@astryxdesign/core/Divider";
import { FileInput } from "@astryxdesign/core/FileInput";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { Lightbox } from "@astryxdesign/core/Lightbox";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Slider } from "@astryxdesign/core/Slider";
import { Stack } from "@astryxdesign/core/Stack";
import { Table, proportional } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { Thumbnail } from "@astryxdesign/core/Thumbnail";
import { TimeInput, type ISOTimeString } from "@astryxdesign/core/TimeInput";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import type { ISODateString } from "@astryxdesign/core/utils";
import { useTranslator } from "@astryxdesign/core/i18n";
import { useChildExperience } from "@/components/appearance";
import { DEFAULT_LOCALE, type AppLocale } from "@/i18n";
import * as stylex from "@stylexjs/stylex";
import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { KidBackground } from "./KidBackground";
import { KidTitleRibbon } from "./KidTitleRibbon";

const demoImage =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" rx="40" fill="#FFF6D8"/><circle cx="170" cy="150" r="58" fill="#F5B82E"/><path d="M0 330c105-100 220-104 330-18 98-77 207-77 310 20v88H0Z" fill="#8FD4B8"/><path d="M0 365c130-72 240-66 340 4 98-53 198-49 300 14v37H0Z" fill="#5FA8FF" opacity=".58"/></svg>',
  );

type ReviewRow = {
  readonly id: string;
  readonly task: string;
  readonly status: string;
  readonly owner: string;
} & Record<string, unknown>;

const styles = stylex.create({
  page: {
    marginInline: "auto",
  },
  section: {
    scrollMarginBlockStart: "var(--spacing-8)",
  },
  sectionCard: {
    alignSelf: "start",
    height: "fit-content",
  },
  demos: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "var(--spacing-4)",
  },
  tableFrame: {
    maxWidth: "100%",
    overflowX: "auto",
  },
  media: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "var(--spacing-4)",
  },
  sheetContent: {
    padding: "var(--spacing-2)",
  },
  code: {
    maxWidth: "100%",
  },
});

function ClientOnly({
  children,
  fallback,
}: {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
}) {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  return isClient ? children : fallback;
}

interface DemoSectionProps {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}

function DemoSection({ id, title, description, children }: DemoSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} data-testid={id} aria-labelledby={titleId} {...stylex.props(styles.section)}>
      <Card variant="muted" elevation="low" xstyle={styles.sectionCard}>
        <Stack gap={4}>
          <Heading id={titleId} level={3}>
            {title}
          </Heading>
          <Text type="body" color="secondary">
            {description}
          </Text>
          <Divider />
          {children}
        </Stack>
      </Card>
    </section>
  );
}

interface KidAdvancedComponentsPageProps {
  readonly locale?: AppLocale;
}

export function KidAdvancedComponentsPage({
  locale = DEFAULT_LOCALE,
}: KidAdvancedComponentsPageProps) {
  const t = useTranslator();
  const { capabilities } = useChildExperience();
  const [rangeValue, setRangeValue] = useState(2);
  const [dateValue, setDateValue] = useState<ISODateString | undefined>(undefined);
  const [timeValue, setTimeValue] = useState<ISOTimeString | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [fileValue, setFileValue] = useState<File | File[] | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const tableDensity = {
    airy: "spacious",
    comfortable: "balanced",
    focused: "compact",
  } as const;
  const resolvedTableDensity = tableDensity[capabilities.density];
  const paginationSize = capabilities.density === "focused" ? "sm" : "md";

  const tableRows: ReviewRow[] = [
    {
      id: "review-1",
      task: t("agentdock.advanced.table.rowOne"),
      status: t("agentdock.advanced.table.ready"),
      owner: t("agentdock.advanced.table.team"),
    },
    {
      id: "review-2",
      task: t("agentdock.advanced.table.rowTwo"),
      status: t("agentdock.advanced.table.checking"),
      owner: t("agentdock.advanced.table.team"),
    },
    {
      id: "review-3",
      task: t("agentdock.advanced.table.rowThree"),
      status: t("agentdock.advanced.table.saved"),
      owner: t("agentdock.advanced.table.team"),
    },
  ];

  const tableColumns = [
    {
      key: "task" as const,
      header: t("agentdock.advanced.table.task"),
      width: proportional(2),
    },
    {
      key: "status" as const,
      header: t("agentdock.advanced.table.status"),
      width: proportional(1),
    },
    {
      key: "owner" as const,
      header: t("agentdock.advanced.table.owner"),
      width: proportional(1),
    },
  ];

  const media = [
    {
      src: demoImage,
      alt: t("agentdock.advanced.lightbox.alt"),
      caption: t("agentdock.advanced.lightbox.caption"),
    },
  ];

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  return (
    <KidBackground pattern="grid">
      <Stack gap={8} width="100%" maxWidth={1120} xstyle={styles.page}>
        <KidTitleRibbon
          title={t("agentdock.advanced.title")}
          subtitle={t("agentdock.advanced.description")}
          level={1}
          action={
            <Button
              variant="secondary"
              label={t("agentdock.advanced.back")}
              href={`/${locale}/components`}
            />
          }
        />

        <Grid columns={{ minWidth: 300, max: 3 }} gap={5}>
          <DemoSection
            id="component-card"
            title={t("agentdock.advanced.card.title")}
            description={t("agentdock.advanced.card.description")}
          >
            <div {...stylex.props(styles.demos)}>
              <Card variant="default" elevation="low" padding={3}>
                <Stack gap={2}>
                  <Heading level={4}>{t("agentdock.advanced.card.primary")}</Heading>
                  <Text type="supporting" color="secondary">
                    {t("agentdock.advanced.card.primaryDescription")}
                  </Text>
                </Stack>
              </Card>
              <Card variant="yellow" elevation="none" padding={3}>
                <Stack gap={2}>
                  <Heading level={4}>{t("agentdock.advanced.card.warm")}</Heading>
                  <Text type="supporting" color="secondary">
                    {t("agentdock.advanced.card.warmDescription")}
                  </Text>
                </Stack>
              </Card>
            </div>
          </DemoSection>

          <DemoSection
            id="component-progress"
            title={t("agentdock.advanced.progress.title")}
            description={t("agentdock.advanced.progress.description")}
          >
            <Stack gap={5}>
              <ProgressBar
                label={t("agentdock.advanced.progress.label")}
                value={3}
                max={5}
                hasValueLabel
              />
              <ProgressBar
                label={t("agentdock.advanced.progress.indeterminate")}
                isIndeterminate
                variant="success"
              />
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-form"
            title={t("agentdock.advanced.form.title")}
            description={t("agentdock.advanced.form.description")}
          >
            <FormLayout direction="vertical" defaultOptionality="optional">
              <Slider
                label={t("agentdock.advanced.form.rangeLabel")}
                description={t("agentdock.advanced.form.rangeDescription")}
                min={1}
                max={4}
                value={rangeValue}
                onChange={setRangeValue}
              />
            </FormLayout>
          </DemoSection>

          <DemoSection
            id="component-date-input"
            title={t("agentdock.advanced.date.title")}
            description={t("agentdock.advanced.date.description")}
          >
            <ClientOnly fallback={<Skeleton width="100%" height={132} radius="rounded" />}>
              <DateInput
                label={t("agentdock.advanced.date.label")}
                description={t("agentdock.advanced.date.helper")}
                value={dateValue}
                onChange={setDateValue}
                min="2026-01-01"
                max="2026-12-31"
                hasClear
                weekStartsOn="mon"
              />
            </ClientOnly>
          </DemoSection>

          <DemoSection
            id="component-time-input"
            title={t("agentdock.advanced.time.title")}
            description={t("agentdock.advanced.time.description")}
          >
            <ClientOnly fallback={<Skeleton width="100%" height={132} radius="rounded" />}>
              <TimeInput
                label={t("agentdock.advanced.time.label")}
                description={t("agentdock.advanced.time.helper")}
                value={timeValue}
                onChange={setTimeValue}
                hourFormat="24h"
                increment={15}
                hasClear
              />
            </ClientOnly>
          </DemoSection>

          <DemoSection
            id="component-timestamp"
            title={t("agentdock.advanced.timestamp.title")}
            description={t("agentdock.advanced.timestamp.description")}
          >
            <Stack gap={3}>
              <Timestamp value="2026-09-28T08:30:00.000Z" format="date_time" />
              <Timestamp value="2026-09-28T08:30:00.000Z" format="relative" isLive />
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-table"
            title={t("agentdock.advanced.table.title")}
            description={t("agentdock.advanced.table.description")}
          >
            <div {...stylex.props(styles.tableFrame)}>
              <Table
                data={tableRows}
                columns={tableColumns}
                idKey="id"
                density={resolvedTableDensity}
                isStriped
                hasHover
              />
            </div>
          </DemoSection>

          <DemoSection
            id="component-pagination"
            title={t("agentdock.advanced.pagination.title")}
            description={t("agentdock.advanced.pagination.description")}
          >
            <Pagination
              page={page}
              onChange={setPage}
              totalPages={3}
              size={paginationSize}
              label={t("agentdock.advanced.pagination.label")}
            />
          </DemoSection>

          <DemoSection
            id="component-file-input"
            title={t("agentdock.advanced.file.title")}
            description={t("agentdock.advanced.file.description")}
          >
            <Stack gap={3}>
              <ClientOnly fallback={<Skeleton width="100%" height={148} radius="rounded" />}>
                <FileInput
                  label={t("agentdock.advanced.file.label")}
                  description={t("agentdock.advanced.file.helper")}
                  value={fileValue}
                  onChange={setFileValue}
                  accept="image/*"
                  mode="dropzone"
                  isOptional
                />
              </ClientOnly>
              <Text type="supporting" color="secondary">
                {t("agentdock.advanced.file.safety")}
              </Text>
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-thumbnail"
            title={t("agentdock.advanced.thumbnail.title")}
            description={t("agentdock.advanced.thumbnail.description")}
          >
            <div {...stylex.props(styles.media)}>
              <Thumbnail label={t("agentdock.advanced.thumbnail.label")} />
              <Badge variant="info" label={t("agentdock.advanced.thumbnail.local")} />
            </div>
          </DemoSection>

          <DemoSection
            id="component-lightbox"
            title={t("agentdock.advanced.lightbox.title")}
            description={t("agentdock.advanced.lightbox.description")}
          >
            <Stack gap={3}>
              <Button
                label={t("agentdock.advanced.lightbox.open")}
                variant="secondary"
                onClick={openLightbox}
              />
              <Text type="supporting" color="secondary">
                {t("agentdock.advanced.lightbox.safety")}
              </Text>
              <Lightbox
                isOpen={isLightboxOpen}
                onOpenChange={setIsLightboxOpen}
                media={media}
                hasZoom
              />
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-bottom-sheet"
            title={t("agentdock.advanced.bottomSheet.title")}
            description={t("agentdock.advanced.bottomSheet.description")}
          >
            <Stack gap={3}>
              <Button
                label={t("agentdock.advanced.bottomSheet.open")}
                variant="secondary"
                onClick={() => setIsSheetOpen(true)}
              />
              <BottomSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                label={t("agentdock.advanced.bottomSheet.label")}
                purpose="info"
              >
                <Stack gap={3} xstyle={styles.sheetContent}>
                  <Heading level={4}>{t("agentdock.advanced.bottomSheet.heading")}</Heading>
                  <Text type="body" color="secondary">
                    {t("agentdock.advanced.bottomSheet.body")}
                  </Text>
                  <Button
                    label={t("agentdock.advanced.bottomSheet.close")}
                    variant="primary"
                    onClick={() => setIsSheetOpen(false)}
                  />
                </Stack>
              </BottomSheet>
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-code-block"
            title={t("agentdock.advanced.code.title")}
            description={t("agentdock.advanced.code.description")}
          >
            <CodeBlock
              title={t("agentdock.advanced.code.blockTitle")}
              language="tsx"
              code={`<Button\n  label="Start"\n  variant="primary"\n/>`}
              hasLineNumbers
              isWrapped
              xstyle={styles.code}
            />
          </DemoSection>
        </Grid>
      </Stack>
    </KidBackground>
  );
}
