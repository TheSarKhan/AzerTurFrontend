import type { Tour } from "./travel";

export const regions = ["baku", "sheki", "gabala", "mountains"] as const;
export const durations = [
  "day",
  "weekend",
  "extended",
  "long",
  "short",
] as const;
export const activities = ["easy", "moderate"] as const;
export const categories = [
  "history",
  "culture",
  "medical",
  "nature",
  "entertainment",
  "business",
] as const;
export const sorts = [
  "recommended",
  "price-low",
  "price-high",
  "duration",
] as const;
export type Discovery = {
  regions: string[];
  durations: string[];
  activities: string[];
  category: string;
  maxPrice: number;
  sort: string;
  date: string;
  pax: number;
};
export const defaultDiscovery = (): Discovery => ({
  regions: [],
  durations: [],
  activities: [],
  category: "all",
  maxPrice: 500,
  sort: "recommended",
  date: "",
  pax: 2,
});
export function validTravelDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function readDiscovery(search: string): Discovery {
  const p = new URLSearchParams(search);
  const list = (key: string, allowed: readonly string[]) => [
    ...new Set(
      (p.get(key) || "").split(",").filter((v) => allowed.includes(v)),
    ),
  ];
  const maxPrice = Number(p.get("maxPrice"));
  const pax = Number(p.get("pax"));
  return {
    regions: list("region", regions),
    durations: list("duration", durations),
    activities: list("activity", activities),
    category: categories.includes(
      p.get("category") as (typeof categories)[number],
    )
      ? p.get("category")!
      : "all",
    maxPrice:
      p.has("maxPrice") && Number.isFinite(maxPrice)
        ? Math.max(0, Math.min(500, maxPrice))
        : 500,
    sort: sorts.includes(p.get("sort") as (typeof sorts)[number])
      ? p.get("sort")!
      : "recommended",
    date: validTravelDate(p.get("date") || "") ? p.get("date")! : "",
    pax:
      Number.isFinite(pax) && pax > 0
        ? Math.min(12, Math.max(1, Math.trunc(pax)))
        : 2,
  };
}
export function discoverySearch(f: Discovery) {
  const p = new URLSearchParams();
  if (f.regions.length) p.set("region", f.regions.join(","));
  if (f.durations.length) p.set("duration", f.durations.join(","));
  if (f.activities.length) p.set("activity", f.activities.join(","));
  if (f.category !== "all") p.set("category", f.category);
  if (f.maxPrice !== 500) p.set("maxPrice", String(f.maxPrice));
  if (f.sort !== "recommended") p.set("sort", f.sort);
  if (f.date) p.set("date", f.date);
  if (f.pax !== 2) p.set("pax", String(f.pax));
  return p.size ? "?" + p : "";
}
export function bookingSearch(date: string, pax: number, template?: string) {
  const p = new URLSearchParams();
  if (template) p.set("template", template);
  if (validTravelDate(date)) p.set("date", date);
  p.set("pax", String(Math.min(12, Math.max(1, Math.trunc(pax) || 2))));
  return "?" + p;
}
export function discoverTours(inventory: Tour[], f: Discovery) {
  const matches = inventory.filter((t) => {
    const category =
      f.category === "all" ||
      (["history", "culture"].includes(f.category) &&
        ["baku", "sheki"].includes(t.image)) ||
      (f.category === "nature" && ["mountains", "sheki"].includes(t.image)) ||
      (f.category === "entertainment" && t.image === "baku");
    return (
      category &&
      t.base <= f.maxPrice &&
      (!f.regions.length ||
        f.regions.some(
          (r) => r === t.image || (r === "gabala" && t.image === "sheki"),
        )) &&
      (!f.durations.length ||
        f.durations.some((d) =>
          d === "day"
            ? t.days === 1
            : d === "weekend"
              ? t.days >= 2 && t.days <= 3
              : d === "short"
                ? t.days <= 2
                : d === "long"
                  ? t.days >= 3
                  : t.days >= 4,
        )) &&
      (!f.activities.length ||
        f.activities.includes(t.image === "mountains" ? "moderate" : "easy"))
    );
  });
  return matches.sort((a, b) =>
    f.sort === "price-low"
      ? a.base - b.base
      : f.sort === "price-high"
        ? b.base - a.base
        : f.sort === "duration"
          ? a.days - b.days
          : 0,
  );
}
