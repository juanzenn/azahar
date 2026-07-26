import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static export: every page prerenders from the seed catalog at build
  // time and there is no runtime server. Cart, search and checkout are
  // client-side. The output is deployable to any static host.
  output: "export",
  images: {
    // Static export means there is no server to resize images, so next/image
    // serves the committed files as-is. We keep next/image for layout
    // stability and lazy loading.
    unoptimized: true,
  },
};

export default nextConfig;
