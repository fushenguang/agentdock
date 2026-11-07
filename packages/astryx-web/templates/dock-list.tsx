import { Button } from '@astryxdesign/core/Button'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { Icon } from '@astryxdesign/core/Icon'
import { List, ListItem } from '@astryxdesign/core/List'
import { MoreMenu } from '@astryxdesign/core/MoreMenu'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Timestamp } from '@astryxdesign/core/Timestamp'
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden'
import { useTranslator } from '@astryxdesign/core/i18n'
import { useState } from 'react'
import { PageShell } from '@/components/layout'
import { useCurrentLocale } from '@/i18n'

const FILTERS = ['recent', 'all', 'archived'] as const
type Filter = (typeof FILTERS)[number]

const SAMPLE_ITEMS = [
  {
    id: 'brief',
    titleKey: 'page.__PAGE__.item.brief.title',
    metaKey: 'page.__PAGE__.item.brief.meta',
    updatedAt: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'notes',
    titleKey: 'page.__PAGE__.item.notes.title',
    metaKey: 'page.__PAGE__.item.notes.meta',
    updatedAt: '2026-10-28T14:30:00.000Z',
  },
  {
    id: 'archive',
    titleKey: 'page.__PAGE__.item.archive.title',
    metaKey: 'page.__PAGE__.item.archive.meta',
    updatedAt: '2026-10-20T08:15:00.000Z',
  },
] as const
// Replace with feature data

function isFilter(value: string): value is Filter {
  return FILTERS.some((filter) => filter === value)
}

export default function DockList() {
  const locale = useCurrentLocale()
  const t = useTranslator()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('recent')
  const hasItems: boolean = SAMPLE_ITEMS.length > 0

  const visibleItems = SAMPLE_ITEMS.filter((item) => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return true
    return `${t(item.titleKey)} ${t(item.metaKey)}`.toLocaleLowerCase().includes(query)
  })

  return (
    <PageShell
      title={t('page.__PAGE__.title')}
      backHref={`/${locale}`}
      backLabel={t('page.__PAGE__.back')}
      actions={
        <Button
          label={t('page.__PAGE__.new')}
          size="sm"
          variant="primary"
          onClick={() => undefined}
        />
      }
    >
      <Stack gap={4}>
        <TextInput
          label={t('page.__PAGE__.search.label')}
          isLabelHidden
          value={search}
          onChange={setSearch}
          placeholder={t('page.__PAGE__.search.placeholder')}
          startIcon={<Icon icon="search" size="sm" />}
          hasClear
        />
        <SegmentedControl
          label={t('page.__PAGE__.filter.label')}
          value={filter}
          onChange={(value) => {
            if (isFilter(value)) setFilter(value)
          }}
          layout="fill"
        >
          {FILTERS.map((candidate) => (
            <SegmentedControlItem
              key={candidate}
              value={candidate}
              label={t(`page.__PAGE__.filter.${candidate}`)}
            />
          ))}
        </SegmentedControl>

        {!hasItems ? (
          <EmptyState
            title={t('page.__PAGE__.empty.title')}
            description={t('page.__PAGE__.empty.description')}
            actions={
              <Button label={t('page.__PAGE__.new')} variant="primary" onClick={() => undefined} />
            }
          />
        ) : visibleItems.length === 0 ? (
          <Text type="body" color="secondary">
            {t('page.__PAGE__.noResults')}
          </Text>
        ) : (
          <List
            density="balanced"
            hasDividers
            header={
              <VisuallyHidden>
                <Heading level={2}>{t('page.__PAGE__.listTitle')}</Heading>
              </VisuallyHidden>
            }
          >
            {visibleItems.map((item) => (
              <ListItem
                key={item.id}
                label={t(item.titleKey)}
                description={
                  <Stack direction="horizontal" gap={2} vAlign="center" wrap="wrap">
                    <Text type="supporting" color="secondary">
                      {t(item.metaKey)}
                    </Text>
                    <Timestamp
                      value={item.updatedAt}
                      format="date"
                      type="supporting"
                      color="secondary"
                    />
                  </Stack>
                }
                onClick={() => undefined}
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
        )}

        {visibleItems.length > 0 ? (
          <Stack direction="horizontal" hAlign="center">
            <Button label={t('page.__PAGE__.loadMore')} variant="ghost" onClick={() => undefined} />
          </Stack>
        ) : null}
      </Stack>
    </PageShell>
  )
}

/*
astryx-messages
{
  "en": {
    "page.__PAGE__.title": "Documents",
    "page.__PAGE__.back": "Back",
    "page.__PAGE__.new": "New",
    "page.__PAGE__.search.label": "Search documents",
    "page.__PAGE__.search.placeholder": "Search documents",
    "page.__PAGE__.filter.label": "Document view",
    "page.__PAGE__.filter.recent": "Recent",
    "page.__PAGE__.filter.all": "All",
    "page.__PAGE__.filter.archived": "Archived",
    "page.__PAGE__.empty.title": "No documents yet",
    "page.__PAGE__.empty.description": "Create the first document to start this collection.",
    "page.__PAGE__.noResults": "No documents match this search.",
    "page.__PAGE__.listTitle": "Documents",
    "page.__PAGE__.row.options": "Document actions",
    "page.__PAGE__.row.archive": "Archive",
    "page.__PAGE__.item.brief.title": "Project brief",
    "page.__PAGE__.item.brief.meta": "Product",
    "page.__PAGE__.item.notes.title": "Research notes",
    "page.__PAGE__.item.notes.meta": "Research",
    "page.__PAGE__.item.archive.title": "Team guidelines",
    "page.__PAGE__.item.archive.meta": "Operations",
    "page.__PAGE__.loadMore": "Load more"
  },
  "zh-CN": {
    "page.__PAGE__.title": "文档",
    "page.__PAGE__.back": "返回",
    "page.__PAGE__.new": "新建",
    "page.__PAGE__.search.label": "搜索文档",
    "page.__PAGE__.search.placeholder": "搜索文档",
    "page.__PAGE__.filter.label": "文档视图",
    "page.__PAGE__.filter.recent": "最近",
    "page.__PAGE__.filter.all": "全部",
    "page.__PAGE__.filter.archived": "已归档",
    "page.__PAGE__.empty.title": "暂无文档",
    "page.__PAGE__.empty.description": "创建第一份文档来开始这个集合。",
    "page.__PAGE__.noResults": "没有文档符合此搜索。",
    "page.__PAGE__.listTitle": "文档",
    "page.__PAGE__.row.options": "文档操作",
    "page.__PAGE__.row.archive": "归档",
    "page.__PAGE__.item.brief.title": "项目简介",
    "page.__PAGE__.item.brief.meta": "产品",
    "page.__PAGE__.item.notes.title": "研究笔记",
    "page.__PAGE__.item.notes.meta": "研究",
    "page.__PAGE__.item.archive.title": "团队指南",
    "page.__PAGE__.item.archive.meta": "运营",
    "page.__PAGE__.loadMore": "加载更多"
  }
}
*/
