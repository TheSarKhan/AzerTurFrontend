import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import path from "node:path";
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    URLSearchParams,
    require: (name) => load(path.resolve(path.dirname(file), name + ".ts")),
  });
  return exports;
}
const { tours } = load("lib/travel.ts");
const {
  readDiscovery,
  defaultDiscovery,
  discoverySearch,
  discoverTours,
  bookingSearch,
} = load("lib/tour-discovery.ts");
const names = (filters) =>
  discoverTours(tours, { ...defaultDiscovery(), ...filters })
    .map((t) => t.slug)
    .join(",");
assert.equal(names({}), "quba-khinalug,sheki-gabala,baku-discovery");
assert.equal(names({ regions: ["gabala"] }), "sheki-gabala");
assert.equal(
  names({ regions: ["gabala", "baku"] }),
  "sheki-gabala,baku-discovery",
);
assert.equal(names({ category: "medical" }), "");
assert.equal(names({ category: "business" }), "");
assert.equal(
  names({ category: "nature", activities: ["easy"] }),
  "sheki-gabala",
);
assert.equal(names({ durations: ["weekend"], maxPrice: 250 }), "quba-khinalug");
assert.equal(names({ durations: ["extended"] }), "");
assert.equal(names({ durations: ["long"] }), "sheki-gabala"); // Existing shared links retain their 3+ day meaning.
assert.equal(names({ durations: ["short"] }), "quba-khinalug,baku-discovery");
assert.equal(
  names({ durations: ["day", "weekend"] }),
  "quba-khinalug,sheki-gabala,baku-discovery",
);
assert.equal(names({ maxPrice: 0 }), "");
assert.equal(
  names({ sort: "price-low" }),
  "baku-discovery,quba-khinalug,sheki-gabala",
);
assert.equal(
  names({ sort: "price-high" }),
  "sheki-gabala,quba-khinalug,baku-discovery",
);
assert.equal(
  names({ sort: "duration" }),
  "baku-discovery,quba-khinalug,sheki-gabala",
);
assert.equal(
  tours.map((t) => t.slug).join(","),
  "quba-khinalug,sheki-gabala,baku-discovery",
);
const f = readDiscovery(
  "?region=gabala,baku,baku,nonsense&duration=weekend&activity=easy&category=culture&maxPrice=415&sort=price-low&date=2026-12-15&pax=4",
);
assert.equal(f.regions.join(","), "gabala,baku");
assert.equal(
  JSON.stringify(readDiscovery(discoverySearch(f))),
  JSON.stringify(f),
);
const invalid = readDiscovery(
  "?pax=Infinity&date=2026-02-31&maxPrice=NaN&sort=evil&activity=dangerous&region=unknown",
);
assert.equal(invalid.pax, 2);
assert.equal(invalid.date, "");
assert.equal(invalid.maxPrice, 500);
assert.equal(invalid.sort, "recommended");
assert.equal(invalid.activities.length, 0);
assert.equal(invalid.regions.length, 0);
assert.equal(readDiscovery("?pax=99").pax, 12);
assert.equal(readDiscovery("?pax=-2").pax, 2);
assert.equal(readDiscovery("?pax=3.7").pax, 3);
const booking = new URLSearchParams(
  bookingSearch(f.date, f.pax, "quba-khinalug"),
);
assert.equal(booking.get("date"), "2026-12-15");
assert.equal(booking.get("pax"), "4");
assert.equal(booking.get("template"), "quba-khinalug");
assert.equal(booking.has("region"), false);
const { tourCopy, tourMedia, mediaAlt, beforeQuestions } = load(
  "lib/tour-content.ts",
);
function translated(v) {
  assert.equal(v.length, 3);
  assert.ok(v.every((s) => typeof s === "string" && s.trim().length));
}
Object.values(tourCopy).forEach(translated);
Object.values(mediaAlt).forEach(translated);
for (const tour of tours) {
  const media = tourMedia[tour.slug];
  assert.ok(media);
  translated(media.subtitle);
  assert.equal(media.itinerary.length, tour.days);
  media.itinerary.forEach(translated);
  assert.equal(new Set(media.gallery).size, media.gallery.length);
  for (const name of media.gallery)
    assert.ok(fs.existsSync("public/images/homepage-v3/" + name + ".png"));
}
for (const q of beforeQuestions) {
  translated(q.question);
  translated(q.answer);
}
assert.equal(tourMedia["sheki-gabala"].image, "sheki");
assert.equal(tourMedia["baku-discovery"].image, "baku");
console.log(
  "Tour discovery passed: intersecting filters, honest empty results, legacy links, sorting, URL validation, planner handoff and translated content/assets.",
);
