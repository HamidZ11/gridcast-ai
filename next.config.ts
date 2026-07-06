import type { NextConfig } from "next";

const buildTimestamp = new Date().toISOString();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  env: {
    GRIDCAST_BUILD_TIMESTAMP: buildTimestamp,
  },
};

export default nextConfig;
