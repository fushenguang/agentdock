import { Button } from '@astryxdesign/core/Button'
import { Divider } from '@astryxdesign/core/Divider'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon } from '@astryxdesign/core/Icon'
import { List, ListItem } from '@astryxdesign/core/List'
import { MoreMenu } from '@astryxdesign/core/MoreMenu'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useTranslator } from '@astryxdesign/core/i18n'
import { useState } from 'react'
import { PageShell, SideDrawer } from '@/components/layout'
import { useCurrentLocale } from '@/i18n'

const SAMPLE_ROWS = [
  {
    id: 'primary',
    titleKey: 'page.__PAGE__.row.primary.title',
    descriptionKey: 'page.__PAGE__.row.primary.description',
  },
  {
    id: 'secondary',
    titleKey: 'page.__PAGE__.row.secondary.title',
    descriptionKey: 'page.__PAGE__.row.secondary.description',
  },
] as const
// Replace with feature data

export default function DockWorkbench() {
  const locale = useCurrentLocale()
  const t = useTranslator()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <PageShell
      title={t('page.__PAGE__.title')}
      backHref={`/${locale}`}
      backLabel={t('page.__PAGE__.back')}
      actions={
        <Stack direction="horizontal" gap={1} vAlign="center">
          <MoreMenu
            label={t('page.__PAGE__.options')}
            alignment="end"
            items={[
              {
                id: 'reset',
                label: t('page.__PAGE__.reset'),
                icon: <Icon icon="close" size="sm" />,
                onClick: () => setDraft(''),
              },
            ]}
          />
          <Button
            label={t('page.__PAGE__.add')}
            size="sm"
            variant="primary"
            onClick={() => setIsDrawerOpen(true)}
          />
        </Stack>
      }
    >
      <Stack gap={4}>
        <Stack as="section" gap={3}>
          <Stack direction="horizontal" hAlign="between" vAlign="center" gap={2}>
            <Heading level={2}>{t('page.__PAGE__.section.current')}</Heading>
            <Button
              label={t('page.__PAGE__.section.add')}
              size="sm"
              variant="ghost"
              onClick={() => setIsDrawerOpen(true)}
            />
          </Stack>
          <List density="balanced" hasDividers>
            {SAMPLE_ROWS.map((row) => (
              <ListItem
                key={row.id}
                label={t(row.titleKey)}
                description={t(row.descriptionKey)}
                endContent={
                  <MoreMenu
                    label={t('page.__PAGE__.row.options')}
                    size="sm"
                    alignment="end"
                    presentation="adaptive"
                    items={[
                      {
                        id: 'archive',
                        label: t('page.__PAGE__.row.archive'),
                        icon: <Icon icon="close" size="sm" />,
                      },
                    ]}
                  />
                }
              />
            ))}
          </List>
        </Stack>

        <Divider variant="subtle" />

        <Stack as="section" gap={3}>
          <Stack direction="horizontal" hAlign="between" vAlign="center" gap={2}>
            <Heading level={2}>{t('page.__PAGE__.section.review')}</Heading>
            <Button
              label={t('page.__PAGE__.section.add')}
              size="sm"
              variant="ghost"
              onClick={() => setIsDrawerOpen(true)}
            />
          </Stack>
          <Text type="body" color="secondary">
            {t('page.__PAGE__.section.empty')}
          </Text>
        </Stack>
      </Stack>

      <SideDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        label={t('page.__PAGE__.drawer.label')}
        header={t('page.__PAGE__.drawer.title')}
      >
        <Stack gap={4}>
          <TextInput
            label={t('page.__PAGE__.field.name')}
            value={draft}
            onChange={setDraft}
            placeholder={t('page.__PAGE__.field.placeholder')}
            isRequired
          />
          <Stack direction="horizontal" hAlign="end">
            <Button
              label={t('page.__PAGE__.drawer.save')}
              variant="primary"
              onClick={() => setIsDrawerOpen(false)}
            />
          </Stack>
        </Stack>
      </SideDrawer>
    </PageShell>
  )
}

/*
astryx-messages
{
  "en": {
    "page.__PAGE__.title": "Workspace",
    "page.__PAGE__.back": "Back",
    "page.__PAGE__.options": "Workspace actions",
    "page.__PAGE__.reset": "Clear draft",
    "page.__PAGE__.add": "Add item",
    "page.__PAGE__.section.current": "Current work",
    "page.__PAGE__.section.review": "Needs review",
    "page.__PAGE__.section.add": "Add",
    "page.__PAGE__.section.empty": "Nothing needs review.",
    "page.__PAGE__.row.primary.title": "Prepare release notes",
    "page.__PAGE__.row.primary.description": "Updated today",
    "page.__PAGE__.row.secondary.title": "Review access request",
    "page.__PAGE__.row.secondary.description": "Waiting for a decision",
    "page.__PAGE__.row.options": "Item actions",
    "page.__PAGE__.row.archive": "Archive",
    "page.__PAGE__.drawer.label": "Add a workspace item",
    "page.__PAGE__.drawer.title": "New item",
    "page.__PAGE__.field.name": "Name",
    "page.__PAGE__.field.placeholder": "Describe the work",
    "page.__PAGE__.drawer.save": "Add item"
  },
  "zh-CN": {
    "page.__PAGE__.title": "工作台",
    "page.__PAGE__.back": "返回",
    "page.__PAGE__.options": "工作台操作",
    "page.__PAGE__.reset": "清空草稿",
    "page.__PAGE__.add": "添加事项",
    "page.__PAGE__.section.current": "当前工作",
    "page.__PAGE__.section.review": "待审核",
    "page.__PAGE__.section.add": "添加",
    "page.__PAGE__.section.empty": "没有待审核事项。",
    "page.__PAGE__.row.primary.title": "准备发布说明",
    "page.__PAGE__.row.primary.description": "今天更新",
    "page.__PAGE__.row.secondary.title": "审核访问请求",
    "page.__PAGE__.row.secondary.description": "等待决定",
    "page.__PAGE__.row.options": "事项操作",
    "page.__PAGE__.row.archive": "归档",
    "page.__PAGE__.drawer.label": "添加工作台事项",
    "page.__PAGE__.drawer.title": "新事项",
    "page.__PAGE__.field.name": "名称",
    "page.__PAGE__.field.placeholder": "描述这项工作",
    "page.__PAGE__.drawer.save": "添加事项"
  }
}
*/
