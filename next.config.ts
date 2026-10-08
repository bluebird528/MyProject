import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Use the compiler API to avoid child-process output capture in restricted environments.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
