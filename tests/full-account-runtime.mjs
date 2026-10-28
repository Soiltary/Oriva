// End-to-end maximum approved account allowance on fresh local D1/R2.
// Synthetic bytes only. Backup streams to a checked temporary directory,
// keeping host memory independent of total account size. No external fetches.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import readline from 'node:readline';import {Readable} from 'node:stream';import {pipeline} from 'node:stream/promises';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import ts from 'typescript';import assert from 'node:assert/strict';import {firstReleaseSchema} from '../scripts/first-release-schema.mjs';
const require=createRequire(import.meta.url),{Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const source=fs.readFileSync('app/api/[...path]/route.ts','utf8').replace("import { env } from 'cloudflare:workers';",'let env;').replace("export const dynamic='force-dynamic';",'').replace('export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;','');
const script=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText+'\nexport default {fetch(request,bindings){env=bindings;return handle(request)}}';
const options={modules:true,script,compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],outboundService:()=>new Response('Outbound denied',{status:403})};
const mf=new Miniflare(options),origin='https://oriva.test',temp=fs.mkdtempSync(path.join(os.tmpdir(),'oriva-full-account-')),backupPath=path.join(temp,'synthetic.oriva'),started=performance.now();
const send=async(route,method='GET',body,cookie='')=>{const r=await mf.dispatchFetch(origin+'/api/'+route,{method,headers:{origin,'content-type':'application/json',cookie},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
const streamHash=async response=>{const h=createHash('sha256');for await(const chunk of response.body)h.update(chunk);return h.digest('hex')};
try{
 const db=await mf.getD1Database('DB');for(const statement of (await firstReleaseSchema()).statements)await db.prepare(statement).run();
 const password='Synthetic-full-quota-28!',created=await send('register','POST',{email:'full-source@example.test',password});assert.equal(created.status,201);const cookie=created.cookie,owner=created.data.user.id;
 const bytes=Uint8Array.from({length:25*1024*1024},(_,i)=>i%251),expected=new Map();
 for(let i=0;i<21;i++){
  const data=i===20?bytes.subarray(0,12*1024*1024):bytes,name='synthetic-'+String(i).padStart(2,'0')+'.bin';
  const r=await mf.dispatchFetch(origin+'/api/files',{method:'POST',headers:{origin,cookie,'x-file-name':name},body:data});assert.equal(r.status,201,await r.clone().text());
  expected.set(name,createHash('sha256').update(data).digest('hex'));if(i%5===0||i===20)console.log('Uploaded synthetic file '+(i+1)+'/21');
 }
 const rejected=await mf.dispatchFetch(origin+'/api/files',{method:'POST',headers:{origin,cookie,'x-file-name':'over-quota.bin'},body:Uint8Array.of(1)});assert.equal(rejected.status,413);
 let articleId='',articleCount=0;
 for(let i=0;i<40;i++){
  const made=await send('items','POST',{kind:'article',title:'Maximum metadata '+i,body:'A'.repeat(1_000_000)},cookie);
  if(made.status===413)break;assert.equal(made.status,201);articleCount++;
  if(i===0){articleId=made.data.item.id;assert.equal((await send('items/'+articleId,'PATCH',{revision:1,body:'B'.repeat(1_000_000)},cookie)).status,200);}
 }
 assert.ok(articleCount>=25);let storage=await send('storage','GET',undefined,cookie);assert.equal(storage.data.usage.object_bytes,512*1024*1024);
 const remaining=32*1024*1024-storage.data.usage.metadata_bytes;
 if(remaining>10_000){const fill=await send('items','POST',{kind:'article',title:'Metadata allowance remainder',body:'Z'.repeat(remaining-10_000)},cookie);assert.equal(fill.status,201);articleCount++;}
 storage=await send('storage','GET',undefined,cookie);assert.ok(storage.data.usage.metadata_bytes<=32*1024*1024&&storage.data.usage.metadata_bytes>31*1024*1024);
 console.log('Source account at512MiB objects and '+storage.data.usage.metadata_bytes+' charged metadata bytes');
 const backup=await mf.dispatchFetch(origin+'/api/backup',{headers:{cookie}});assert.equal(backup.status,200);await pipeline(Readable.fromWeb(backup.body),fs.createWriteStream(backupPath));console.log('Streamed synthetic backup to temporary disk: '+fs.statSync(backupPath).size+' bytes');
 const target=await send('register','POST',{email:'full-target@example.test',password});assert.equal(target.status,201);const targetCookie=target.cookie,session=await send('restore/start','POST',{},targetCookie);assert.equal(session.status,201);const id=session.data.id;
 let sequence=0;
 for await(const line of readline.createInterface({input:fs.createReadStream(backupPath),crlfDelay:Infinity})){
  if(!line)continue;const record=JSON.parse(line);assert.notEqual(record.type,'error');
  const result=await send('restore/'+id+'/record','POST',{sequence,record},targetCookie);assert.equal(result.status,200,JSON.stringify(result));sequence++;
  if(sequence===200){await mf.setOptions({...options,bindings:{RESTART:'staging'}});const retry=await send('restore/'+id+'/record','POST',{sequence:sequence-1,record},targetCookie);assert.equal(retry.status,200);}
  if(sequence%100===0)console.log('Staged '+sequence+' records');
 }
 let done=false,commits=0;while(!done&&commits<sequence+3){const r=await send('restore/'+id+'/commit','POST',{confirm:true,policy:'keep-existing'},targetCookie);assert.equal(r.status,200,JSON.stringify(r));done=!!r.data.done;commits++;if(commits===200)await mf.setOptions({...options,bindings:{RESTART:'commit'}});if(commits%100===0)console.log('Committed '+commits+' records');}assert.ok(done);
 const library=await send('library?limit=100','GET',undefined,targetCookie);assert.equal(library.status,200);const restoredFiles=library.data.items.filter(x=>x.kind==='file');assert.equal(restoredFiles.length,21);assert.equal(library.data.items.filter(x=>x.kind==='article').length,articleCount);
 for(const file of restoredFiles){const r=await mf.dispatchFetch(origin+file.url,{headers:{cookie:targetCookie}});assert.equal(r.status,200);assert.equal(await streamHash(r),expected.get(file.file_name));}
 const targetStorage=await send('storage','GET',undefined,targetCookie);assert.equal(targetStorage.data.usage.object_bytes,512*1024*1024);assert.equal(targetStorage.data.usage.metadata_bytes,storage.data.usage.metadata_bytes,'A full valid backup fits the same approved account content allowance');
 let cleaned=false,cleanCalls=0;while(!cleaned&&cleanCalls++<40){const r=await send('restore/'+id+'/cleanup','POST',{confirm:true},targetCookie);assert.equal(r.status,200);cleaned=!!r.data.done;}assert.ok(cleaned);
 assert.equal((await send('restore/'+id+'/commit','POST',{confirm:true,policy:'keep-existing'},targetCookie)).data.done,true);
 assert.equal((await send('storage','GET',undefined,targetCookie)).data.usage.object_bytes,512*1024*1024);
 const sourceFile=(await send('library?limit=100','GET',undefined,cookie)).data.items.find(x=>x.kind==='file'),original=await mf.dispatchFetch(origin+sourceFile.url,{headers:{cookie}});assert.equal(original.status,200);assert.equal(await streamHash(original),expected.get(sourceFile.file_name));
 const result={completedAt:new Date().toISOString(),inputSha256:Object.fromEntries(['app/api/[...path]/route.ts','db/schema.ts','scripts/storage-quota-sql.mjs','scripts/first-release-schema.mjs'].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),passed:true,scope:'Actual fresh local D1/R2 at approved maximum account quota; not managed-provider disaster recovery',objectBytes:512*1024*1024,metadataBytes:storage.data.usage.metadata_bytes,filesVerified:21,articlesVerified:articleCount,records:sequence,commitCalls:commits,cleanupCalls:cleanCalls,runtimeRestarts:2,elapsedMs:Math.round(performance.now()-started),sourcePreserved:true,temporaryDataCleaned:true};
 fs.mkdirSync('docs/evidence',{recursive:true});fs.writeFileSync('docs/evidence/full-account-runtime.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await mf.dispose();assert.equal(path.dirname(path.resolve(temp)),path.resolve(os.tmpdir()));assert.ok(path.basename(temp).startsWith('oriva-full-account-'));fs.rmSync(temp,{recursive:true,force:true});}
