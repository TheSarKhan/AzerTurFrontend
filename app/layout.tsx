import type { Metadata } from "next";
import "./globals.css";
import "./homepage.css";
import "./tours.css";
import "./planner.css";
import "./cabinet.css";
export const metadata: Metadata = {
  title: "Azertur — Take the scenic route",
  description:
    "Explore Azerbaijan at your own pace. Private trips, local experiences and a transparent trip planner. Interactive design preview.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
