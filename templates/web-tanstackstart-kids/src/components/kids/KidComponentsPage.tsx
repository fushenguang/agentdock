import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Selector } from "@astryxdesign/core/Selector";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Stack } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Toast } from "@astryxdesign/core/Toast";
import { Token } from "@astryxdesign/core/Token";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { Carousel } from "@astryxdesign/core/Carousel";
import { useTranslator } from "@astryxdesign/core/i18n";
import { DEFAULT_LOCALE, type AppLocale } from "@/i18n";
import * as stylex from "@stylexjs/stylex";
import { useState, type ReactNode } from "react";
import { KidBackground } from "./KidBackground";
import { KidIconBadge } from "./KidIcon";
import { KidIllustration } from "./KidIllustration";
import { KidState } from "./KidState";
import { KidTitleRibbon } from "./KidTitleRibbon";

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
  stackDemos: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-4)",
  },
  carouselCard: {
    width: "260px",
    minHeight: "180px",
  },
  toast: {
    width: "100%",
    maxWidth: "520px",
  },
  stateGrid: {
    width: "100%",
  },
  patternPanel: {
    padding: "var(--spacing-5)",
    borderRadius: "var(--radius-container)",
    borderColor: "var(--color-border)",
    borderStyle: "solid",
    borderWidth: "2px",
  },
});

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

interface KidComponentsPageProps {
  readonly locale?: AppLocale;
}

