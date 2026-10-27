// Real disposable local D1/R2 at the maximum single-file size. No provider access.
import fs from 'node:fs';import ts from 'typescript';import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const source=fs.readFileSync('app/api/[...path]/route.ts','utf8').replace("import { env } from 'cloudflare:workers';",'let env;').replace("export const dynamic='force-dynamic';",'').replace('export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;','');
const script=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText+'\nexport default {fetch(request,bindings){env=bindings;return handle(request)}}';
const options={modules:true,script,compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],outboundService:()=>new Response('Outbound denied',{status:403})},mf=new Miniflare(options),origin='https://oriva.test';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
try{
 const db=await mf.getD1Database('DB');for(const file of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())for(const sql of fs.readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql).run();
 const send=async(route,method='GET',body,cookie='')=>{const r=await mf.dispatchFetch(origin+'/api/'+route,{method,headers:{origin,'content-type':'application/json',cookie},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 const password='Synthetic-max-file-only!',owner=await send('register','POST',{email:'capacity-source@example.test',password});assert.equal(owner.status,201);
 const bytes=Uint8Array.from({length:25*1024*1024},(_,i)=>i%251),expectedHash=hash(bytes);
 const upload=await mf.dispatchFetch(origin+'/api/files',{method:'POST',headers:{origin,cookie:owner.cookie,'x-file-name':'maximum-synthetic.bin'},body:bytes});assert.equal(upload.status,201);console.log('PASS maximum26214400-byte synthetic upload');
 const backup=await mf.dispatchFetch(origin+'/api/backup',{headers:{cookie:owner.cookie}});assert.equal(backup.status,200);
 const records=(await backup.text()).trim().split('\n').map(JSON.parse);assert.ok(!records.some(r=>r.type==='error'));assert.equal(records.at(-1).type,'end');assert.equal(records.filter(r=>r.type==='blob').length,25);
 const target=await send('register','POST',{email:'capacity-target@example.test',password});assert.equal(target.status,201);const started=await send('restore/start','POST',{},target.cookie);assert.equal(started.status,201);const id=started.data.id,half=Math.floor(records.length/2);
 const put=async i=>{const r=await send('restore/'+id+'/record','POST',{sequence:i,record:records[i]},target.cookie);assert.equal(r.status,200,JSON.stringify(r));return r;};
 for(let i=0;i<half;i++)await put(i);
 // Recreate the Worker runtime with the same isolated local namespaces.
 await mf.setOptions({...options,bindings:{CAPACITY_RESTART:'upload'}});
 let preview=await send('restore/'+id+'/preview','GET',undefined,target.cookie);assert.equal(preview.status,200);assert.equal(preview.data.next,half);await put(half-1);assert.equal((await send('restore/'+id+'/preview','GET',undefined,target.cookie)).data.next,half);
 for(let i=half;i<records.length;i++)await put(i);console.log('PASS interrupted maximum-file staging resumes and duplicate retry does not advance');
 let done=false,commits=0;while(!done&&commits++<records.length+3){const r=await send('restore/'+id+'/commit','POST',{confirm:true,policy:'keep-existing'},target.cookie);assert.equal(r.status,200,JSON.stringify(r));done=!!r.data.done;if(commits===5)await mf.setOptions({...options,bindings:{CAPACITY_RESTART:'commit'}});}assert.ok(done);
 const library=await send('library','GET',undefined,target.cookie);assert.equal(library.status,200);assert.equal(library.data.items.length,1);const item=library.data.items[0];assert.equal(item.file_size,bytes.length);
 const download=await mf.dispatchFetch(origin+item.url,{headers:{cookie:target.cookie}});assert.equal(download.status,200);assert.equal(hash(Buffer.from(await download.arrayBuffer())),expectedHash);
 const repeated=await send('restore/'+id+'/commit','POST',{confirm:true,policy:'keep-existing'},target.cookie);assert.equal(repeated.status,200);assert.equal(repeated.data.done,true);assert.equal((await send('library','GET',undefined,target.cookie)).data.items.length,1);
 assert.equal((await send('restore/'+id+'/preview','GET',undefined,owner.cookie)).status,404);
 const rollback=await send('restore/'+id+'/rollback','POST',{confirm:true},target.cookie);assert.equal(rollback.status,200);const afterRollback=(await send('library','GET',undefined,target.cookie)).data.items;assert.equal(afterRollback.length,1);assert.equal(afterRollback[0].id,item.id);assert.ok(afterRollback[0].deleted_at>0,'Modern synchronization retains a recoverable trash tombstone');
 const original=await send('library','GET',undefined,owner.cookie);assert.equal(original.data.items.length,1);const originalDownload=await mf.dispatchFetch(origin+original.data.items[0].url,{headers:{cookie:owner.cookie}});assert.equal(hash(Buffer.from(await originalDownload.arrayBuffer())),expectedHash);
 console.log(JSON.stringify({passed:true,scope:'Actual disposable D1/R2; one maximum-size file, not full-library capacity or retention acceptance',bytes:bytes.length,blobChunks:25,records:records.length,commits,sha256:expectedHash,uploadRestart:true,commitRestart:true,rollback:'imported item only, recoverable trash; original bytes preserved'}));
}finally{await mf.dispose();}
