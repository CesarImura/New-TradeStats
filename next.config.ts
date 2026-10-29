import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  // The lab's benches moved into the library (Tools); old links land on the right one.
  async redirects() {
    return [
      { source: "/lab/widgets", destination: "/lab#tools/wall", permanent: false },
      { source: "/lab/anatomy", destination: "/lab#tools/anatomy", permanent: false },
      { source: "/lab/proof", destination: "/lab#tools/proof", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
