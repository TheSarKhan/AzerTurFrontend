import assert from 'node:assert/strict';
const origin=process.env.FRONTEND_ORIGIN||'http://127.0.0.1:3000';
let cookie='';
async function call(path,body,extra={}){const response=await fetch(origin+'/api/customer/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});return {response,data:response.status===204?null:await response.json()}}
let oversized=await call('auth/register',{password:'x'.repeat(20000)});assert.equal(oversized.response.status,413);
let result=await call('bookings');assert.equal(result.response.status,401);
result=await call('auth/register',{email:'bff-'+crypto.randomUUID()+'@example.com',password:'Test-only-strong-password-2026',name:'Web Integration Test',locale:'az'});
assert.equal(result.response.status,201);assert.ok(result.data.customer.id);assert.equal(result.data.token,undefined);
const setCookie=result.response.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/SameSite=lax/i);cookie=setCookie.split(';')[0];
result=await call('auth/me');assert.equal(result.response.status,200);assert.equal(result.data.locale,'az');
result=await call('auth/logout',{}, {Origin:'https://untrusted.example'});assert.equal(result.response.status,403);
result=await call('auth/logout',{});assert.equal(result.response.status,204);
result=await call('auth/me');assert.equal(result.response.status,401);
console.log('Customer BFF checks passed: HttpOnly session, token redaction, origin protection, authenticated access and logout.');
