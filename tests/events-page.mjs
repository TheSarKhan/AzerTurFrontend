import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
// Every user-facing string on the events pages must exist in all three languages.
const file = 'components/events-page.tsx';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let calls = 0; const bad = [];
(function visit(node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments.length === 3) {
    calls++;
    const parts = node.arguments.map((a) => (ts.isStringLiteralLike(a) ? a.text : null));
    if (parts.some((p) => p === null || !p.trim())) bad.push(node.getText().slice(0, 80));
    else if (parts[0] === parts[2] && /[a-z]{4,} [a-z]{3,}/i.test(parts[0])) bad.push('AZ equals EN: ' + parts[0].slice(0, 60));
    else if (parts[0] === parts[1] && /[a-z]{4,} [a-z]{3,}/i.test(parts[0])) bad.push('RU equals EN: ' + parts[0].slice(0, 60));
  }
  ts.forEachChild(node, visit);
})(source);
assert.ok(calls >= 30, `expected the events pages to be fully translated, found ${calls} strings`);
assert.deepEqual(bad, [], 'untranslated or empty strings');
// The proxy only forwards the documented query parameters and never logs coordinates.
const proxy = fs.readFileSync('lib/events-proxy.ts', 'utf8');
assert.match(proxy, /ALLOWED_EVENT_PARAMS = \["city", "category", "from", "to", "q", "lat", "lng", "radiusKm", "page", "size"\]/);
assert.doesNotMatch(proxy + fs.readFileSync('app/api/events/route.ts', 'utf8'), /console\./, 'no logging in the events proxy');
assert.match(proxy, /no-store/, 'proxy responses are not cacheable');
// Location is requested only on a click, and is rounded.
const page = fs.readFileSync(file, 'utf8');
assert.equal((page.match(/getCurrentPosition/g) || []).length, 1);
assert.match(page, /const nearMe = useCallback/);
assert.match(page, /round2\(pos\.coords\.latitude\)/);
console.log(`Events checks passed: ${calls} translated strings, proxy allow-list, no logging, on-click rounded location.`);
