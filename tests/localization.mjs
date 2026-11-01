import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const cache=new Map();function load(path){if(cache.has(path))return cache.get(path);const exports={};cache.set(path,exports);const source=fs.readFileSync(path,'utf8');const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(output,{exports,require:name=>load(new URL(name+'.ts',new URL('file://'+process.cwd()+'/'+path)).pathname.slice(process.cwd().length+1))});return exports}
const {tours,faqs,money}=load('lib/travel.ts');const {az}=load('lib/i18n.ts');
for(const tour of tours){assert.ok(tour.name[2]);assert.ok(tour.description[2]);assert.ok(tour.difficulty[2]);for(const day of tour.plans)assert.ok(day[2])}
for(const faq of faqs){assert.ok(faq[4]);assert.ok(faq[5]);assert.notEqual(faq[4],faq[2])}
const site=ts.createSourceFile('site.tsx',fs.readFileSync('components/travel-site.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const missing=[];function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(site)==='tr'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0])&&!az[n.arguments[0].text])missing.push(n.arguments[0].text);ts.forEachChild(n,visit)}visit(site);assert.deepEqual(missing,[]);
assert.equal(money(1234,'EUR','en'),'€1,234');assert.equal(money(1234,'EUR','az'),'1\u00a0234\u00a0€');assert.equal(money(1234,'AZN','ru'),'1\u00a0234\u00a0₼');
console.log('Localization checks passed: AZ UI coverage, tour/FAQ content and deterministic server/client money formatting.');
