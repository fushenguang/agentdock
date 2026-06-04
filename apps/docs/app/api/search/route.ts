import { source } from '@/lib/source'
import { createFromSource } from 'fumadocs-core/search/server'

// force-static: makes this route compatible with `output: 'export'` (GitHub Pages).
// In static export the route is not served; in dev/server deployments Next.js
// still handles GET requests normally.
export const dynamic = 'force-static'

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
})
