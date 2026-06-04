import { source } from '@/lib/source'
import { createFromSource } from 'fumadocs-core/search/server'

// In static export mode (GitHub Pages), server-side search is not available.
// `force-static` prevents a build-time error; the route is not served in the
// exported output. Client-side docs are still fully readable.
export const dynamic =
  process.env.NEXT_STATIC_EXPORT === '1' ? 'force-static' : ('auto' as const)

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
})
