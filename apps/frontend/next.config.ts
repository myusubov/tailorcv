import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['shared'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
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
  },
};

export default nextConfig;
