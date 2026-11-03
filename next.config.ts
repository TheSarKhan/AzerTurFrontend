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
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? { output: "standalone" as const }
    : {}),
};
export default config;
