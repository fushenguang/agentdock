import { DropdownMenu } from '@astryxdesign/core/DropdownMenu'
import { Icon } from '@astryxdesign/core/Icon'
import { IconButton } from '@astryxdesign/core/IconButton'
import { MoreMenu } from '@astryxdesign/core/MoreMenu'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { useTranslator } from '@astryxdesign/core/i18n'
import * as stylex from '@stylexjs/stylex'

const styles = stylex.create({
  frame: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    width: 'calc(100% + 1.5rem)',
    marginInline: '-0.75rem',
    marginBlock: '-0.75rem',
    overflow: 'hidden',
    backgroundColor: 'var(--color-background-muted)',
    '@container (min-width: 420px)': {
      width: 'calc(100% + 2.5rem)',
      marginInline: '-1.25rem',
      marginBlock: '-1.25rem',
    },
  },
  tools: {
    position: 'absolute',
    top: 'max(0.75rem, env(safe-area-inset-top))',
    left: 'max(0.75rem, env(safe-area-inset-left))',
    zIndex: 2,
    padding: '0.25rem',
    borderRadius: 'var(--radius-element)',
    backgroundColor: 'var(--color-background-card)',
    boxShadow: 'var(--shadow-med)',
    '@container (min-width: 640px)': {
      top: 'max(1.5rem, env(safe-area-inset-top))',
      left: 'max(1.5rem, env(safe-area-inset-left))',
    },
  },
  menu: {
    position: 'absolute',
    top: 'max(0.75rem, env(safe-area-inset-top))',
    right: 'max(0.75rem, env(safe-area-inset-right))',
    zIndex: 2,
    '@container (min-width: 640px)': {
      top: 'max(1.5rem, env(safe-area-inset-top))',
      right: 'max(1.5rem, env(safe-area-inset-right))',
    },
  },
  bottomNav: {
    position: 'absolute',
    left: '50%',
    bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    zIndex: 2,
    padding: '0.25rem',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-background-card)',
    boxShadow: 'var(--shadow-med)',
  },
})

function EditorSlot() {
  const t = useTranslator()

  return (
    <Stack
      aria-label={t('page.__PAGE__.slot.label')}
      height="100%"
      hAlign="center"
      vAlign="center"
      gap={2}
    >
      <Text type="body" weight="semibold">
        {t('page.__PAGE__.slot.title')}
      </Text>
      <Text type="supporting" color="secondary">
        {t('page.__PAGE__.slot.description')}
      </Text>
    </Stack>
  )
}

export default function DockEditorFrame() {
  const t = useTranslator()

  return (
    <Stack width="100%" xstyle={styles.frame}>
      <EditorSlot />

      <Stack direction="horizontal" gap={1} xstyle={styles.tools}>
        <IconButton
          label={t('page.__PAGE__.tool.select')}
          icon={<Icon icon="arrowUp" size="sm" />}
          variant="ghost"
          size="sm"
        />
        <IconButton
          label={t('page.__PAGE__.tool.move')}
          icon={<Icon icon="arrowDown" size="sm" />}
          variant="ghost"
          size="sm"
        />
        <IconButton
          label={t('page.__PAGE__.tool.find')}
          icon={<Icon icon="search" size="sm" />}
          variant="ghost"
          size="sm"
        />
        <IconButton
          label={t('page.__PAGE__.tool.layers')}
          icon={<Icon icon="viewColumns" size="sm" />}
          variant="ghost"
          size="sm"
        />
        <IconButton
          label={t('page.__PAGE__.tool.adjust')}
          icon={<Icon icon="wrench" size="sm" />}
          variant="ghost"
          size="sm"
        />
        <MoreMenu
          label={t('page.__PAGE__.tool.more')}
          size="sm"
          presentation="adaptive"
          items={[
            {
              id: 'duplicate',
              label: t('page.__PAGE__.action.duplicate'),
              icon: <Icon icon="copy" size="sm" />,
            },
            {
              id: 'delete',
              label: t('page.__PAGE__.action.delete'),
              variant: 'destructive',
              icon: <Icon icon="close" size="sm" />,
            },
          ]}
        />
      </Stack>

      <DropdownMenu
        xstyle={styles.menu}
        hasChevron={false}
        button={{
          label: t('page.__PAGE__.menu'),
          icon: <Icon icon="menu" size="sm" />,
          variant: 'secondary',
          size: 'sm',
        }}
        items={[
          {
            id: 'rename',
            label: t('page.__PAGE__.action.rename'),
          },
          {
            id: 'export',
            label: t('page.__PAGE__.action.export'),
          },
        ]}
      />

      <Stack direction="horizontal" gap={1} xstyle={styles.bottomNav}>
        <IconButton
          label={t('page.__PAGE__.nav.back')}
          icon={<Icon icon="chevronLeft" size="sm" />}
          variant="ghost"
          size="sm"
        />
        <IconButton
          label={t('page.__PAGE__.nav.history')}
          icon={<Icon icon="clock" size="sm" />}
          variant="ghost"
          size="sm"
        />
        <IconButton
          label={t('page.__PAGE__.nav.done')}
          icon={<Icon icon="check" size="sm" />}
          variant="primary"
          size="sm"
        />
      </Stack>
    </Stack>
  )
}

/*
astryx-messages
{
  "en": {
    "page.__PAGE__.slot.label": "Editor content",
    "page.__PAGE__.slot.title": "Editor canvas",
    "page.__PAGE__.slot.description": "Put the domain editor in this slot.",
    "page.__PAGE__.tool.select": "Select",
    "page.__PAGE__.tool.move": "Move",
    "page.__PAGE__.tool.find": "Find",
    "page.__PAGE__.tool.layers": "Layers",
    "page.__PAGE__.tool.adjust": "Adjust",
    "page.__PAGE__.tool.more": "More tools",
    "page.__PAGE__.menu": "Editor menu",
    "page.__PAGE__.action.duplicate": "Duplicate",
    "page.__PAGE__.action.delete": "Delete",
    "page.__PAGE__.action.rename": "Rename",
    "page.__PAGE__.action.export": "Export",
    "page.__PAGE__.nav.back": "Back",
    "page.__PAGE__.nav.history": "History",
    "page.__PAGE__.nav.done": "Done"
  },
  "zh-CN": {
    "page.__PAGE__.slot.label": "编辑器内容",
    "page.__PAGE__.slot.title": "编辑器画布",
    "page.__PAGE__.slot.description": "在此插槽中放入领域编辑器。",
    "page.__PAGE__.tool.select": "选择",
    "page.__PAGE__.tool.move": "移动",
    "page.__PAGE__.tool.find": "查找",
    "page.__PAGE__.tool.layers": "图层",
    "page.__PAGE__.tool.adjust": "调整",
    "page.__PAGE__.tool.more": "更多工具",
    "page.__PAGE__.menu": "编辑器菜单",
    "page.__PAGE__.action.duplicate": "复制",
    "page.__PAGE__.action.delete": "删除",
    "page.__PAGE__.action.rename": "重命名",
    "page.__PAGE__.action.export": "导出",
    "page.__PAGE__.nav.back": "返回",
    "page.__PAGE__.nav.history": "历史",
    "page.__PAGE__.nav.done": "完成"
  }
}
*/
