import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep `/backend/.../` for the Route Handler proxy (Django APPEND_SLASH).
  skipTrailingSlashRedirect: true,
  transpilePackages: [
    "@ckeditor/ckeditor5-react",
    "@ckeditor/ckeditor5-build-classic",
  ],
};

export default nextConfig;
