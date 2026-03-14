import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "**.r2.dev",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "bear-public.tos-cn-shanghai.volces.com",
    pathname: "/**",
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { remotePatterns },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
