import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding', 'porto')
    // Suppress warnings from phosphor-icons
    config.ignoreWarnings = [
      { module: /node_modules\/@phosphor-icons/ },
      { module: /node_modules\/lit-html/ },
    ]
    return config
  }
};

export default nextConfig;
