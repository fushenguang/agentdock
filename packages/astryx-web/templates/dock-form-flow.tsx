import { Button } from '@astryxdesign/core/Button'
import { FormLayout } from '@astryxdesign/core/FormLayout'
import { Heading } from '@astryxdesign/core/Heading'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { TextArea } from '@astryxdesign/core/TextArea'
import { TextInput } from '@astryxdesign/core/TextInput'
import { useTranslator } from '@astryxdesign/core/i18n'
import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { PageShell } from '@/components/layout'
import { useCurrentLocale } from '@/i18n'

const styles = stylex.create({
  fields: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '0.75rem',
    '@container (min-width: 640px)': {
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      gap: '0.75rem 1rem',
    },
  },
  actions: {
    position: 'sticky',
    bottom: 0,
    marginBlockStart: 'auto',
    paddingBlock: '0.75rem',
    paddingBlockEnd: 'max(0.75rem, env(safe-area-inset-bottom))',
    backgroundColor: 'var(--color-background-surface)',
    '@container (min-width: 640px)': {
      position: 'static',
      justifyContent: 'flex-end',
      marginBlockStart: 0,
      paddingBlock: 0,
    },
  },
})

type Step = 0 | 1

export default function DockFormFlow() {
  const locale = useCurrentLocale()
  const t = useTranslator()
  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)

  function goNext() {
    if (!name.trim()) {
      setError(t('page.__PAGE__.error.name'))
      return
    }
    setError(null)
    setStep(1)
  }

  return (
    <PageShell
      title={t('page.__PAGE__.title')}
      backHref={`/${locale}`}
      backLabel={t('page.__PAGE__.back')}
    >
      <Stack gap={4} minHeight="100%">
        <Text type="supporting" color="secondary">
          {t('page.__PAGE__.step', { current: step + 1, total: 2 })}
        </Text>
        <Stack gap={1}>
          <Heading level={2}>
            {step === 0 ? t('page.__PAGE__.step.details') : t('page.__PAGE__.step.review')}
          </Heading>
          <Text type="supporting" color="secondary">
            {step === 0
              ? t('page.__PAGE__.step.details.description')
              : t('page.__PAGE__.step.review.description')}
          </Text>
        </Stack>

        {step === 0 ? (
          <Stack gap={4}>
            <FormLayout direction="horizontal-labels" xstyle={styles.fields}>
              <TextInput
                label={t('page.__PAGE__.field.name')}
                value={name}
                onChange={(value) => {
                  setName(value)
                  if (error) setError(null)
                }}
                placeholder={t('page.__PAGE__.field.name.placeholder')}
                isRequired
                status={error ? { type: 'error', message: error } : undefined}
              />
            </FormLayout>
            <TextArea
              label={t('page.__PAGE__.field.details')}
              value={details}
              onChange={setDetails}
              placeholder={t('page.__PAGE__.field.details.placeholder')}
            />
          </Stack>
        ) : (
          <Stack gap={2}>
            <Text type="body">{name}</Text>
            <Text type="supporting" color="secondary">
              {details || t('page.__PAGE__.review.noDetails')}
            </Text>
          </Stack>
        )}

        <Stack direction="horizontal" hAlign="between" gap={2} width="100%" xstyle={styles.actions}>
          <Button
            label={t('page.__PAGE__.backStep')}
            variant="secondary"
            isDisabled={step === 0}
            onClick={() => setStep(0)}
          />
          <Button
            label={step === 0 ? t('page.__PAGE__.next') : t('page.__PAGE__.create')}
            variant="primary"
            onClick={step === 0 ? goNext : () => undefined}
          />
        </Stack>
      </Stack>
    </PageShell>
  )
}

/*
astryx-messages
{
  "en": {
    "page.__PAGE__.title": "Create item",
    "page.__PAGE__.back": "Back",
    "page.__PAGE__.step": "Step {current} of {total}",
    "page.__PAGE__.step.details": "Details",
    "page.__PAGE__.step.review": "Review",
    "page.__PAGE__.step.details.description": "Add the information needed for this item.",
    "page.__PAGE__.step.review.description": "Check the information before creating the item.",
    "page.__PAGE__.field.name": "Name",
    "page.__PAGE__.field.name.placeholder": "Name this item",
    "page.__PAGE__.field.details": "Details",
    "page.__PAGE__.field.details.placeholder": "Add anything the next person should know",
    "page.__PAGE__.error.name": "Enter a name to continue.",
    "page.__PAGE__.review.noDetails": "No details added.",
    "page.__PAGE__.backStep": "Back",
    "page.__PAGE__.next": "Next",
    "page.__PAGE__.create": "Create"
  },
  "zh-CN": {
    "page.__PAGE__.title": "创建事项",
    "page.__PAGE__.back": "返回",
    "page.__PAGE__.step": "第 {current} 步，共 {total} 步",
    "page.__PAGE__.step.details": "详细信息",
    "page.__PAGE__.step.review": "检查",
    "page.__PAGE__.step.details.description": "添加此事项所需的信息。",
    "page.__PAGE__.step.review.description": "创建前检查这些信息。",
    "page.__PAGE__.field.name": "名称",
    "page.__PAGE__.field.name.placeholder": "为此事项命名",
    "page.__PAGE__.field.details": "详细信息",
    "page.__PAGE__.field.details.placeholder": "添加下一位处理者需要了解的内容",
    "page.__PAGE__.error.name": "请输入名称后继续。",
    "page.__PAGE__.review.noDetails": "尚未添加详细信息。",
    "page.__PAGE__.backStep": "上一步",
    "page.__PAGE__.next": "下一步",
    "page.__PAGE__.create": "创建"
  }
}
*/
