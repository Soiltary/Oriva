// Durable post-interruption state regression. Actual Worker replacement is
// covered separately in interrupted-storage-runtime.mjs. This seeds
// the durable post-interruption state; it does not claim a real process kill.
import {call,sql,context,files} from './accounts.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const account=await call('register','POST',{email:'interrupted-probe@example.test',password:'Synthetic-interrupted-probe!'});assert.equal(account.status,201);
const owner=account.data.user.id,key=owner+'/files/'+crypto.randomUUID();
const upload=await context.__env.BUCKET.createMultipartUpload(key),part=await upload.uploadPart(1,Uint8Array.of(1,2));
sql.prepare("INSERT INTO object_storage(key,user_id,bytes,state,updated,upload_id,operation_id,write_protocol) VALUES(?,?,?,'pending',0,?,?,'multipart-v1')").run(key,owner,25*1024*1024,upload.uploadId,crypto.randomUUID());
const response=await call('storage/cleanup','POST',{confirm:true,keys:[key]},account.cookie),usage=sql.prepare('SELECT object_bytes FROM storage_usage WHERE user_id=?').get(owner);
await assert.rejects(()=>upload.complete([part]));assert.equal(files.has(key),false);
const result={scope:'Synthetic durable post-interruption SQLite/R2-mock state, not an actual worker-kill test',recovered:usage.object_bytes===0,retainedBytes:usage.object_bytes,cleanupStatus:response.status,lateWriteSafetyMustRemainEnabled:true,stableGate:usage.object_bytes?'BLOCKED':'REQUIRES_ACTUAL_INTERRUPTION_VALIDATION'};
fs.mkdirSync('docs/evidence',{recursive:true});fs.writeFileSync('docs/evidence/interrupted-storage-probe.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
if(!result.recovered)process.exit(1);
