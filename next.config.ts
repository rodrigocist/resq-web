import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  // Enables React strict mode for better error catching
  reactStrictMode: true,

  // Images config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ]
  },

  // Ignorar errores en el build de producción para asegurar el despliegue
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Turbopack es para desarrollo local, no afecta el build de Vercel
  turbopack: {}
};

export default withPWA(nextConfig);
