import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/planner-pricing.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports },
);
const { convertedServiceTotal: total } = exports;
assert.equal(total([180, 110, 130, 35, 40], 1), 495);
// Server rounds the lines to 168 + 122 + 65 + 37; converting the sum gives the wrong 393.
assert.equal(total([90, 65, 35, 20], 1.87), 392);
assert.equal(total([90, 65, 35, 20], 1.1), 232);
assert.equal(total([], 1.87), 0);
assert.equal(total([180, 130, 35, 40], 1), 385);
console.log(
  "Planner pricing passed: server-compatible currency rounding, empty selection and removed services.",
);
