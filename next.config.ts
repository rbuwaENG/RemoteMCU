import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase"],
  transpilePackages: ["mqtt", "broker-factory"]
};

export default nextConfig;
