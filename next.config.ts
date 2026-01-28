import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['sharp', 'canvas'],
  // Enable compression for production
  compress: true,
  // Configure output for deployment
  output: undefined,
  // Timeout for API routes
};

export default nextConfig;
