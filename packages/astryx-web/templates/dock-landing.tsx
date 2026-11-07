import { Blockquote } from '@astryxdesign/core/Blockquote'
import { ClickableCard } from '@astryxdesign/core/ClickableCard'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden'
import { useTranslator } from '@astryxdesign/core/i18n'
import * as stylex from '@stylexjs/stylex'
import { PageContainer } from '@/components/layout'
import { useCurrentLocale } from '@/i18n'

const styles = stylex.create({
  entries: {
    gridTemplateColumns: 'minmax(0, 1fr)',
    '@container (min-width: 600px)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },
  },
})

const SAMPLE_MODULES = [
  {
    id: 'primary',
    path: 'primary',
    titleKey: 'page.__PAGE__.module.primary.title',
    descriptionKey: 'page.__PAGE__.module.primary.description',
  },
  {
    id: 'secondary',
    path: 'secondary',
    titleKey: 'page.__PAGE__.module.secondary.title',
    descriptionKey: 'page.__PAGE__.module.secondary.description',
  },
  {
    id: 'settings',
    path: 'settings',
    titleKey: 'page.__PAGE__.module.settings.title',
    descriptionKey: 'page.__PAGE__.module.settings.description',
  },
] as const
// Replace with feature data

export default function DockLanding() {
  const locale = useCurrentLocale()
  const t = useTranslator()

  return (
    <PageContainer>
      <VisuallyHidden>
        <Heading level={1}>{t('page.__PAGE__.title')}</Heading>
      </VisuallyHidden>
      <Blockquote>{t('page.__PAGE__.orientation')}</Blockquote>
      <Grid columns={3} gap={3} xstyle={styles.entries}>
        {SAMPLE_MODULES.map((module) => {
          const title = t(module.titleKey)
          return (
            <ClickableCard
              key={module.id}
              label={title}
              href={`/${locale}/${module.path}`}
              padding={3}
            >
              <Stack gap={1}>
                <Text type="body" weight="semibold">
                  {title}
                </Text>
                <Text type="supporting" color="secondary">
                  {t(module.descriptionKey)}
                </Text>
              </Stack>
            </ClickableCard>
          )
        })}
      </Grid>
    </PageContainer>
  )
}

/*
astryx-messages
{
  "en": {
    "page.__PAGE__.title": "Overview",
    "page.__PAGE__.orientation": "Choose a module to continue.",
    "page.__PAGE__.module.primary.title": "Primary workspace",
    "page.__PAGE__.module.primary.description": "Open the main work for this page.",
    "page.__PAGE__.module.secondary.title": "Recent activity",
    "page.__PAGE__.module.secondary.description": "Review the latest changes and decisions.",
    "page.__PAGE__.module.settings.title": "Settings",
    "page.__PAGE__.module.settings.description": "Adjust preferences for this workspace."
  },
  "zh-CN": {
    "page.__PAGE__.title": "概览",
    "page.__PAGE__.orientation": "选择一个模块继续。",
    "page.__PAGE__.module.primary.title": "主工作区",
    "page.__PAGE__.module.primary.description": "打开此页面的主要工作。",
    "page.__PAGE__.module.secondary.title": "最近活动",
    "page.__PAGE__.module.secondary.description": "查看最近的更改与决定。",
    "page.__PAGE__.module.settings.title": "设置",
    "page.__PAGE__.module.settings.description": "调整此工作区的偏好。"
  }
}
*/
