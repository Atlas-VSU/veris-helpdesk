import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ticket attachments are limited to 10 MB; leave room for multipart encoding.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
