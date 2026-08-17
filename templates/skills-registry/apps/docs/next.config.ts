import { createMDX } from 'fumadocs-mdx/next'
import type { NextConfig } from 'next'
import path from 'node:path'

const withMDX = createMDX()

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(process.cwd(), '../..'),
  },
}

export default withMDX(config)
