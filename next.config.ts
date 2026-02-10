import type { NextConfig } from "next";

function buildRemotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "**.r2.dev",
      pathname: "/**",
    },
  ];

  const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!assetBase) {
    return patterns;
  }

  try {
    const url = new URL(assetBase);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return patterns;
    }

    const protocol = url.protocol === "http:" ? "http" : "https";
    const pathPrefix = url.pathname.replace(/\/$/, "");
    const wildcardPath = `${pathPrefix || ""}/**`;

    patterns.unshift({
      protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: wildcardPath,
    });

    return patterns;
  } catch {
    return patterns;
  }
}

const remotePatterns = buildRemotePatterns();

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
