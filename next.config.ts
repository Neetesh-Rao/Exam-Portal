import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
