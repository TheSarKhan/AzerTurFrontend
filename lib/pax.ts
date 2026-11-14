import type { Locale } from "./travel";

/**
 * Group sizes the site offers: 1, 2, 3, 4, 5–10, 10–20, 20–50, 50–100 and 100+.
 * A band is stored as one number so links, quotes and requests stay numeric:
 * 1–4 are exact, the others use the top of the band (101 means 100+).
 */
export const PAX_OPTIONS = [1, 2, 3, 4, 10, 20, 50, 100, 101] as const;

/** Snaps any number (for example from an old link with ?pax=7) to the band that contains it. */
export function snapPax(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  n = Math.trunc(n);
  if (n <= 4) return n;
  return PAX_OPTIONS.find((o) => n <= o) ?? 101;
}

/** "1", "2", "3", "4", "5–10", "10–20", "20–50", "50–100" or "100+". */
export function paxRange(pax: number) {
  const n = snapPax(pax);
  if (n <= 4) return String(n);
  if (n === 10) return "5–10";
  if (n === 20) return "10–20";
  if (n === 50) return "20–50";
  if (n === 100) return "50–100";
  return "100+";
}

/** "1 səyahətçi", "5–10 səyahətçi", "2 travellers", "5–10 путешественников". */
export function travellerCount(pax: number, locale: Locale) {
  const n = snapPax(pax),
    range = paxRange(n);
  if (locale === "az") return `${range} səyahətçi`;
  if (locale === "ru")
    return `${range} ${n === 1 ? "путешественник" : n <= 4 ? "путешественника" : "путешественников"}`;
  return `${range} ${n === 1 ? "traveller" : "travellers"}`;
}
