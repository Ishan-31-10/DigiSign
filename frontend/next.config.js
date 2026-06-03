/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // react-pdf ships an ES module that needs to be transpiled by Next.
  transpilePackages: ['react-pdf'],

  webpack: (config) => {
    // pdfjs-dist references `canvas` for Node which we don't need in the browser.
    config.resolve.alias.canvas = false;
    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
