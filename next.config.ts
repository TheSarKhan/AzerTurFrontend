import type { NextConfig } from "next";
const config: NextConfig = {
  async headers() {
    return [
      {
        source: "/:locale/account/:action",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  // The homepage photos were converted from PNG to WebP. Keep old .png URLs working.
  async rewrites() {
    return [
      {
        source: "/images/homepage-v3/:name.png",
        destination: "/images/homepage-v3/:name.webp",
      },
    ];
  },
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? { output: "standalone" as const }
    : {}),
};
export default config;
