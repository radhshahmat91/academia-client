import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["mongodb", "nodemailer"],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts", "react-icons"],
  },
};

export default config;
