import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // hide the dev-mode "N" badge so it doesn't cover the footer
  devIndicators: false,
};

export default nextConfig;
