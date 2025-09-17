import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '13.203.1.159',
        port: '1310',
        pathname: '/data-files/**',
      },
    ],
  },
};

export default nextConfig;
