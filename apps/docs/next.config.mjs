import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const isStaticExport = process.env.NEXT_STATIC_EXPORT === '1'
const basePath = process.env.NEXT_BASE_PATH ?? ''

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  ...(isStaticExport && {
    output: 'export',
    basePath,
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  }),
};

export default withMDX(config);
