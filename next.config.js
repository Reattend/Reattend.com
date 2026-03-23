/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      'fastembed',
      'onnxruntime-node',
      '@anush008/tokenizers',
    ],
  },
}

module.exports = nextConfig
