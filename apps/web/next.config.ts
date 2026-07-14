import type { NextConfig } from 'next';
import { createRequire } from 'module';
import path from 'path';
import { withSentryConfig } from '@sentry/nextjs';
const require = createRequire(import.meta.url);

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
    config.resolve.alias['@/features'] = path.resolve(__dirname, 'src/features');
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

export default withSentryConfig(withPWA(nextConfig), {
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
