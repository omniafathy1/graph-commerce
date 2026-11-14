import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   cacheComponents: true,
   serverExternalPackages: ["pino"],
};

export default nextConfig;
