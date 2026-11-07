import { Heading } from '@astryxdesign/core/Heading'
import { Icon, type IconName } from '@astryxdesign/core/Icon'
import { Selector } from '@astryxdesign/core/Selector'
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav'
import { Stack } from '@astryxdesign/core/Stack'
import { Switch } from '@astryxdesign/core/Switch'
import { Tab, TabList } from '@astryxdesign/core/TabList'
import { Text } from '@astryxdesign/core/Text'
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden'
import { useTranslator } from '@astryxdesign/core/i18n'
import * as stylex from '@stylexjs/stylex'
import { useState, type ReactNode } from 'react'
import { PageContainer } from '@/components/layout'

const SECTIONS = [
  { id: 'general', icon: 'wrench' },
  { id: 'notifications', icon: 'info' },
  { id: 'privacy', icon: 'eyeSlash' },
] as const
type SectionId = (typeof SECTIONS)[number]['id']

const ROWS = {
  general: [
    {
      id: 'theme',
      icon: 'wrench',
      titleKey: 'page.__PAGE__.general.theme.title',
      descriptionKey: 'page.__PAGE__.general.theme.description',
    },
  ],
  notifications: [
    {
      id: 'updates',
      icon: 'info',
      titleKey: 'page.__PAGE__.notifications.updates.title',
      descriptionKey: 'page.__PAGE__.notifications.updates.description',
    },
  ],
  privacy: [
    {
      id: 'history',
      icon: 'eyeSlash',
      titleKey: 'page.__PAGE__.privacy.history.title',
      descriptionKey: 'page.__PAGE__.privacy.history.description',
    },
  ],
} as const

const styles = stylex.create({
  pageColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
    minHeight: 0,
    width: '100%',
    overflow: 'hidden',
    '@container (min-width: 420px)': { gap: '1.5rem' },
  },
  layout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
    minHeight: 0,
    width: '100%',
    '@container (min-width: 640px)': { flexDirection: 'row', gap: '1.5rem' },
  },
  wideNav: {
    display: 'none',
    '@container (min-width: 640px)': { display: 'block', width: '13rem', flexShrink: 0 },
  },
  sideNav: { width: '100%' },
  narrowNav: {
    width: '100%',
    '@container (min-width: 640px)': { display: 'none' },
  },
  panel: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    overflowY: 'auto',
    paddingBlockEnd: '1rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '0.75rem',
    '@container (min-width: 480px)': {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  },
  copy: { minWidth: 0 },
  control: {
    flexShrink: 0,
    '@container (max-width: 479px)': { width: '100%' },
  },
})

function isSectionId(value: string): value is SectionId {
  return SECTIONS.some((section) => section.id === value)
}

interface SettingsRowProps {
  readonly icon: IconName
  readonly title: string
  readonly description: string
  readonly control: ReactNode
}

function SettingsRow({ icon, title, description, control }: SettingsRowProps) {
  return (
    <Stack direction="horizontal" gap={2} vAlign="start" xstyle={styles.row}>
      <Stack direction="horizontal" gap={2} vAlign="start" xstyle={styles.copy}>
        <Icon icon={icon} size="sm" color="secondary" />
        <Stack gap={0.5} xstyle={styles.copy}>
          <Text type="body" weight="semibold">
            {title}
          </Text>
          <Text type="supporting" color="secondary">
            {description}
          </Text>
        </Stack>
      </Stack>
      <Stack xstyle={styles.control}>{control}</Stack>
    </Stack>
  )
}

