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
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      exports,
      require: (name) => load(path.resolve(path.dirname(file), name + ".ts")),
    },
  );
  return exports;
}
const {
  tripEnd,
  cabinetDates,
  filterTrips,
  paymentAvailable,
  cabinetTitle,
  cabinetRoute,
  bookingQuote,
} = load("lib/customer-cabinet.ts");
const make = (patch = {}) => ({
  id: "own-request",
  departure: "2027-05-15",
  status: "PENDING_REVIEW",
  total: 495,
  paid: 0,
  title: "Base tour",
  quotePayload: JSON.stringify({
    input: {
      slug: "quba-khinalug",
      customDays: 2,
      cities: ["Quba", "Khinalug"],
    },
    lines: [{ label: "transport", amount: 180 }],
  }),
  ...patch,
});
const trip = make();
assert.equal(tripEnd(trip), "2027-05-16");
assert.equal(filterTrips([trip], "upcoming", "2027-05-16").length, 1);
assert.equal(filterTrips([trip], "past", "2027-05-17").length, 1);
const cancelled = make({ status: "CANCELLED" });
assert.equal(
  filterTrips([trip, cancelled], "upcoming", "2027-05-01").length,
  1,
);
assert.equal(filterTrips([trip, cancelled], "past", "2027-05-01").length, 1);
assert.equal(cabinetTitle(trip, "az"), "Fərdi səfəriniz");
assert.equal(cabinetRoute(trip).join(","), "Quba,Khinalug");
assert.equal(bookingQuote(make({ quotePayload: "broken" })), null);
assert.equal(paymentAvailable(trip, []), false);
const approved = make({ status: "AWAITING_PAYMENT" });
assert.equal(paymentAvailable(approved, []), true);
assert.equal(
  paymentAvailable(approved, [{ bookingId: trip.id, status: "PENDING" }]),
  false,
);
assert.equal(
  paymentAvailable(approved, [{ bookingId: "other", status: "PENDING" }]),
  true,
);
assert.equal(
  paymentAvailable(make({ status: "CONFIRMED", paid: 495 }), []),
  false,
);
assert.equal(paymentAvailable(cancelled, []), false);
console.log(
  "Customer cabinet passed: trip end boundaries, cancelled filters, quote snapshots, custom titles and payment gates.",
);

assert.equal(cabinetDates(trip, "az"), "15–16 may 2027");
assert.equal(
  cabinetDates(make({ departure: "2026-12-31" }), "en"),
  "31 Dec 2026 – 1 Jan 2027",
);
