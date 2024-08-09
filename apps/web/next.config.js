/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { version } = require('./package.json');
const { withAxiom } = require('next-axiom');

const ENV_FILES = ['.env', '.env.local', `.env.${process.env.NODE_ENV || 'development'}`];

ENV_FILES.forEach((file) => {
  require('dotenv').config({
    path: path.join(__dirname, `../../${file}`),
  });
});

// !: This is a temp hack to get caveat working without placing it back in the public directory.
// !: By inlining this at build time we should be able to sign faster.
const FONT_CAVEAT_BYTES = fs.readFileSync(
  path.join(__dirname, '../../packages/assets/fonts/caveat.ttf'),
);

const FONT_NOTO_SANS_BYTES = fs.readFileSync(
  path.join(__dirname, '../../packages/assets/fonts/noto-sans.ttf'),
);

/** @type {import('next').NextConfig} */
const config = {
  output: process.env.DOCKER_OUTPUT ? 'standalone' : undefined,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    serverComponentsExternalPackages: ['@node-rs/bcrypt', '@documenso/pdf-sign', 'playwright'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  reactStrictMode: true,
  transpilePackages: [
    '@documenso/assets',
    '@documenso/ee',
    '@documenso/lib',
    '@documenso/prisma',
    '@documenso/tailwind-config',
    '@documenso/trpc',
    '@documenso/ui',
  ],
  env: {
    APP_VERSION: version,
    NEXT_PUBLIC_PROJECT: 'web',
    FONT_CAVEAT_URI: `data:font/ttf;base64,${FONT_CAVEAT_BYTES.toString('base64')}`,
    FONT_NOTO_SANS_URI: `data:font/ttf;base64,${FONT_NOTO_SANS_BYTES.toString('base64')}`,
  },
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
  webpack: (config, { isServer }) => {
    // fixes: Module not found: Can’t resolve ‘../build/Release/canvas.node’
    if (isServer) {
      config.resolve.alias.canvas = false;
    }

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/ingest/:path*',
        destination: 'https://eu.posthog.com/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        permanent: true,
        source: '/documents/:id/sign',
        destination: '/sign/:token',
        has: [
          {
            type: 'query',
            key: 'token',
          },
        ],
      },
      {
        permanent: true,
        source: '/documents/:id/signed',
        destination: '/sign/:token',
        has: [
          {
            type: 'query',
            key: 'token',
          },
        ],
      },
    ];
  },
};

module.exports = withAxiom(config);

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'business-kitz-pty-ltd',
  project: 'kitzdocumenso',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
