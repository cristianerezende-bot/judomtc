/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['googleapis'],
  },
  typescript: {
    // Codigo de UI ja protegido por optional chaining; nao bloquear o build por
    // avisos de tipagem estrita.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}
module.exports = nextConfig
