import { source } from '@/lib/source'

export const revalidate = false

export async function GET() {
  const pages = source.getPages()
  const texts = await Promise.all(
    pages.map(async (page) => `# ${page.data.title} (${page.url})\n\n${page.data.description ?? ''}`)
  )
  return new Response(texts.join('\n\n'))
}
