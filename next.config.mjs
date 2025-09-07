/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false
  }
}

export default nextConfig

