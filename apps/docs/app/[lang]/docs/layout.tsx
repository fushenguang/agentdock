import { source } from '@/lib/source'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { baseOptions } from '@/lib/layout.shared'
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search'
import { MessageCircleIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'

interface LayoutParams {
  lang: string
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<LayoutParams>
}) {
  const { lang } = await params

  return (
    <DocsLayout tree={source.getPageTree(lang)} i18n {...baseOptions()}>
      <AISearch>
        <AISearchPanel />
        <AISearchTrigger
          position="float"
          className={cn(
            buttonVariants({
              variant: 'secondary',
              className: 'text-fd-muted-foreground rounded-2xl',
            }),
          )}
        >
          <MessageCircleIcon className="size-4.5" />
          Ask AI
        </AISearchTrigger>
      </AISearch>

      {children}
    </DocsLayout>
  )
}