export default function DockSettings() {
  const t = useTranslator()
  const [section, setSection] = useState<SectionId>('general')
  const [theme, setTheme] = useState('neutral')
  const [notifications, setNotifications] = useState(true)
  const [history, setHistory] = useState(false)
  const rows = ROWS[section]

  return (
    <PageContainer isFullHeight>
      <VisuallyHidden>
        <Heading level={1}>{t('page.__PAGE__.title')}</Heading>
      </VisuallyHidden>
      <Stack xstyle={styles.pageColumn}>
        <Stack direction="horizontal" gap={4} xstyle={styles.layout}>
          <TabList
            aria-label={t('page.__PAGE__.sections')}
            value={section}
            onChange={(value) => {
              if (isSectionId(value)) setSection(value)
            }}
            size="sm"
            hasDivider
            xstyle={styles.narrowNav}
          >
            {SECTIONS.map((candidate) => (
              <Tab
                key={candidate.id}
                value={candidate.id}
                label={t(`page.__PAGE__.section.${candidate.id}`)}
                icon={<Icon icon={candidate.icon} size="sm" />}
              />
            ))}
          </TabList>

          <Stack xstyle={styles.wideNav}>
            <SideNav aria-label={t('page.__PAGE__.sections')} xstyle={styles.sideNav}>
              <SideNavSection title={t('page.__PAGE__.sections')} isHeaderHidden>
                {SECTIONS.map((candidate) => (
                  <SideNavItem
                    key={candidate.id}
                    label={t(`page.__PAGE__.section.${candidate.id}`)}
                    icon={<Icon icon={candidate.icon} size="sm" />}
                    isSelected={candidate.id === section}
                    onClick={() => setSection(candidate.id)}
                  />
                ))}
              </SideNavSection>
            </SideNav>
          </Stack>

          <Stack gap={4} isScrollable xstyle={styles.panel}>
            {rows.map((row) => {
              const control =
                row.id === 'theme' ? (
                  <Selector
                    label={t('page.__PAGE__.general.theme.control')}
                    value={theme}
                    onChange={setTheme}
                    options={[
                      { value: 'neutral', label: t('page.__PAGE__.general.theme.neutral') },
                      { value: 'matcha', label: t('page.__PAGE__.general.theme.matcha') },
                      { value: 'stone', label: t('page.__PAGE__.general.theme.stone') },
                    ]}
                  />
                ) : row.id === 'updates' ? (
                  <Switch
                    label={t('page.__PAGE__.notifications.updates.control')}
                    value={notifications}
                    onChange={setNotifications}
                  />
                ) : (
                  <Switch
                    label={t('page.__PAGE__.privacy.history.control')}
                    value={history}
                    onChange={setHistory}
                  />
                )

              return (
                <SettingsRow
                  key={row.id}
                  icon={row.icon}
                  title={t(row.titleKey)}
                  description={t(row.descriptionKey)}
                  control={control}
                />
              )
            })}
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  )
}

/*
astryx-messages
{
  "en": {
    "page.__PAGE__.title": "Settings",
    "page.__PAGE__.sections": "Settings sections",
    "page.__PAGE__.section.general": "General",
    "page.__PAGE__.section.notifications": "Notifications",
    "page.__PAGE__.section.privacy": "Privacy",
    "page.__PAGE__.general.theme.title": "Theme",
    "page.__PAGE__.general.theme.description": "Choose the color system used across the workspace.",
    "page.__PAGE__.general.theme.control": "Theme",
    "page.__PAGE__.general.theme.neutral": "Neutral",
    "page.__PAGE__.general.theme.matcha": "Matcha",
    "page.__PAGE__.general.theme.stone": "Stone",
    "page.__PAGE__.notifications.updates.title": "Product updates",
    "page.__PAGE__.notifications.updates.description": "Receive occasional messages about new features.",
    "page.__PAGE__.notifications.updates.control": "Product updates",
    "page.__PAGE__.privacy.history.title": "Activity history",
    "page.__PAGE__.privacy.history.description": "Keep recent activity available in this workspace.",
    "page.__PAGE__.privacy.history.control": "Activity history"
  },
  "zh-CN": {
    "page.__PAGE__.title": "设置",
    "page.__PAGE__.sections": "设置分区",
    "page.__PAGE__.section.general": "通用",
    "page.__PAGE__.section.notifications": "通知",
    "page.__PAGE__.section.privacy": "隐私",
    "page.__PAGE__.general.theme.title": "主题",
    "page.__PAGE__.general.theme.description": "选择整个工作区使用的色彩系统。",
    "page.__PAGE__.general.theme.control": "主题",
    "page.__PAGE__.general.theme.neutral": "中性",
    "page.__PAGE__.general.theme.matcha": "抹茶",
    "page.__PAGE__.general.theme.stone": "石色",
    "page.__PAGE__.notifications.updates.title": "产品更新",
    "page.__PAGE__.notifications.updates.description": "偶尔接收新功能消息。",
    "page.__PAGE__.notifications.updates.control": "产品更新",
    "page.__PAGE__.privacy.history.title": "活动历史",
    "page.__PAGE__.privacy.history.description": "在此工作区保留最近活动。",
    "page.__PAGE__.privacy.history.control": "活动历史"
  }
}
*/
