/** @type {import('next').NextConfig} */
const nextConfig = {
  // fully static build, served by Cloudflare Workers Static Assets (see wrangler.jsonc)
  output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
