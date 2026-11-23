import type { NextConfig } from "next";
import { buildCsp } from "./src/lib/csp";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: buildCsp({ isDev, enforce: true }) },
];
const nextConfig: NextConfig = {
   cacheComponents: true,
   serverExternalPackages: ["pino"],
   partialPrefetching: true,

   deprecated: {
    looseRouteMatching: true,
  },
  
   async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
