import path from 'path';
import type { NextConfig } from 'next';

/**
 * Configures the frontend build, Turbopack workspace root, remote images, and the
 * current Windows-host LAN origin allowed to access the Next.js development server.
 */
const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['shared'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
    typedEnv: true,
    mcpServer: true,
  },
  typedRoutes: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '9nghnaawajmv9mqf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    qualities: [100, 75],
  },
  allowedDevOrigins: ['192.168.1.65'],
};

export default nextConfig;
