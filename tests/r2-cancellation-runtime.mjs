// Provider-API capability rehearsal only, not an application fix. No live
// bindings or production access. Synthetic local workerd R2 objects only.
import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';
const require=createRequire(import.meta.url),{Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const options={modules:true,script:'export default {fetch(){return new Response("Synthetic R2 cancellation probe")}}',compatibilityDate:'2026-05-15',r2Buckets:['BUCKET'],outboundService:()=>new Response('Outbound denied',{status:403})};
const mf=new Miniflare(options);
try{
 let bucket=await mf.getR2Bucket('BUCKET');
 for(const size of [0,2]){const key='synthetic/'+crypto.randomUUID(),upload=await bucket.createMultipartUpload(key),part=await upload.uploadPart(1,new Uint8Array(size));await upload.complete([part]);assert.equal((await bucket.head(key)).size,size);try{await upload.abort();console.log('Completed abort: ok')}catch(e){console.log('Completed abort:',e.name,e.message)}await bucket.delete(key);}
 const key='synthetic/interrupted',upload=await bucket.createMultipartUpload(key),uploadId=upload.uploadId,part=await upload.uploadPart(1,Uint8Array.of(1,2));
 await mf.setOptions(options);bucket=await mf.getR2Bucket('BUCKET');
 await bucket.resumeMultipartUpload(key,uploadId).abort();
 await assert.rejects(()=>bucket.resumeMultipartUpload(key,uploadId).complete([part]));assert.equal(await bucket.head(key),null);
 const result={passed:true,scope:'Actual isolated local R2 API capability probe; application reconciliation still unimplemented',zeroByteMultipart:true,smallMultipart:true,durableUploadIdResumedAfterRuntimeRestart:true,abortPreventsLaterCompletion:true,externalRequests:false};
 fs.mkdirSync('docs/evidence',{recursive:true});fs.writeFileSync('docs/evidence/r2-cancellation-runtime.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await mf.dispose()}
