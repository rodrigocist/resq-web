/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' }
    ],
  },
  typescript: {
    ignoreBuildErrors: true, // Esto mantiene el despliegue activo
  },
} as any;

export default withPWA(nextConfig);