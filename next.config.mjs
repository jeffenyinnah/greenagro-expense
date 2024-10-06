/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '3000',
          pathname: '/uploads/**',
        },
      ],
    },
    experimental: {
      serverComponentsExternalPackages: ['xlsx'],
    },
    webpack: (config) => {
      config.externals = [...config.externals, { canvas: 'canvas' }];
      return config;
    },
  }

export default nextConfig;