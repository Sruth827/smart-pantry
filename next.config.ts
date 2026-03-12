import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is crucial for Prisma + Next.js 15/16
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
