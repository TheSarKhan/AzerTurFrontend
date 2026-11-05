import type { Metadata } from "next";
import PitchDeck from "@/components/pitch-deck";
import "../pitch.css";

export const metadata: Metadata = {
  title: "AzTrip — Pitch",
  description: "AzTrip: a digital travel experience for Azerbaijan.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PitchDeck />;
}
