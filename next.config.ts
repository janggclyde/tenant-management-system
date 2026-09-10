import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sequelize", "mysql2", "pdfkit"],
  experimental: {
    // optimizePackageImports: ["lucide-react", "recharts"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Trace AFM font files for serverless production environments
  outputFileTracingIncludes: {
    "/api/**/*": ["./assets/data/**/*", "./node_modules/pdfkit/js/data/**/*"],
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  transpilePackages: ["motion"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new (require("copy-webpack-plugin"))({
          patterns: [
            {
              from: path.join(__dirname, "node_modules/pdfkit/js/data"),
              to: path.join(__dirname, ".next/server/chunks/data"),
            },
          ],
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
