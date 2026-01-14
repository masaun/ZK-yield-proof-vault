import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding', 'porto', 'porto/internal')
    // Suppress warnings from phosphor-icons and wagmi optional dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/@phosphor-icons/ },
      { module: /node_modules\/lit-html/ },
      { module: /node_modules\/@wagmi\/connectors\/dist\/esm\/porto/ },
    ]
    return config
  }
};

export default nextConfig;
