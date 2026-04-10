import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdf-parse", "mammoth", "officeparser"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "aitoolsstation.com" }],
        destination: "https://www.aitoolsstation.com/:path*",
        permanent: true,
      },
      {
        source: "/flashcard-generator-alternatives",
        destination: "/toolkits/exam",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Embed 页面允许任何域名通过 iframe 嵌入
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
