import type { NextConfig } from 'next';
import { createRequire } from 'module';
import path from 'path';
import { config as loadEnv } from 'dotenv';
import { withSentryConfig } from '@sentry/nextjs';
const require = createRequire(import.meta.url);

loadEnv({ path: path.resolve(__dirname, '../../.env.local') });
loadEnv({ path: path.resolve(__dirname, '../../.env') });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@herafino/shared', '@herafino/types', '@herafino/contracts'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(self), microphone=()',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
config.resolve.alias['@herafino/types'] = path.resolve(
        __dirname,
        '../../packages/types/src'
      );
      config.resolve.alias['@herafino/contracts'] = path.resolve(
        __dirname,
        '../../packages/contracts/src'
      );
      config.resolve.alias['@herafino/shared'] = path.resolve(
        __dirname,
        '../../packages/shared/src'
      );
      return config;
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  tunnelRoute: '/_next',
  webpack: {
    autoInstrumentAppDirectory: true,
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
