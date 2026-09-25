import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@assetra/sdk"],
  reactStrictMode: true,
};

export default nextConfig;
