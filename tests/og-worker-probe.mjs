// Pair with fixtures/og-route.ts in a disposable local build only.
import assert from 'node:assert/strict';
const url=new URL(process.argv[2]||'http://127.0.0.1:5192/qa-og-regression');
assert.equal(url.protocol,'http:');assert.equal(url.hostname,'127.0.0.1');assert.equal(url.pathname,'/qa-og-regression');assert.equal(url.username+url.password+url.search+url.hash,'');
const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/png/);
const b=Buffer.from(await r.arrayBuffer());assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(b.readUInt32BE(16),320);assert.equal(b.readUInt32BE(20),120);
console.log(JSON.stringify({runtime:'local Workers synthetic image route',status:r.status,bytes:b.length,width:320,height:120}));
