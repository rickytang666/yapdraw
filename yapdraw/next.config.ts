import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // yapdraw is a nested app; parent repo has its own lockfile — set root explicitly
    root: process.cwd(),
  },
};

export default nextConfig;
