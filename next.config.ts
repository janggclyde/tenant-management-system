import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sequelize"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**", // This allows any path under the hostname
      },
    ],
  },
  output: "standalone",
  transpilePackages: ["motion"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new (require("copy-webpack-plugin"))({
          patterns: [
            {
              from: path.join(__dirname, "node_modules/pdfkit/js/data"),
              to: path.join(__dirname, ".next/server/vendor-chunks/data"),
            },
          ],
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
