import assert from 'node:assert/strict';
import worker from './worker.mjs';
const env={TURNSTILE_SITEKEY:'real-site-key',TURNSTILE_SECRET_KEY:'private-value',TURNSTILE_HOSTNAME:'dzabrys.github.io',ALLOWED_ORIGIN:'https://dzabrys.github.io'};
const originalFetch=globalThis.fetch;
const req=(path='/api/captcha/verify',body={token:'valid',trap:''},origin='https://dzabrys.github.io')=>new Request('https://captcha.example'+path,{method:path.endsWith('config')?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':crypto.randomUUID()},...(path.endsWith('config')?{}:{body:JSON.stringify(body)})});
try {
 let response=await worker.fetch(req('/api/captcha/config'),env);assert.equal(response.status,200);let json=await response.json();assert.equal(json.testMode,false);assert(!JSON.stringify(json).includes(env.TURNSTILE_SECRET_KEY));
 response=await worker.fetch(req('/api/captcha/config',{},'https://attacker.example'),env);assert.equal(response.status,403);assert(!response.headers.has('Access-Control-Allow-Origin'));
 assert.equal((await worker.fetch(req('/api/captcha/verify',{token:''}),env)).status,400);
 assert.equal((await worker.fetch(req('/api/captcha/verify',{token:'x',trap:'bot'}),env)).status,400);
 globalThis.fetch=async()=>Response.json({success:true,hostname:'dzabrys.github.io',action:'contact'});
 response=await worker.fetch(req(),env);assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://dzabrys.github.io');
 globalThis.fetch=async()=>Response.json({success:true,hostname:'other.github.io',action:'contact'});assert.equal((await worker.fetch(req(),env)).status,403);
 globalThis.fetch=async()=>Response.json({success:true,hostname:'dzabrys.github.io',action:'login'});assert.equal((await worker.fetch(req(),env)).status,403);
 globalThis.fetch=async()=>{throw Error('offline')};assert.equal((await worker.fetch(req(),env)).status,502);
 assert.equal((await worker.fetch(req(),{})).status,503);
 console.log('PASS: Worker config, CORS, required token, honeypot, hostname/action checks and fail-closed network errors.');
} finally {globalThis.fetch=originalFetch;}
