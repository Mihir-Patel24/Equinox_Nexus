/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // NOTE: output: 'standalone' is only enabled during Docker builds.
  // It is NOT set here to keep the local dev server working correctly.
  // The Dockerfile.frontend sets NEXT_OUTPUT=standalone at build time.
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' } : {}),
}

module.exports = nextConfig