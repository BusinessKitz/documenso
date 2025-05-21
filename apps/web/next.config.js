/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { version } = require('./package.json');
const { withAxiom } = require('next-axiom');
const { withSentryConfig } = require('@sentry/nextjs');

const ENV_FILES = ['.env', '.env.local', `.env.${process.env.NODE_ENV || 'development'}`];

//
ENV_FILES.forEach((file) => {
  require('dotenv').config({
    path: path.join(__dirname, `../../${file}`),
  });
});

// Temp hack to get caveat working without placing it in the public directory
const FONT_CAVEAT_BYTES = fs.readFileSync(
  path.join(__dirname, '../../packages/assets/fonts/caveat.ttf'),
);

const FONT_NOTO_SANS_BYTES = fs.readFileSync(
  path.join(__dirname, '../../packages/assets/fonts/noto-sans.ttf'),
);

const allowedOrigins = [
  'https://app.businesskitz.com',
  'https://uat-app.businesskitz.com',
  'https://business-kitz.com',
];

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
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins.join(', '), // Use the CORS_DOMAIN from the environment variable
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true', // Allow credentials (cookies, etc.)
          },
        ],
      },
    ];
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

module.exports = withAxiom(
  withSentryConfig(config, {
    org: 'business-kitz-pty-ltd',
    project: 'kitzdocumenso',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }),
);
