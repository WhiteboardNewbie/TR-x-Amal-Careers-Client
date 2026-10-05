import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ckeditor/ckeditor5-react",
    "@ckeditor/ckeditor5-build-classic",
  ],
};

export default nextConfig;