export function KidComponentsPage({ locale = DEFAULT_LOCALE }: KidComponentsPageProps) {
  const t = useTranslator();
  const [isChecked, setIsChecked] = useState(true);
  const [radioValue, setRadioValue] = useState("garden");
  const [isSwitchOn, setIsSwitchOn] = useState(true);
  const [textValue, setTextValue] = useState("");
  const [selectedValue, setSelectedValue] = useState("garden");
  const [activeTab, setActiveTab] = useState("garden");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectorOptions = [
    {
      value: "garden",
      label: t("agentdock.components.selector.garden"),
      description: t("agentdock.components.selector.gardenDescription"),
    },
    {
      value: "workshop",
      label: t("agentdock.components.selector.workshop"),
      description: t("agentdock.components.selector.workshopDescription"),
    },
  ];

  const tabContent =
    activeTab === "garden"
      ? t("agentdock.components.tabs.gardenPanel")
      : t("agentdock.components.tabs.workshopPanel");

  return (
    <KidBackground pattern="dots">
      <Stack gap={8} width="100%" maxWidth={1120} xstyle={styles.page}>
        <KidTitleRibbon
          title={t("agentdock.components.title")}
          subtitle={t("agentdock.components.description")}
          level={1}
          action={
            <Stack direction="horizontal" gap={2} wrap="wrap">
              <Button
                variant="secondary"
                label={t("agentdock.components.advanced")}
                href={`/${locale}/advanced-components`}
              />
              <Button
                variant="primary"
                label={t("agentdock.components.openDialog")}
                onClick={() => setIsDialogOpen(true)}
              />
            </Stack>
          }
        />

        <Grid columns={{ minWidth: 300, max: 3 }} gap={5}>
          <DemoSection
            id="component-button"
            title={t("agentdock.components.button.title")}
            description={t("agentdock.components.button.description")}
          >
            <div {...stylex.props(styles.demos)}>
              <Button label={t("agentdock.components.button.primary")} variant="primary" />
              <Button label={t("agentdock.components.button.secondary")} variant="secondary" />
            </div>
          </DemoSection>

          <DemoSection
            id="component-checkbox"
            title={t("agentdock.components.checkbox.title")}
            description={t("agentdock.components.checkbox.description")}
          >
            <CheckboxInput
              label={t("agentdock.components.checkbox.label")}
              description={t("agentdock.components.checkbox.helper")}
              value={isChecked}
              onChange={setIsChecked}
            />
          </DemoSection>

          <DemoSection
            id="component-radio"
            title={t("agentdock.components.radio.title")}
            description={t("agentdock.components.radio.description")}
          >
            <RadioList
              label={t("agentdock.components.radio.label")}
              value={radioValue}
              onChange={setRadioValue}
              orientation="horizontal"
            >
              <RadioListItem label={t("agentdock.components.radio.garden")} value="garden" />
              <RadioListItem label={t("agentdock.components.radio.workshop")} value="workshop" />
            </RadioList>
          </DemoSection>

          <DemoSection
            id="component-switch"
            title={t("agentdock.components.switch.title")}
            description={t("agentdock.components.switch.description")}
          >
            <Switch
              label={t("agentdock.components.switch.label")}
              description={t("agentdock.components.switch.helper")}
              value={isSwitchOn}
              onChange={setIsSwitchOn}
            />
          </DemoSection>

          <DemoSection
            id="component-input"
            title={t("agentdock.components.input.title")}
            description={t("agentdock.components.input.description")}
          >
            <TextInput
              label={t("agentdock.components.input.label")}
              description={t("agentdock.components.input.helper")}
              placeholder={t("agentdock.components.input.placeholder")}
              value={textValue}
              onChange={setTextValue}
            />
          </DemoSection>

          <DemoSection
            id="component-select"
            title={t("agentdock.components.select.title")}
            description={t("agentdock.components.select.description")}
          >
            <Selector
              label={t("agentdock.components.select.label")}
              description={t("agentdock.components.select.helper")}
              placeholder={t("agentdock.components.select.placeholder")}
              options={selectorOptions}
              value={selectedValue}
              onChange={setSelectedValue}
            />
          </DemoSection>

          <DemoSection
            id="component-tabs"
            title={t("agentdock.components.tabs.title")}
            description={t("agentdock.components.tabs.description")}
          >
            <Stack gap={3}>
              <TabList
                value={activeTab}
                onChange={setActiveTab}
                role="tablist"
                aria-label={t("agentdock.components.tabs.label")}
              >
                <Tab
                  value="garden"
                  label={t("agentdock.components.tabs.garden")}
                  panelId="component-tabs-panel"
                />
                <Tab
                  value="workshop"
                  label={t("agentdock.components.tabs.workshop")}
                  panelId="component-tabs-panel"
                />
              </TabList>
              <Text id="component-tabs-panel" role="tabpanel" aria-live="polite">
                {tabContent}
              </Text>
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-collapse"
            title={t("agentdock.components.collapse.title")}
            description={t("agentdock.components.collapse.description")}
          >
            <Collapsible trigger={t("agentdock.components.collapse.trigger")} defaultIsOpen>
              <Text type="body" color="secondary">
                {t("agentdock.components.collapse.content")}
              </Text>
            </Collapsible>
          </DemoSection>

          <DemoSection
            id="component-tag"
            title={t("agentdock.components.tag.title")}
            description={t("agentdock.components.tag.description")}
          >
            <div {...stylex.props(styles.demos)}>
              <Token label={t("agentdock.components.tag.mint")} color="teal" />
              <Token label={t("agentdock.components.tag.sun")} color="yellow" />
            </div>
          </DemoSection>

          <DemoSection
            id="component-badge"
            title={t("agentdock.components.badge.title")}
            description={t("agentdock.components.badge.description")}
          >
            <div {...stylex.props(styles.demos)}>
              <Badge variant="success" label={t("agentdock.components.badge.ready")} />
              <Badge variant="info" label={t("agentdock.components.badge.new")} />
            </div>
          </DemoSection>

          <DemoSection
            id="component-tooltip"
            title={t("agentdock.components.tooltip.title")}
            description={t("agentdock.components.tooltip.description")}
          >
            <Tooltip content={t("agentdock.components.tooltip.content")}>
              <Button label={t("agentdock.components.tooltip.trigger")} variant="secondary" />
            </Tooltip>
          </DemoSection>

          <DemoSection
            id="component-toast"
            title={t("agentdock.components.toast.title")}
            description={t("agentdock.components.toast.description")}
          >
            <Stack gap={3} width="100%" maxWidth={520}>
              <Toast
                type="info"
                body={t("agentdock.components.toast.info")}
                isAutoHide={false}
                autoHideDuration={0}
                onDismiss={() => undefined}
              />
              <Toast
                type="error"
                body={t("agentdock.components.toast.error")}
                isAutoHide={false}
                autoHideDuration={0}
                onDismiss={() => undefined}
              />
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-skeleton"
            title={t("agentdock.components.skeleton.title")}
            description={t("agentdock.components.skeleton.description")}
          >
            <Stack gap={4}>
              <Skeleton
                data-testid="component-skeleton-shape"
                width="100%"
                height={24}
                radius="rounded"
              />
              <Skeleton width="78%" height={24} radius="rounded" />
              <Spinner label={t("agentdock.components.skeleton.loading")} />
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-states"
            title={t("agentdock.components.states.title")}
            description={t("agentdock.components.states.description")}
          >
            <Grid columns={{ minWidth: 220, max: 3 }} gap={4} xstyle={styles.stateGrid}>
              <KidState
                kind="empty"
                title={t("agentdock.components.states.empty")}
                description={t("agentdock.components.states.emptyDescription")}
                isCompact
              />
              <KidState
                kind="error"
                title={t("agentdock.components.states.error")}
                description={t("agentdock.components.states.errorDescription")}
                isCompact
              />
              <KidState
                kind="success"
                title={t("agentdock.components.states.success")}
                description={t("agentdock.components.states.successDescription")}
                isCompact
              />
            </Grid>
          </DemoSection>

          <DemoSection
            id="component-title"
            title={t("agentdock.components.titleRibbon.title")}
            description={t("agentdock.components.titleRibbon.description")}
          >
            <KidTitleRibbon
              title={t("agentdock.components.titleRibbon.demoTitle")}
              subtitle={t("agentdock.components.titleRibbon.demoSubtitle")}
            />
          </DemoSection>

          <DemoSection
            id="component-background"
            title={t("agentdock.components.background.title")}
            description={t("agentdock.components.background.description")}
          >
            <KidBackground pattern="hills">
              <Stack gap={3} xstyle={styles.patternPanel}>
                <KidIconBadge name="home" tone="sun" />
                <Heading level={4}>{t("agentdock.components.background.demoTitle")}</Heading>
                <Text type="body" color="secondary">
                  {t("agentdock.components.background.demoDescription")}
                </Text>
              </Stack>
            </KidBackground>
          </DemoSection>

          <DemoSection
            id="component-divider"
            title={t("agentdock.components.divider.title")}
            description={t("agentdock.components.divider.description")}
          >
            <Stack gap={3}>
              <Text type="body">{t("agentdock.components.divider.before")}</Text>
              <Divider label={t("agentdock.components.divider.label")} variant="strong" />
              <Text type="body">{t("agentdock.components.divider.after")}</Text>
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-dialog"
            title={t("agentdock.components.dialog.title")}
            description={t("agentdock.components.dialog.description")}
          >
            <Stack gap={4}>
              <Button
                label={t("agentdock.components.dialog.open")}
                variant="primary"
                onClick={() => setIsDialogOpen(true)}
              />
              <Dialog isInline isOpen onOpenChange={() => undefined}>
                <Layout
                  header={<DialogHeader title={t("agentdock.components.dialog.previewTitle")} />}
                  content={
                    <LayoutContent>
                      <Text type="body">{t("agentdock.components.dialog.previewBody")}</Text>
                    </LayoutContent>
                  }
                  footer={
                    <LayoutFooter>
                      <Text type="supporting" color="secondary">
                        {t("agentdock.components.dialog.previewNote")}
                      </Text>
                    </LayoutFooter>
                  }
                />
              </Dialog>
            </Stack>
          </DemoSection>

          <DemoSection
            id="component-carousel"
            title={t("agentdock.components.carousel.title")}
            description={t("agentdock.components.carousel.description")}
          >
            <Carousel
              data-testid="component-carousel-region"
              gap={3}
              hasSnap
              aria-label={t("agentdock.components.carousel.label")}
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <Card key={index} variant="muted" elevation="low" xstyle={styles.carouselCard}>
                  <Stack gap={3}>
                    <KidIllustration kind={index % 2 === 0 ? "activity" : "welcome"} size={96} />
                    <Heading level={4}>
                      {t("agentdock.components.carousel.cardTitle", { count: index + 1 })}
                    </Heading>
                    <Text type="supporting" color="secondary">
                      {t("agentdock.components.carousel.cardDescription")}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </Carousel>
          </DemoSection>
        </Grid>

        <Dialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Layout
            header={
              <DialogHeader
                title={t("agentdock.components.dialog.modalTitle")}
                onOpenChange={setIsDialogOpen}
              />
            }
            content={
              <LayoutContent>
                <Text type="body">{t("agentdock.components.dialog.modalBody")}</Text>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <Button
                  label={t("agentdock.components.dialog.close")}
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                />
              </LayoutFooter>
            }
          />
        </Dialog>
      </Stack>
    </KidBackground>
  );
}
