import { env } from 'cloudflare:workers';
export const dynamic='force-dynamic';
const enc=new TextEncoder(), cookieName='__Host-oriva';
const now=()=>Math.floor(Date.now()/1000);
const db=()=>env.DB as D1Database;
const hex=(a:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(a instanceof Uint8Array?a.buffer.slice(a.byteOffset,a.byteOffset+a.byteLength):a)).map(x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
async function digest(s:string){return hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));}
async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:100000},key,256));}
function equal(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function json(data:unknown,status=200,extra:Record<string,string>={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});}
function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status});}
function value(v:unknown,max:number){return typeof v==='string'?v.trim().slice(0,max):'';}
async function payload(req:Request){if(Number(req.headers.get('content-length')||0)>3_000_000)fail('Request is too large',413);const s=await req.text();if(s.length>3_000_000)fail('Request is too large',413);try{const parsed=JSON.parse(s);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail('Invalid request');return parsed;}catch{fail('Invalid request');}}
async function rate(key:string,limit:number){const k=await digest(key),t=now();const row=await db().prepare('INSERT INTO attempts (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<? THEN ? ELSE expires END RETURNING count').bind(k,t+900,t,t,t+900).first<{count:number}>();if((row?.count||0)>limit)fail('Too many attempts. Please try again in 15 minutes',429);}
async function session(req:Request){const raw=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!raw)return null;return db().prepare('SELECT users.id,users.email,users.name FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>?').bind(await digest(raw),now()).first<{id:string,email:string,name:string}>();}
async function newSession(id:string){const raw=random();await db().batch([db().prepare('DELETE FROM sessions WHERE expires<?').bind(now()),db().prepare('DELETE FROM attempts WHERE expires<?').bind(now()),db().prepare('INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)').bind(await digest(raw),id,now()+30*86400)]);return `${cookieName}=${raw}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`;}
function normalizeUrl(input:unknown){if(typeof input==='string'&&input.trim().length>4000)fail('Link limit is 4,000 characters');const u=value(input,4000);if(!u)fail('Add a link');let url:URL;try{url=new URL(/^https?:\/\//i.test(u)?u:'https://'+u);}catch{fail('Invalid link');}if(!['http:','https:'].includes(url.protocol)||!url.hostname.includes('.')||url.username||url.password)fail('Use a valid http or https link');return url.toString();}
function itemInput(b:Record<string,unknown>){const tags=Array.isArray(b.tags)?Array.from(new Set(b.tags.map(x=>value(x,40)).filter(Boolean))).slice(0,20):[];return {url:normalizeUrl(b.url),title:value(b.title,240)||new URL(normalizeUrl(b.url)).hostname,note:value(b.note,12000),tags:JSON.stringify(tags),collection:value(b.collection,80),status:['inbox','reading','done','archived'].includes(String(b.status))?String(b.status):'inbox',favorite:b.favorite?1:0};}
const bucket=()=>env.BUCKET as R2Bucket;
// Generated from storage-quota-sql.mjs; keeps prior development rows readable.
const storageBootstrapSQL="INSERT OR IGNORE INTO storage_usage(user_id,metadata_bytes,object_bytes) SELECT ?1,(SELECT COALESCE(SUM(2048+length(CAST(json_quote(q.id) AS BLOB))+length(CAST(json_quote(q.user_id) AS BLOB))+length(CAST(json_quote(q.url) AS BLOB))+length(CAST(json_quote(q.title) AS BLOB))+length(CAST(json_quote(q.note) AS BLOB))+length(CAST(json_quote(q.tags) AS BLOB))+length(CAST(json_quote(q.collection) AS BLOB))+length(CAST(json_quote(q.status) AS BLOB))+length(CAST(json_quote(q.kind) AS BLOB))+length(CAST(json_quote(q.file_key) AS BLOB))+length(CAST(json_quote(q.file_name) AS BLOB))+length(CAST(json_quote(q.file_type) AS BLOB))+length(CAST(json_quote(q.image) AS BLOB))+length(CAST(json_quote(q.body) AS BLOB))+length(CAST(json_quote(q.language) AS BLOB))),0) FROM items q WHERE q.user_id=?1)+(SELECT COALESCE(SUM(2048+length(CAST(json_quote(q.id) AS BLOB))+length(CAST(json_quote(q.user_id) AS BLOB))+length(CAST(json_quote(q.name) AS BLOB))+length(CAST(json_quote(q.parent_id) AS BLOB))+length(CAST(json_quote(q.icon) AS BLOB))+length(CAST(json_quote(q.color) AS BLOB))+length(CAST(json_quote(q.image) AS BLOB))),0) FROM collections q WHERE q.user_id=?1)+(SELECT COALESCE(SUM(2048+length(CAST(json_quote(q.item_id) AS BLOB))+length(CAST(json_quote(q.user_id) AS BLOB))+length(CAST(json_quote(q.snapshot) AS BLOB))),0) FROM item_revisions q WHERE q.user_id=?1)+(SELECT COALESCE(SUM(2048+length(CAST(json_quote(q.id) AS BLOB))+length(CAST(json_quote(q.user_id) AS BLOB))+length(CAST(json_quote(q.item_id) AS BLOB))+length(CAST(json_quote(q.mime) AS BLOB))),0) FROM attachments q WHERE q.user_id=?1)+(SELECT COALESCE(SUM(2048+length(CAST(json_quote(q.user_id) AS BLOB))+length(CAST(json_quote(q.data) AS BLOB))),0) FROM preferences q WHERE q.user_id=?1)+(SELECT COALESCE(SUM(2048+length(CAST(json_quote(q.item_id) AS BLOB))+length(CAST(json_quote(q.user_id) AS BLOB))+length(CAST(json_quote(q.state) AS BLOB))),0) FROM item_health q WHERE q.user_id=?1)+(SELECT COUNT(*)*2048 FROM object_storage WHERE user_id=?1),(SELECT COALESCE(SUM(bytes),0) FROM object_storage WHERE user_id=?1) WHERE NOT EXISTS(SELECT 1 FROM storage_usage WHERE user_id=?1);";
async function initializeObjectAccounting(userId:string){
 await db().prepare(storageBootstrapSQL).bind(userId).run();
 const usage=await db().prepare('SELECT object_census FROM storage_usage WHERE user_id=?').bind(userId).first<{object_census:number}>();
 if(usage?.object_census)return;
 let cursor:string|undefined;
 do{const page=await bucket().list({prefix:userId+'/',limit:100,cursor});
  for(const object of page.objects){const suffix=object.key.slice(userId.length+1);if(/^(?:files\/)?[0-9a-f-]{36}$/.test(suffix))await db().prepare("INSERT OR IGNORE INTO object_storage(key,user_id,bytes,state) VALUES(?,?,?,'ready')").bind(object.key,userId,object.size).run();}
  cursor=page.truncated?page.cursor:undefined;
 }while(cursor);
 await db().prepare('UPDATE storage_usage SET object_census=1 WHERE user_id=?').bind(userId).run();
}
async function storeObject(userId:string,key:string,bytes:Uint8Array,options:R2PutOptions,restore?:{session:string;source:string}){
 if(!key.startsWith(userId+'/')||!/^(?:files\/)?[0-9a-f-]{36}$/.test(key.slice(userId.length+1)))fail('Invalid storage object key');
 await initializeObjectAccounting(userId);
 const existing=await db().prepare('SELECT state FROM object_storage WHERE key=? AND user_id=?').bind(key,userId).first<{state:string}>();if(existing?.state==='ready')return;
 const operation=crypto.randomUUID();
 // A canceled restore mapping rotates its object UUID before bytes are
 // deleted. A stale commit cannot reserve or recreate that retired key.
 const mappingGuard=restore?" AND EXISTS(SELECT 1 FROM restore_maps m JOIN restore_sessions s ON s.id=m.session_id WHERE m.session_id=? AND m.kind='blob' AND m.source_id=? AND m.target_id=? AND s.user_id=?)":'';
 const reserved=await db().prepare("INSERT OR IGNORE INTO object_storage(key,user_id,bytes,state,updated,operation_id,write_protocol) SELECT ?,?,?,'pending',?,?,'multipart-v1' WHERE 1=1"+mappingGuard).bind(key,userId,bytes.byteLength,now(),operation,...(restore?[restore.session,restore.source,key.slice(-36),userId]:[])).run();
 if(!reserved.meta.changes)fail('Upload is pending or canceled. Clean unused uploads before retrying.',409);
 let upload:R2MultipartUpload|undefined;
 try{
  upload=await bucket().createMultipartUpload(key,options);
  const recorded=await db().prepare("UPDATE object_storage SET upload_id=? WHERE key=? AND operation_id=? AND state='pending'").bind(upload.uploadId,key,operation).run();if(!recorded.meta.changes)fail('Upload was canceled during cleanup',409);
  const part=await upload.uploadPart(1,bytes);await upload.complete([part]);
 }catch(e){if(upload)await upload.abort().catch(()=>{});const failed=await db().prepare("UPDATE object_storage SET state='failed',updated=? WHERE key=? AND operation_id=? AND state='pending'").bind(now(),key,operation).run();if(!failed.meta.changes)fail('Upload was canceled during cleanup',409);throw e;}
 const saved=await db().prepare("UPDATE object_storage SET state='ready',updated=? WHERE key=? AND operation_id=? AND state='pending'").bind(now(),key,operation).run();
 if(!saved.meta.changes){await bucket().delete(key);fail('Upload was canceled during cleanup',409);}
}
async function objectReferenced(userId:string,key:string){
 const id=key.slice(-36),imagePath='/api/images/'+id,filePath='/api/files/'+id;
 return !!await db().prepare("SELECT id FROM items WHERE user_id=?1 AND (file_key=?2 OR image=?2 OR instr(body,?3)>0 OR instr(body,?4)>0) UNION ALL SELECT id FROM collections WHERE user_id=?1 AND image=?2 UNION ALL SELECT id FROM attachments WHERE user_id=?1 AND id=?2 UNION ALL SELECT item_id FROM item_revisions WHERE user_id=?1 AND (json_extract(snapshot,'$.file_key')=?2 OR json_extract(snapshot,'$.image')=?2 OR instr(COALESCE(json_extract(snapshot,'$.body'),''),?3)>0 OR instr(COALESCE(json_extract(snapshot,'$.body'),''),?4)>0) UNION ALL SELECT user_id FROM preferences WHERE user_id=?1 AND (instr(data,?3)>0 OR instr(data,?4)>0) LIMIT 1").bind(userId,id,imagePath,filePath).first();
}
async function deleteStoredObject(key:string){
 const entry=await db().prepare('SELECT user_id,state,write_protocol FROM object_storage WHERE key=?').bind(key).first<{user_id:string;state:string;write_protocol:string}>();if(!entry)return false;
 // Old development-only single PUTs have no cancellation handle. Never free
 // their unknown pending writes by guessing a timeout. New writes are abortable.
 if(entry.state!=='ready'&&entry.write_protocol!=='multipart-v1')return false;
 // A reconstructed blob is already owned by its active restore, even before
 // the following item record has attached it. Do not strand that forward step.
 if(entry.state==='ready'&&await db().prepare("SELECT 1 FROM restore_maps m JOIN restore_sessions s ON s.id=m.session_id WHERE m.kind='blob' AND m.target_id=? AND s.user_id=? AND s.state IN ('ready','committing') AND s.cleanup_state='' LIMIT 1").bind(key.slice(-36),entry.user_id).first())return false;
 const claimed=await db().prepare("UPDATE object_storage SET state='purging',updated=? WHERE key=? AND state=? AND (state IN ('ready','failed','pending') OR (state='purging' AND updated<=?))").bind(now(),key,entry.state,now()-60).run();if(!claimed.meta.changes)return false;
 if(await objectReferenced(entry.user_id,key)){await db().prepare("UPDATE object_storage SET state='ready',updated=? WHERE key=? AND state='purging'").bind(now(),key).run();return false;}
 // Rotation is durable before any abort/delete. Even an interrupted cleanup
 // that later resumes can only delete the retired UUID, never its replacement.
 await db().prepare("UPDATE restore_maps SET target_id=? WHERE kind='blob' AND target_id=? AND session_id IN (SELECT id FROM restore_sessions WHERE user_id=?)").bind(crypto.randomUUID(),key.slice(-36),entry.user_id).run();
 const current=await db().prepare('SELECT upload_id FROM object_storage WHERE key=?').bind(key).first<{upload_id:string}>();
 try{if(current?.upload_id){try{await bucket().resumeMultipartUpload(key,current.upload_id).abort();}catch(e){if(!/(?:NoSuchUpload|\b10024\b)/.test((e as Error).message))throw e;}}await bucket().delete(key);}catch(e){await db().prepare("UPDATE object_storage SET state='failed',updated=? WHERE key=? AND state='purging'").bind(now(),key).run();throw e;}
 await db().prepare("DELETE FROM object_storage WHERE key=? AND state='purging'").bind(key).run();return true;
}

async function imageUpload(body:Record<string,unknown>,userId:string,previous=''){
 if(body.removeImage===true&&!body.imageData)return '';
 if(body.imageData===undefined||body.imageData==='')return previous;
 if(typeof body.imageData!=='string'||body.imageData.length>2_800_000)fail('Choose an image up to 2 MB');
 const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.imageData);
 if(!match)fail('Use a JPG, PNG or WebP image');
 let bytes:Uint8Array;try{bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));}catch{fail('Invalid image');}
 if(bytes.length>2_000_000)fail('Choose an image up to 2 MB');
 const mime=match[1];
 const valid=mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:mime==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!valid)fail('Invalid image format');
 const id=crypto.randomUUID();await storeObject(userId,userId+'/'+id,bytes,{httpMetadata:{contentType:mime}});return id;
}
async function removeImage(userId:string,id:string){if(id)await deleteStoredObject(userId+'/'+id).catch(()=>console.error('Image cleanup failed'));}
const MAX_FILE_BYTES=25*1024*1024;
async function uploadBytes(req:Request){
 if(Number(req.headers.get('content-length')||0)>MAX_FILE_BYTES)fail('Maximum file size is 25 MB',413);
 if(!req.body)return new Uint8Array();
 const reader=req.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>MAX_FILE_BYTES){await reader.cancel();fail('Maximum file size is 25 MB',413);}chunks.push(next.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
function downloadName(name:string){return name.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,240)||'file';}
const itemColumns='body,language,pinned,deleted_at,rating,id,url,title,note,tags,collection,status,favorite,image,kind,file_key,file_name,file_size,file_type,created,updated,revision';
const summaryColumns=itemColumns.replace('body,','substr(body,1,500) AS body,length(body)>500 AS body_preview,');
const legacyColumns='id,url,title,note,tags,collection,status,favorite,image,kind,file_key,file_name,file_size,file_type,created,updated,revision';
const markItem=(userId:string,id:string)=>db().prepare('UPDATE items SET change_seq=(SELECT library_revision+1 FROM users WHERE id=?) WHERE id=? AND user_id=?').bind(userId,id,userId);
const changed=(userId:string)=>db().prepare('UPDATE users SET library_revision=library_revision+1 WHERE id=?').bind(userId);
function decode(row:Record<string,unknown>):Record<string,unknown>&{tags:string[];favorite:boolean}{return {...row,tags:JSON.parse(String(row.tags||'[]')),favorite:!!row.favorite,pinned:!!row.pinned};}
function contentBody(v:unknown){if(typeof v!=='string')return '';if(v.includes('\0'))fail('Text cannot contain a NUL character');if(enc.encode(v).byteLength>1_000_000)fail('Document limit is 1 MB',413);if(enc.encode(JSON.stringify(v)).byteLength>1_400_000)fail('Document has too many escaped characters',413);return v;}
function preferenceInput(input:unknown):Record<string,unknown>{
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Invalid preferences');const data=input as Record<string,unknown>;
 for(const key of ['sidebar','widgets','hiddenWidgets','favoriteCollections'])if(data[key]!==undefined&&(!Array.isArray(data[key])||data[key].length>100||data[key].some((x:unknown)=>typeof x!=='string'||x.length>80)))fail('Invalid preference list');
 for(const key of ['linkHealthEnabled','healthNotifications'])if(data[key]!==undefined&&typeof data[key]!=='boolean')fail('Invalid preference flag');
 for(const [key,values] of [['view',['grid','list','compact','board']],['theme',['light','dark','system']],['language',['ar','en']]] as const)if(data[key]!==undefined&&!(values as readonly unknown[]).includes(data[key]))fail('Invalid preference value');
 if(JSON.stringify(data).length>64000)fail('Preferences are too large',413);return data;
}
async function ensureCollection(userId:string,name:string){if(name)await db().prepare('INSERT OR IGNORE INTO collections(id,user_id,name,created,updated) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),userId,name,now(),now()).run();}
function snapshotStatement(exists:Record<string,unknown>,userId:string){return db().prepare('INSERT OR IGNORE INTO item_revisions(item_id,user_id,revision,snapshot,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM items WHERE id=? AND user_id=? AND revision=?)').bind(exists.id,userId,exists.revision,JSON.stringify(exists),now(),exists.id,userId,exists.revision);}
async function remapBackupText(text:string,sourceOwner:string,lookup:(kind:string,source:string)=>Promise<{target_id:string;data:string}|null>){
 let result=text;const references=Array.from(new Set(text.match(/\/api\/(?:images|files)\/[0-9a-f-]{36}/g)||[]));
 for(const token of references){const image=token.startsWith('/api/images/'),mapped=await lookup(image?'blob':'item',image?sourceOwner+'/'+token.slice(12):token.slice(11));if(!mapped){if(image)fail('Backup image bytes are missing');continue;}result=result.split(token).join('/api/'+(image?'images/':'files/')+mapped.target_id);}
 return result;
}
async function handle(req:Request){try{
 const path=new URL(req.url).pathname.replace(/^\/api\//,''),method=req.method;
 if(method!=='GET'){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)fail('Invalid request origin',403);if(!(path==='files'&&method==='POST')&&!(req.headers.get('content-type')||'').includes('application/json'))fail('JSON required',415);}
 if(path==='me'&&method==='GET'){return json({user:await session(req)});}
 if(['register','login','recover'].includes(path)&&method==='POST'){
  const b=await payload(req),email=value(b.email,254).toLowerCase(),password=typeof b.password==='string'?b.password:'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<10||password.length>128)fail('Use a valid email and a password between 10 and 128 characters');
  const ip=req.headers.get('cf-connecting-ip')||'unknown';await rate('ip:'+ip,50);await rate(path+':'+email,12);
  if(path==='register'){
   const existing=await db().prepare('SELECT id FROM users WHERE email=?').bind(email).first();if(existing)fail('This email already has an account. Please sign in',409);
   const id=crypto.randomUUID(),salt=random(),recovery=random();
   await db().prepare('INSERT INTO users (id,email,name,salt,password_hash,recovery_hash,created) VALUES (?,?,?,?,?,?,?)').bind(id,email,value(b.name,60)||email.split('@')[0],salt,await passwordHash(password,salt),await digest(recovery),now()).run();
   return json({user:{id,email,name:value(b.name,60)||email.split('@')[0]},recovery},201,{'Set-Cookie':await newSession(id)});
  }
  const user=await db().prepare('SELECT * FROM users WHERE email=?').bind(email).first<{id:string,email:string,name:string,salt:string,password_hash:string,recovery_hash:string}>();
  if(path==='recover'){
   const code=value(b.code,100);if(!user||!equal(await digest(code),user.recovery_hash))fail('Email or recovery code is incorrect',401);
   const salt=random(),recovery=random();await db().batch([db().prepare('UPDATE users SET salt=?,password_hash=?,recovery_hash=? WHERE id=?').bind(salt,await passwordHash(password,salt),await digest(recovery),user.id),db().prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
   return json({user:{id:user.id,email:user.email,name:user.name},recovery},200,{'Set-Cookie':await newSession(user.id)});
  }
  const hash=await passwordHash(password,user?.salt||'dummy-auth-timing-salt');if(!user||!equal(hash,user.password_hash))fail('Email or password is incorrect',401);
  return json({user:{id:user.id,email:user.email,name:user.name}},200,{'Set-Cookie':await newSession(user.id)});
 }
 const user=await session(req);if(!user)fail('Please sign in',401);
 if(path==='logout'&&method==='POST'){const raw=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(raw)await db().prepare('DELETE FROM sessions WHERE token=?').bind(await digest(raw)).run();return json({ok:true},200,{'Set-Cookie':`${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`});}
 // Non-destructive incident containment for a schema-compatible deployment.
 // This blocks newly admitted library writes, not in-flight requests or auth.
 // It is not a provider snapshot, drain barrier or database/file restoration.
 if(method!=='GET'&&method!=='HEAD'&&(env as unknown as {ORIVA_LIBRARY_READ_ONLY?:string}).ORIVA_LIBRARY_READ_ONLY==='1')return json({error:'Library updates are temporarily paused. Saved content remains readable.',code:'library_read_only'},503,{'Retry-After':'300'});
 if(method!=='GET'&&method!=='HEAD')await initializeObjectAccounting(user.id);
 if(path==='health'&&method==='GET'){
  if(new URL(req.url).searchParams.has('summary'))return json({summary:(await db().prepare('SELECT state,COUNT(*) n FROM item_health WHERE user_id=? GROUP BY state').bind(user.id).all()).results});
  return json({health:(await db().prepare('SELECT * FROM item_health WHERE user_id=? ORDER BY checked DESC LIMIT 10000').bind(user.id).all()).results});
 }
 if(path==='health'&&method==='POST'){
  const body=await payload(req);if(!['healthy','missing','restricted','rate-limited','inconclusive'].includes(body.state)||!Number.isInteger(body.http_status)||body.http_status<0||body.http_status>599)fail('Invalid browser health report');
  const item=await db().prepare("SELECT id FROM items WHERE id=? AND user_id=? AND kind='link' AND deleted_at=0").bind(body.id,user.id).first();if(!item)fail('Link not found',404);await rate('health:'+user.id,60);
  await db().prepare("INSERT INTO item_health(item_id,user_id,state,http_status,checked,missing_count) VALUES(?,?,?,?,?,?) ON CONFLICT(item_id) DO UPDATE SET state=excluded.state,http_status=excluded.http_status,checked=excluded.checked,missing_count=CASE WHEN excluded.state='missing' THEN item_health.missing_count+1 ELSE 0 END").bind(body.id,user.id,body.state,body.http_status,now(),body.state==='missing'?1:0).run();return json({ok:true,source:'browser-cors'});
 }
 if(path==='backup'&&method==='GET'){
  const userId=user.id,version=(await db().prepare('SELECT library_revision FROM users WHERE id=?').bind(userId).first<{library_revision:number}>())!.library_revision;
  async function* records():AsyncGenerator<Record<string,unknown>>{
   yield {type:'header',format:'oriva-complete-backup',version:1,sourceOwner:userId,created:new Date().toISOString()};
   const groups=(await db().prepare('SELECT * FROM collections WHERE user_id=?').bind(userId).all<Record<string,unknown>>()).results;
   const emitted=new Set<string>();while(emitted.size<groups.length){let count=0;for(const row of groups)if(!emitted.has(String(row.id))&&(!row.parent_id||emitted.has(String(row.parent_id)))){yield {type:'collection',row};emitted.add(String(row.id));count++}if(!count)fail('Collection hierarchy needs repair before backup',409)}
   const prefs=await db().prepare('SELECT * FROM preferences WHERE user_id=?').bind(userId).first();if(prefs)yield {type:'preference',row:prefs};
   let cursor:string|undefined;do{const page=await bucket().list({prefix:userId+'/',limit:100,cursor});for(const object of page.objects){if(object.key.includes('/restore/'))continue;const suffix=object.key.slice(userId.length+1);if(!/^(?:files\/)?[0-9a-f-]{36}$/.test(suffix))continue;if(object.size>MAX_FILE_BYTES)fail('Unsupported object size in backup',413);const stored=await bucket().get(object.key);if(!stored)fail('A backup object disappeared',409);const bytes=new Uint8Array(await new Response(stored.body).arrayBuffer()),chunks=Math.max(1,Math.ceil(bytes.length/1048576));for(let chunk=0;chunk<chunks;chunk++){const data=bytes.subarray(chunk*1048576,(chunk+1)*1048576);let binary='';for(let i=0;i<data.length;i+=32768)binary+=String.fromCharCode(...data.subarray(i,i+32768));yield {type:'blob',sourceKey:object.key,objectKind:suffix.startsWith('files/')?'file':'image',chunk,chunks,size:bytes.length,mime:stored.httpMetadata?.contentType||'application/octet-stream',sha256:hex(await crypto.subtle.digest('SHA-256',data)),data:btoa(binary)}}}cursor=page.truncated?page.cursor:undefined}while(cursor);
   for(const row of groups)if(row.image)yield {type:'collection-image',row:{id:row.id,image:row.image}};
   for(const [table,type,key] of [['items','item','id'],['attachments','attachment','id'],['item_revisions','revision','rowid'],['item_health','health','item_id']] as const){let after:string|number=key==='rowid'?0:'';for(;;){const rows=(await db().prepare(`SELECT *,${key} AS backup_cursor FROM ${table} WHERE user_id=? AND ${key}>? ORDER BY ${key} LIMIT 20`).bind(userId,after).all<Record<string,unknown>>()).results;for(const row of rows){after=row.backup_cursor as string|number;delete row.backup_cursor;if(type==='revision')row.snapshot=JSON.parse(String(row.snapshot));yield {type,row}}if(rows.length<20)break}}
   const latest=await db().prepare('SELECT library_revision FROM users WHERE id=?').bind(userId).first<{library_revision:number}>();if(latest?.library_revision!==version)fail('Library changed during backup. Create a fresh backup.',409);
  }
  const iterator=records(),stream=new ReadableStream<Uint8Array>({async pull(controller){try{const next=await iterator.next();if(next.done){controller.close();return}controller.enqueue(enc.encode(JSON.stringify(next.value)+'\n'))}catch{controller.enqueue(enc.encode(JSON.stringify({type:'error',error:'Backup incomplete. Retry while the library is idle.'})+'\n'));controller.close()}}});
  // The outer transform hashes a canonical chain without buffering the backup.
  let chain='',count=0;const transform=new TransformStream<Uint8Array,Uint8Array>({async transform(chunk,controller){const line=new TextDecoder().decode(chunk).trimEnd();chain=await digest(chain+'\n'+line);count++;controller.enqueue(chunk)},flush(controller){controller.enqueue(enc.encode(JSON.stringify({type:'end',records:count,sha256:chain})+'\n'))}});
  return new Response(stream.pipeThrough(transform),{headers:{'Content-Type':'application/x-ndjson','Content-Disposition':'attachment; filename="Oriva-complete-backup.oriva"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 // Staging limits reserve resources in D1 before writing any R2 bytes.
 const restoreTTL=7*86400,restoreMetadataBudget=64*1024*1024,restoreBlobBudget=1024*1024*1024;
 if(path==='storage'&&method==='GET'){await initializeObjectAccounting(user.id);const usage=await db().prepare('SELECT metadata_bytes,object_bytes FROM storage_usage WHERE user_id=?').bind(user.id).first();return json({usage,limits:{metadataBytes:32*1024*1024,objectBytes:512*1024*1024},policy:'trash-and-revisions-count; escaped-records-plus-bookkeeping'});}
 if(path==='storage/orphans'&&method==='GET'){
  await initializeObjectAccounting(user.id);const after=new URL(req.url).searchParams.get('after')||'';
  const rows=(await db().prepare("SELECT key,bytes,state FROM object_storage WHERE user_id=? AND key>? ORDER BY key LIMIT 20").bind(user.id,after).all<{key:string;bytes:number;state:string}>()).results,objects=[];
  for(const row of rows)if(!await objectReferenced(user.id,row.key))objects.push(row);
  return json({objects,next:rows.length===20?rows.at(-1)!.key:null});
 }
 if(path==='storage/cleanup'&&method==='POST'){
  const body=await payload(req);if(body.confirm!==true||!Array.isArray(body.keys)||!body.keys.length||body.keys.length>20||body.keys.some((key:unknown)=>typeof key!=='string'||key.length>150))fail('Confirm cleanup of up to 20 unused uploads');
  // Validate the entire owner-scoped batch before any R2 operation.
  for(const key of body.keys)if(!await db().prepare('SELECT key FROM object_storage WHERE key=? AND user_id=?').bind(key,user.id).first())fail('Upload not found',404);
  const cleaned:string[]=[],retained:string[]=[];for(const key of body.keys)(await deleteStoredObject(key)?cleaned:retained).push(key);
  return json({cleaned,retained});
 }
 if(path==='storage/trash'&&method==='GET')return json({items:(await db().prepare('SELECT id,title,revision FROM items WHERE user_id=? AND deleted_at>0 ORDER BY deleted_at,id LIMIT 20').bind(user.id).all()).results});
 if(path.startsWith('storage/trash/')&&method==='POST'){
  const id=path.slice(14),body=await payload(req);if(body.confirm!==true||!Number.isSafeInteger(body.revision))fail('Confirm permanent deletion with the current revision');
  const entry=await db().prepare('SELECT revision,deleted_at FROM items WHERE id=? AND user_id=?').bind(id,user.id).first<{revision:number;deleted_at:number}>();if(!entry)fail('Item not found',404);if(!entry.deleted_at||entry.revision!==body.revision)fail('Item changed. Reload before deleting.',409);
  const result=await db().batch([
   db().prepare('DELETE FROM items WHERE id=? AND user_id=? AND deleted_at>0 AND revision=?').bind(id,user.id,body.revision),
   ...['item_revisions','attachments','item_health'].map(table=>db().prepare(`DELETE FROM ${table} WHERE item_id=? AND user_id=? AND NOT EXISTS(SELECT 1 FROM items WHERE id=? AND user_id=?)`).bind(id,user.id,id,user.id)),db().prepare('UPDATE users SET library_revision=library_revision+1,purge_revision=library_revision+1 WHERE id=?').bind(user.id)]);
  if(!result[0].meta.changes)fail('Item changed. Reload before deleting.',409);
  return json({ok:true,permanentlyDeleted:true,unusedUploadsRequireCleanup:true});
 }
 if(path==='restore/sessions'&&method==='GET'){
  const rows=(await db().prepare("SELECT id,state,created,cleanup_state FROM restore_sessions WHERE user_id=? AND cleanup_state!='cleaned' ORDER BY created,id LIMIT 50").bind(user.id).all()).results;
  return json({sessions:rows.map(row=>({...row,expires:Number(row.created)+restoreTTL})),policy:{activeSessions:2,metadataBytes:restoreMetadataBudget,blobBytes:restoreBlobBudget,expiresAfterSeconds:restoreTTL,cleanup:'explicit-owner-confirmed-bounded-staging-only'}});
 }
 if(path==='restore/start'&&method==='POST'){
  await rate('restore-start:'+user.id,5);const id=crypto.randomUUID(),created=now();
  const result=await db().prepare("INSERT INTO restore_sessions(id,user_id,state,created) SELECT ?,?,'uploading',? WHERE (SELECT COUNT(*) FROM restore_sessions WHERE user_id=? AND state IN ('uploading','ready','committing') AND created>? AND cleanup_state='')<2").bind(id,user.id,created,user.id,created-restoreTTL).run();
  if(!result.meta.changes)fail('Two restores are already active. Resume or clean one before starting another.',429);
  return json({id,expires:created+restoreTTL},201);
 }
 const restore=/^restore\/([0-9a-f-]{36})\/(record|preview|commit|rollback|cleanup)$/.exec(path);
 if(restore){
  const id=restore[1],operation=restore[2],state=await db().prepare('SELECT * FROM restore_sessions WHERE id=? AND user_id=?').bind(id,user.id).first<{id:string;user_id:string;state:string;next:number;chain:string;source_owner:string;position:number;created:number;cleanup_state:string}>();if(!state)fail('Restore session not found',404);
  if(operation==='cleanup'&&method==='POST'){
   const body=await payload(req);if(body.confirm!==true)fail('Staging cleanup confirmation required');
   if(!['complete','rolled-back'].includes(state.state)&&!(state.state==='uploading'&&state.created<=now()-restoreTTL))fail('Finish or roll back this restore before cleaning staging data',409);
   await db().prepare("UPDATE restore_sessions SET cleanup_state='cleaning' WHERE id=? AND user_id=?").bind(id,user.id).run();
   const prefix=user.id+'/restore/'+id+'/',page=await bucket().list({prefix,limit:100});
   for(const object of page.objects){if(!object.key.startsWith(prefix))fail('Invalid staged object prefix',500);await bucket().delete(object.key);}
   if(page.objects.length)return json({done:false,phase:'objects',removed:page.objects.length});
   for(const table of ['restore_records','restore_maps','restore_admissions'])await db().prepare(`DELETE FROM ${table} WHERE rowid IN(SELECT rowid FROM ${table} WHERE session_id=? LIMIT 100)`).bind(id).run();
   const remaining=await db().prepare('SELECT (SELECT COUNT(*) FROM restore_records WHERE session_id=?)+(SELECT COUNT(*) FROM restore_maps WHERE session_id=?)+(SELECT COUNT(*) FROM restore_admissions WHERE session_id=?) n').bind(id,id,id).first<{n:number}>();
   if(remaining?.n)return json({done:false,phase:'metadata'});
   await db().prepare("UPDATE restore_sessions SET cleanup_state='cleaned' WHERE id=? AND user_id=?").bind(id,user.id).run();return json({done:true,policy:'temporary-restore-data-only'});
  }
  if(['record','commit'].includes(operation)&&!(operation==='commit'&&state.state==='complete')){
   if(state.cleanup_state)fail('Restore staging was cleaned. Stage the backup again.',410);
   if(state.created<=now()-restoreTTL)fail('Restore staging expired after seven days. Roll back or clean it and stage the backup again.',410);
  }
  const reserve=async(seq:number,hash:string,metadataBytes:number,blobBytes:number)=>{
   await db().prepare("INSERT OR IGNORE INTO restore_admissions(session_id,user_id,sequence,hash,metadata_bytes,blob_bytes) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM restore_sessions WHERE id=? AND user_id=? AND state='uploading' AND cleanup_state='' AND created>?) AND (SELECT COALESCE(SUM(metadata_bytes),0) FROM restore_admissions WHERE user_id=?)+?<=? AND (SELECT COALESCE(SUM(blob_bytes),0) FROM restore_admissions WHERE user_id=?)+?<=?").bind(id,user.id,seq,hash,metadataBytes,blobBytes,id,user.id,now()-restoreTTL,user.id,metadataBytes,restoreMetadataBudget,user.id,blobBytes,restoreBlobBudget).run();
   const reservation=await db().prepare('SELECT hash FROM restore_admissions WHERE session_id=? AND sequence=?').bind(id,seq).first<{hash:string}>();
   if(!reservation)fail('Restore staging capacity reached. Clean old staging data before retrying.',413);
   if(reservation.hash!==hash)fail('Restore input changed',409);
  };
  const map=async(kind:string,source:string)=>db().prepare('SELECT target_id,data FROM restore_maps WHERE session_id=? AND kind=? AND source_id=?').bind(id,kind,source).first<{target_id:string;data:string}>();
  if(operation==='record'&&method==='POST'){
   const body=await payload(req),record=body.record,seq=body.sequence;if(!Number.isSafeInteger(seq)||seq<0||!record||typeof record!=='object')fail('Invalid restore record');
   if(seq>150000)fail('Restore record limit exceeded',413);const serialized=JSON.stringify(record),hash=await digest(serialized);
   if(seq<state.next){const old=await db().prepare('SELECT hash FROM restore_records WHERE session_id=? AND sequence=?').bind(id,seq).first<{hash:string}>();if(old?.hash===hash)return json({ok:true,next:state.next});fail('Restore input changed',409)}
   if(record.type==='end'&&state.state==='ready'&&record.records===state.next&&record.sha256===state.chain)return json({ok:true,ready:true});
   if(state.state!=='uploading'||seq!==state.next)fail('Restore record is out of order',409);
   if(record.type==='end'){
    if(record.records!==seq||record.sha256!==state.chain)fail('Backup integrity check failed');
    await db().prepare("UPDATE restore_sessions SET state='ready' WHERE id=? AND user_id=? AND next=?").bind(id,user.id,seq).run();return json({ok:true,ready:true});
   }
   if(!['header','collection','collection-image','preference','blob','item','attachment','revision','health'].includes(record.type))fail('Unknown backup record');
   if(seq===0){if(record.type!=='header'||record.format!=='oriva-complete-backup'||record.version!==1||!/^[-0-9a-f]{36}$/.test(record.sourceOwner))fail('Unsupported backup');}
   else if(record.type==='header')fail('Unexpected backup header');
   if(['item','revision'].includes(record.type)){
    const candidate=record.type==='item'?record.row:typeof record.row?.snapshot==='string'?JSON.parse(record.row.snapshot):record.row?.snapshot;if(!candidate||!['link','file','article','snippet'].includes(candidate.kind))fail('Invalid backup item');
    itemInput(candidate.kind==='link'?{...candidate,tags:typeof candidate.tags==='string'?JSON.parse(candidate.tags):candidate.tags}:{...candidate,url:'https://placeholder.oriva.invalid/',tags:typeof candidate.tags==='string'?JSON.parse(candidate.tags):candidate.tags});contentBody(candidate.body);
    const revision=Number(record.type==='item'?candidate.revision:record.row.revision);if(!Number.isSafeInteger(revision)||revision<1)fail('Invalid backup revision');
   }
   if(record.type==='preference')preferenceInput(JSON.parse(record.row?.data||'null'));
   if(['item','collection'].includes(record.type)&&(!record.row||typeof record.row.id!=='string'||record.row.id.length>64))fail('Invalid backup identity');
   let stored=record;
   if(record.type==='blob'){
    let bytes:Uint8Array<ArrayBuffer>;try{bytes=Uint8Array.from(atob(String(record.data)),c=>c.charCodeAt(0))}catch{fail('Invalid backup encoding')}
    if(bytes.length>1048576||!Number.isInteger(record.chunk)||!Number.isInteger(record.chunks)||record.chunks<1||record.chunks>25||record.chunk<0||record.chunk>=record.chunks||!Number.isSafeInteger(record.size)||record.size<0||record.size>MAX_FILE_BYTES||record.chunks!==Math.max(1,Math.ceil(record.size/1048576))||!['file','image'].includes(record.objectKind)||await hex(await crypto.subtle.digest('SHA-256',bytes))!==record.sha256)fail('Invalid backup object');
    const prefix=state.source_owner+'/';if(!String(record.sourceKey).startsWith(prefix)||!new RegExp('^(?:files/)?[0-9a-f-]{36}$').test(record.sourceKey.slice(prefix.length)))fail('Invalid backup object reference');
    await reserve(seq,hash,enc.encode(JSON.stringify({...record,data:undefined})).byteLength+512,bytes.length);
    let mapping=await map('blob',record.sourceKey);if(!mapping){const target=crypto.randomUUID();await db().prepare('INSERT OR IGNORE INTO restore_maps(session_id,kind,source_id,target_id,data) VALUES(?,?,?,?,?)').bind(id,'blob',record.sourceKey,target,JSON.stringify({kind:record.objectKind,mime:record.mime,size:record.size,chunks:record.chunks})).run();mapping=await map('blob',record.sourceKey);if(!mapping)fail('Could not stage object mapping',409);}
    const chunkKey=user.id+'/restore/'+id+'/'+mapping.target_id+'/'+record.chunk+'-'+hash;await bucket().put(chunkKey,bytes,{httpMetadata:{contentType:'application/octet-stream'}});stored={...record,data:undefined,chunkKey};const current=await db().prepare('SELECT cleanup_state,created FROM restore_sessions WHERE id=? AND user_id=?').bind(id,user.id).first<{cleanup_state:string;created:number}>();if(!current||current.cleanup_state||current.created<=now()-restoreTTL){await bucket().delete(chunkKey);fail('Restore staging was cleaned. Stage the backup again.',410);}
   }else {
    await reserve(seq,hash,enc.encode(serialized).byteLength+512,0);
    if(['item','collection'].includes(record.type)){
    if(!await map(record.type,record.row.id))await db().prepare('INSERT OR IGNORE INTO restore_maps(session_id,kind,source_id,target_id,data) VALUES(?,?,?,?,?)').bind(id,record.type,record.row.id,crypto.randomUUID(),'{}').run();
   }
   }
   const chain=await digest(state.chain+'\n'+serialized),result=await db().batch([db().prepare("INSERT INTO restore_records(session_id,sequence,type,data,hash) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM restore_sessions WHERE id=? AND user_id=? AND next=? AND state='uploading' AND cleanup_state='')").bind(id,seq,record.type,JSON.stringify(stored),hash,id,user.id,seq),db().prepare('UPDATE restore_sessions SET next=next+1,chain=?,source_owner=CASE WHEN ?=0 THEN ? ELSE source_owner END WHERE id=? AND user_id=? AND next=? AND cleanup_state=\'\' AND state=\'uploading\'').bind(chain,seq,record.sourceOwner||'',id,user.id,seq)]);if(!result[1].meta.changes){const accepted=await db().prepare('SELECT hash FROM restore_records WHERE session_id=? AND sequence=?').bind(id,seq).first<{hash:string}>();if(accepted?.hash===hash){const current=await db().prepare('SELECT next FROM restore_sessions WHERE id=? AND user_id=?').bind(id,user.id).first<{next:number}>();return json({ok:true,next:current?.next})}fail('Restore session changed',409)}return json({ok:true,next:seq+1});
  }
  if(operation==='preview'&&method==='GET'){
   const counts=(await db().prepare('SELECT type,COUNT(*) n FROM restore_records WHERE session_id=? GROUP BY type').bind(id).all()).results;
   const conflicts=(await db().prepare("SELECT json_extract(r.data,'$.row.title') title,json_extract(r.data,'$.row.url') url FROM restore_records r JOIN items i ON i.user_id=? AND i.url=json_extract(r.data,'$.row.url') WHERE r.session_id=? AND r.type='item' AND json_extract(r.data,'$.row.kind')='link' LIMIT 100").bind(user.id,id).all()).results;
   return json({state:state.state,cleanupState:state.cleanup_state,expires:state.created+restoreTTL,counts,conflicts,policy:'keep-existing',position:state.position,next:state.next});
  }
  if(operation==='rollback'&&method==='POST'){
   const body=await payload(req);if(body.confirm!==true)fail('Restore rollback confirmation required');
   await db().batch([db().prepare('UPDATE items SET deleted_at=?,updated=?,revision=revision+1,change_seq=(SELECT library_revision+1 FROM users WHERE id=items.user_id) WHERE user_id=? AND restore_session=? AND deleted_at=0').bind(now(),now(),user.id,id),db().prepare("UPDATE restore_sessions SET state='rolled-back' WHERE id=? AND user_id=?").bind(id,user.id),changed(user.id)]);return json({ok:true,policy:'imported-items-moved-to-recoverable-trash'});
  }
  if(operation==='commit'&&method==='POST'){
   const body=await payload(req);if(body.confirm!==true||body.policy!=='keep-existing')fail('Preview and confirm keep-existing policy before restoring');if(!['ready','committing','complete'].includes(state.state))fail('Restore is not ready',409);if(state.state==='complete')return json({done:true,position:state.position});
   const next=await db().prepare('SELECT sequence,type,data FROM restore_records WHERE session_id=? AND sequence>=? ORDER BY sequence LIMIT 1').bind(id,state.position).first<{sequence:number;type:string;data:string}>();
   if(!next){
    // Preferences can contain internal URLs. Apply them after all blobs and
    // items, including when reading older backups that list preferences first.
    const entries=(await db().prepare("SELECT data FROM restore_records WHERE session_id=? AND type='preference' ORDER BY sequence").bind(id).all<{data:string}>()).results;
    for(const entry of entries){const preferences=preferenceInput(JSON.parse(JSON.parse(entry.data).row.data));if(Array.isArray(preferences.favoriteCollections)){const favorites:string[]=[];for(const sourceId of preferences.favoriteCollections){const mapping=await map('collection',sourceId);if(mapping)favorites.push(mapping.target_id)}preferences.favoriteCollections=Array.from(new Set(favorites));}const data=await remapBackupText(JSON.stringify(preferences),state.source_owner,map);await db().prepare('INSERT OR IGNORE INTO preferences(user_id,data,revision) VALUES(?,?,1)').bind(user.id,data).run();}
    await db().prepare("UPDATE restore_sessions SET state='complete' WHERE id=? AND user_id=?").bind(id,user.id).run();return json({done:true,position:state.position});}
   const record=JSON.parse(next.data),row=record.row;
   const imageMappings=new Map<string,string>();if(['item','revision','attachment','collection-image'].includes(record.type)){const rows=await db().prepare("SELECT source_id,target_id FROM restore_maps WHERE session_id=? AND kind='blob'").bind(id).all<{source_id:string,target_id:string}>();for(const row of rows.results)imageMappings.set(row.source_id,row.target_id)}
   const mappedImage=async(image:string)=>{if(!image)return '';const target=imageMappings.get(state.source_owner+'/'+image),mapped=target?{target_id:target}:null;if(!mapped)fail('Backup image bytes are missing');return mapped.target_id};
   const mappedBody=(body:unknown)=>remapBackupText(contentBody(body),state.source_owner,map);
   if(record.type==='blob'&&record.chunk===record.chunks-1){
    const mapping=await map('blob',record.sourceKey);if(!mapping)fail('Missing object mapping');const metadata=JSON.parse(mapping.data),chunks=(await db().prepare("SELECT data FROM restore_records WHERE session_id=? AND type='blob' AND json_extract(data,'$.sourceKey')=? ORDER BY CAST(json_extract(data,'$.chunk') AS INTEGER)").bind(id,record.sourceKey).all<{data:string}>()).results;
    if(chunks.length!==record.chunks)fail('Backup object is incomplete');const bytes=new Uint8Array(record.size);let offset=0;for(let i=0;i<chunks.length;i++){const chunk=JSON.parse(chunks[i].data);if(chunk.chunk!==i||chunk.size!==record.size)fail('Backup object order is invalid');const stored=await bucket().get(chunk.chunkKey);if(!stored)fail('Staged object is missing');const data=new Uint8Array(await new Response(stored.body).arrayBuffer());if(offset+data.length>bytes.length||hex(await crypto.subtle.digest('SHA-256',data))!==chunk.sha256)fail('Staged object failed integrity check');bytes.set(data,offset);offset+=data.length}if(offset!==bytes.length)fail('Backup object length mismatch');if(metadata.kind==='image'){const mime=String(metadata.mime),valid=mime==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:mime==='image/webp'&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';if(!valid||bytes.length>2_000_000)fail('Invalid image in backup');}await storeObject(user.id,user.id+'/'+(metadata.kind==='file'?'files/':'')+mapping.target_id,bytes,{httpMetadata:{contentType:metadata.kind==='image'?metadata.mime:'application/octet-stream'}},{session:id,source:record.sourceKey});
   }else if(record.type==='collection'){
    const name=value(row.name,80);if(!name)fail('Invalid collection in backup');const existing=await db().prepare('SELECT id FROM collections WHERE user_id=? AND name=?').bind(user.id,name).first<{id:string}>(),mapping=await map('collection',row.id);if(!mapping)fail('Missing collection mapping');
    if(existing&&existing.id!==mapping.target_id)await db().prepare('UPDATE restore_maps SET target_id=?,data=? WHERE session_id=? AND kind=? AND source_id=?').bind(existing.id,'{"skipped":true}',id,'collection',row.id).run();else if(existing){}else{const parent=row.parent_id?(await map('collection',row.parent_id))?.target_id||'':'';await db().prepare('INSERT OR IGNORE INTO collections(id,user_id,name,parent_id,icon,color,image,created,updated) VALUES(?,?,?,?,?,?,?,?,?)').bind(mapping.target_id,user.id,name,parent,value(row.icon,40),/^#[a-f0-9]{6}$/i.test(row.color)?row.color:'#a98af4','',Number(row.created)||now(),Number(row.updated)||now()).run();}
    // Collection images are assigned when their blob has been reconstructed.
   }else if(record.type==='collection-image'){const mapping=await map('collection',row.id);if(!mapping)fail('Missing collection in backup');if(!JSON.parse(mapping.data).skipped)await db().prepare('UPDATE collections SET image=? WHERE id=? AND user_id=?').bind(await mappedImage(row.image),mapping.target_id,user.id).run();
   }else if(record.type==='preference'){
    // Deferred until finalization so forward file/image references are valid.
   }else if(record.type==='item'){
    const mapping=await map('item',row.id);if(!mapping)fail('Missing item mapping');const kind=['file','article','snippet','link'].includes(row.kind)?row.kind:'link';const url=kind==='link'?normalizeUrl(row.url):kind==='file'?'/api/files/'+mapping.target_id:'https://oriva.invalid/content/'+mapping.target_id;
    const existing=await db().prepare('SELECT id FROM items WHERE user_id=? AND url=?').bind(user.id,url).first<{id:string}>();if(existing){if(existing.id!==mapping.target_id)await db().prepare('UPDATE restore_maps SET data=? WHERE session_id=? AND kind=? AND source_id=?').bind('{"skipped":true}',id,'item',row.id).run();}
    else{const fileMapping=kind==='file'?await map('blob',state.source_owner+'/files/'+row.file_key):null,fileKey=fileMapping?.target_id||'';if(kind==='file'&&(!fileMapping||JSON.parse(fileMapping.data).kind!=='file'||JSON.parse(fileMapping.data).size!==Number(row.file_size)))fail('Backup file bytes are missing or have a different length');if(!Number.isSafeInteger(Number(row.revision))||Number(row.revision)<1)fail('Invalid backup revision');const metadata=itemInput({...row,url:kind==='link'?url:'https://placeholder.oriva.invalid/',tags:typeof row.tags==='string'?JSON.parse(row.tags):row.tags});
     const result=await db().batch([db().prepare(`INSERT OR IGNORE INTO items(id,user_id,url,title,note,tags,collection,status,favorite,image,kind,file_key,file_name,file_size,file_type,created,updated,revision,body,language,pinned,deleted_at,rating,restore_session) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM items WHERE user_id=?)<10000 AND EXISTS(SELECT 1 FROM restore_sessions WHERE id=? AND user_id=? AND state IN ('ready','committing'))`).bind(mapping.target_id,user.id,url,metadata.title,metadata.note,metadata.tags,metadata.collection,metadata.status,metadata.favorite,await mappedImage(row.image),kind,fileKey,kind==='file'?downloadName(String(row.file_name||'')):value(row.file_name,240),Math.max(0,Number(row.file_size)||0),value(row.file_type,150),Number(row.created)||now(),Number(row.updated)||now(),Math.max(1,Number(row.revision)||1),await mappedBody(row.body),value(row.language,40),row.pinned?1:0,Math.max(0,Number(row.deleted_at)||0),Math.min(5,Math.max(0,Number(row.rating)||0)),id,user.id,id,user.id),markItem(user.id,mapping.target_id),changed(user.id)]);
     if(!result[0].meta.changes){const retried=await db().prepare('SELECT id FROM items WHERE id=? AND user_id=? AND restore_session=?').bind(mapping.target_id,user.id,id).first();if(!retried)fail('Restore paused at the library quota. Existing content is unchanged.',422);}
    }
   }else if(record.type==='health'){
    const mapping=await map('item',row.item_id);if(!mapping)fail('Missing health item in backup');if(!JSON.parse(mapping.data).skipped){if(!['healthy','missing','restricted','rate-limited','inconclusive'].includes(row.state))fail('Invalid backup health report');await db().prepare('INSERT OR IGNORE INTO item_health(item_id,user_id,state,http_status,checked,missing_count) VALUES(?,?,?,?,?,?)').bind(mapping.target_id,user.id,row.state,Math.min(599,Math.max(0,Number(row.http_status)||0)),Number(row.checked)||now(),Math.max(0,Number(row.missing_count)||0)).run();}
   }else if(record.type==='attachment'||record.type==='revision'){
    const mapping=await map('item',row.item_id);if(!mapping)fail('Missing parent item in backup');if(!JSON.parse(mapping.data).skipped){if(record.type==='attachment'){const image=await mappedImage(row.id);if(!image)fail('Backup attachment bytes are missing');await db().prepare('INSERT OR IGNORE INTO attachments(id,user_id,item_id,mime,created) VALUES(?,?,?,?,?)').bind(image,user.id,mapping.target_id,value(row.mime,100),Number(row.created)||now()).run();}else{const snapshot=typeof row.snapshot==='string'?JSON.parse(row.snapshot):row.snapshot;snapshot.id=mapping.target_id;snapshot.user_id=user.id;snapshot.image=await mappedImage(snapshot.image);if(snapshot.kind==='file'){snapshot.url='/api/files/'+mapping.target_id;snapshot.file_key=(await map('blob',state.source_owner+'/files/'+snapshot.file_key))?.target_id||'';}else if(snapshot.kind==='article'||snapshot.kind==='snippet')snapshot.url='https://oriva.invalid/content/'+mapping.target_id;snapshot.body=await mappedBody(snapshot.body);await db().prepare('INSERT OR IGNORE INTO item_revisions(item_id,user_id,revision,snapshot,created) VALUES(?,?,?,?,?)').bind(mapping.target_id,user.id,Number(row.revision),JSON.stringify(snapshot),Number(row.created)||now()).run();}}
   }
   await db().batch([db().prepare("UPDATE restore_sessions SET state='committing',position=? WHERE id=? AND user_id=? AND position=? AND state IN ('ready','committing')").bind(next.sequence+1,id,user.id,state.position),changed(user.id)]);
   return json({done:false,position:next.sequence+1,next:state.next});
  }
 }

 if(path==='collections'&&method==='GET'){const result=await db().prepare('SELECT * FROM collections WHERE user_id=? ORDER BY name,id').bind(user.id).all();return json({collections:result.results});}
 if((path==='collections'||path.startsWith('collections/'))&&['POST','PATCH'].includes(method)){
  const body=await payload(req),id=method==='POST'?crypto.randomUUID():path.slice(12),existing=method==='PATCH'?await db().prepare('SELECT * FROM collections WHERE id=? AND user_id=?').bind(id,user.id).first<Record<string,unknown>>():null;
  if(method==='PATCH'&&!existing)fail('Collection not found',404);
  if(existing&&body.revision!==existing.revision)fail('Collection changed. Reload before saving.',409);
  const name=value(body.name??existing?.name,80),parent=value(body.parent_id??existing?.parent_id,64),icon=value(body.icon??existing?.icon,40)||'folder',color=value(body.color??existing?.color,7)||'#a98af4';
  if(!name||!/^#[0-9a-f]{6}$/i.test(color))fail('Use a collection name and a valid color');
  if(parent){const ancestor=await db().prepare('WITH RECURSIVE parents(id,parent_id) AS (SELECT id,parent_id FROM collections WHERE id=? AND user_id=? UNION SELECT c.id,c.parent_id FROM collections c JOIN parents p ON c.id=p.parent_id WHERE c.user_id=?) SELECT id FROM parents').bind(parent,user.id,user.id).all<{id:string}>();if(!ancestor.results.length)fail('Parent collection not found',404);if(parent===id||ancestor.results.some(x=>x.id===id))fail('Collection nesting cannot contain a cycle');}
  const image=await imageUpload(body,user.id,String(existing?.image||''));
  try{
   if(existing){const batch=[db().prepare('WITH RECURSIVE ancestors(id,parent_id) AS (SELECT id,parent_id FROM collections WHERE id=? AND user_id=? UNION SELECT c.id,c.parent_id FROM collections c JOIN ancestors a ON c.id=a.parent_id WHERE c.user_id=?) UPDATE collections SET name=?,parent_id=?,icon=?,color=?,image=?,updated=?,revision=revision+1 WHERE id=? AND user_id=? AND revision=? AND NOT EXISTS(SELECT 1 FROM ancestors WHERE id=?)').bind(parent,user.id,user.id,name,parent,icon,color,image,now(),id,user.id,body.revision,id)];
    // Rename is serialized with item revisions and keeps every association.
    if(name!==existing.name){batch.push(db().prepare("INSERT OR IGNORE INTO item_revisions(item_id,user_id,revision,snapshot,created) SELECT id,user_id,revision,json_object('id',id,'title',title,'url',url,'note',note,'tags',tags,'collection',collection,'status',status,'favorite',favorite,'image',image,'kind',kind,'body',body,'language',language,'pinned',pinned,'rating',rating,'deleted_at',deleted_at),? FROM items WHERE user_id=? AND collection=? AND EXISTS(SELECT 1 FROM collections WHERE id=? AND user_id=? AND revision=?)").bind(now(),user.id,existing.name,id,user.id,Number(body.revision)+1));batch.push(db().prepare('UPDATE items SET collection=?,revision=revision+1,updated=?,change_seq=(SELECT library_revision+1 FROM users WHERE id=items.user_id) WHERE user_id=? AND collection=? AND EXISTS(SELECT 1 FROM collections WHERE id=? AND user_id=? AND revision=?)').bind(name,now(),user.id,existing.name,id,user.id,Number(body.revision)+1));}
    batch.push(changed(user.id));const result=await db().batch(batch);if(!result[0].meta.changes)fail('Collection changed. Reload before saving.',409);
   }else{const result=await db().batch([db().prepare('INSERT INTO collections(id,user_id,name,parent_id,icon,color,image,created,updated) SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM collections WHERE user_id=?)<1000').bind(id,user.id,name,parent,icon,color,image,now(),now(),user.id),changed(user.id)]);if(!result[0].meta.changes)fail('Collection limit reached',422);}
  }catch(e){if(image!==existing?.image)await removeImage(user.id,image);throw e;}
  return json({collection:await db().prepare('SELECT * FROM collections WHERE id=? AND user_id=?').bind(id,user.id).first()},existing?200:201);
 }
 if(path==='preferences'&&method==='GET'){const row=await db().prepare('SELECT data,revision FROM preferences WHERE user_id=?').bind(user.id).first<{data:string,revision:number}>();return json(row?{preferences:JSON.parse(row.data),revision:row.revision}:{preferences:{},revision:0});}
 if(path==='preferences'&&method==='PATCH'){
  const body=await payload(req);if(!Number.isSafeInteger(body.revision)||body.revision<0)fail('Preference revision required',428);
  const data=JSON.stringify(preferenceInput(body.preferences));
  const statement=body.revision===0?db().prepare('INSERT OR IGNORE INTO preferences(user_id,data,revision) VALUES(?,?,1)').bind(user.id,data):db().prepare('UPDATE preferences SET data=?,revision=revision+1 WHERE user_id=? AND revision=?').bind(data,user.id,body.revision);
  const result=await db().batch([statement,changed(user.id)]);if(!result[0].meta.changes)fail('Preferences changed on another device',409);
  return json({ok:true,revision:body.revision+1});
 }
 const history=/^items\/([0-9a-f-]{36})\/revisions(?:\/(\d+))?$/.exec(path);
 if(history&&method==='GET'){
  const item=await db().prepare('SELECT id FROM items WHERE id=? AND user_id=?').bind(history[1],user.id).first();if(!item)fail('Item not found',404);
  if(history[2]){const row=await db().prepare('SELECT snapshot FROM item_revisions WHERE item_id=? AND user_id=? AND revision=?').bind(history[1],user.id,Number(history[2])).first<{snapshot:string}>();if(!row)fail('Revision not found',404);return json({snapshot:decode(JSON.parse(row.snapshot))});}
  const rows=await db().prepare("SELECT revision,created,json_extract(snapshot,'$.title') title FROM item_revisions WHERE item_id=? AND user_id=? ORDER BY revision DESC LIMIT 100").bind(history[1],user.id).all();return json({revisions:rows.results});
 }
 const embed=/^items\/([0-9a-f-]{36})\/images$/.exec(path);
 if(embed&&method==='POST'){
  const item=await db().prepare('SELECT id FROM items WHERE id=? AND user_id=? AND deleted_at=0').bind(embed[1],user.id).first();if(!item)fail('Item not found',404);
  const body=await payload(req);if(!body.imageData)fail('Choose an image');const id=await imageUpload(body,user.id);
  try{const result=await db().batch([db().prepare('INSERT INTO attachments(id,user_id,item_id,mime,created) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM items WHERE id=? AND user_id=? AND deleted_at=0)').bind(id,user.id,embed[1],String(body.imageData).slice(5).split(';')[0],now(),embed[1],user.id),changed(user.id)]);if(!result[0].meta.changes)fail('Item not found',404);}catch(e){await removeImage(user.id,id);throw e;}
  return json({id,url:'/api/images/'+id},201);
 }
 if(path==='files'&&method==='POST'){
  let name='';try{name=decodeURIComponent(req.headers.get('x-file-name')||'');}catch{fail('Invalid filename');}name=downloadName(name);

  const bytes=await uploadBytes(req),id=crypto.randomUUID(),t=now(),key=user.id+'/files/'+id,url='/api/files/'+id;
  const mime=value(req.headers.get('x-file-type'),150)||'application/octet-stream';
  let title=name;try{title=value(decodeURIComponent(req.headers.get('x-file-title')||''),240)||name;}catch{fail('Invalid file title');}
  await storeObject(user.id,key,bytes,{httpMetadata:{contentType:'application/octet-stream'}});
  try{const result=await db().batch([db().prepare('INSERT INTO items (id,user_id,url,title,note,tags,collection,status,favorite,image,kind,file_key,file_name,file_size,file_type,created,updated) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM items WHERE user_id=?)<10000').bind(id,user.id,url,title,'','[]','','inbox',0,'','file',id,name,bytes.length,mime,t,t,user.id),markItem(user.id,id),changed(user.id)]);if(!result[0].meta.changes)fail('Library limit reached (10,000 items)',422);}catch(e){await deleteStoredObject(key).catch(()=>{});throw e;}
  return json({item:{id,url,title,note:'',tags:[],collection:'',status:'inbox',favorite:false,image:'',kind:'file',file_key:id,file_name:name,file_size:bytes.length,file_type:mime,created:t,updated:t,revision:1}},201);
 }
 if(path.startsWith('files/')&&method==='GET'){
  const id=path.slice(6);if(!/^[0-9a-f-]{36}$/.test(id))fail('File not found',404);
  const record=await db().prepare("SELECT file_key,file_name,file_size FROM items WHERE user_id=? AND id=? AND kind='file'").bind(user.id,id).first<{file_key:string,file_name:string,file_size:number}>();if(!record)fail('File not found',404);
  const file=await bucket().get(user.id+'/files/'+record.file_key);if(!file)fail('File not found',404);
  return new Response(file.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename=\"download\"; filename*=UTF-8''"+encodeURIComponent(record.file_name).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase()),'Content-Length':String(record.file_size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"sandbox; default-src 'none'"}});
 }
 if(path.startsWith('images/')&&method==='GET'){const id=path.slice(7);if(!/^[0-9a-f-]{36}$/.test(id))fail('Image not found',404);const owner=await db().prepare("SELECT id FROM items WHERE user_id=? AND image=? UNION SELECT id FROM attachments WHERE user_id=? AND id=? UNION SELECT id FROM collections WHERE user_id=? AND image=? UNION SELECT item_id id FROM item_revisions WHERE user_id=? AND json_extract(snapshot,'$.image')=?").bind(user.id,id,user.id,id,user.id,id,user.id,id).first();if(!owner)fail('Image not found',404);const image=await bucket().get(user.id+'/'+id);if(!image)fail('Image not found',404);return new Response(image.body,{headers:{'Content-Type':image.httpMetadata?.contentType||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'}});}
 if(path==='library'&&method==='GET'){
  const params=new URL(req.url).searchParams, limit=Math.min(200,Math.max(1,Number(params.get('limit'))||100));
  const cursor=params.get('cursor')||'', match=/^(\d+)\.([0-9a-f-]{36})$/.exec(cursor);
  if(cursor&&!match)fail('Invalid page cursor');
  const expected=params.get('version'),known=params.get('sinceVersion'),after=Number(params.get('afterVersion')),delta=params.has('afterVersion');if(delta&&(!Number.isSafeInteger(after)||after<0))fail('Invalid sync version');
  const read=db().prepare('SELECT library_revision,purge_revision FROM users WHERE id=?').bind(user.id);
  const list=db().prepare(`SELECT ${summaryColumns} FROM items WHERE user_id=? ${delta?'AND (change_seq>? OR ?<(SELECT purge_revision FROM users WHERE id=items.user_id))':''} ${match?'AND (updated<? OR (updated=? AND id<?))':''} ORDER BY updated DESC,id DESC LIMIT ?`).bind(user.id,...(delta?[after,after]:[]),...(match?[Number(match[1]),Number(match[1]),match[2]]:[]),limit+1);
  const result=await db().batch([read,list]);
  const version=Number((result[0].results[0] as {library_revision:number}).library_revision);
  if(expected!==null&&Number(expected)!==version)return json({error:'Library changed. Restart synchronization.',code:'sync_restart'},409);
  if(known!==null&&Number(known)===version)return json({unchanged:true,version});
  const rows=result[1].results as Record<string,unknown>[],more=rows.length>limit,items=rows.slice(0,limit).map(decode),last=items[items.length-1];
  return json({items,version,delta:delta&&after>=Number((result[0].results[0] as {purge_revision:number}).purge_revision),nextCursor:more?last.updated+'.'+last.id:null});
 }
 if(path.startsWith('items/')&&method==='GET'){
  const item=await db().prepare(`SELECT ${itemColumns} FROM items WHERE id=? AND user_id=?`).bind(path.slice(6),user.id).first<Record<string,unknown>>();
  if(!item)fail('Item not found',404);return json({item:decode(item)});
 }
 if(path==='items'&&method==='GET'){
  // Preserve 1.5.3's response shape; never silently truncate an oversized library.
  const budget=await db().prepare("SELECT COUNT(*) n,COALESCE(SUM(length(CAST(json_quote(note) AS BLOB))+length(CAST(json_quote(title) AS BLOB))+length(CAST(json_quote(url) AS BLOB))+length(CAST(json_quote(tags) AS BLOB))+length(CAST(json_quote(collection) AS BLOB))+length(CAST(json_quote(file_name) AS BLOB))+length(CAST(json_quote(file_type) AS BLOB))+length(CAST(json_quote(image) AS BLOB))+1024),0) bytes FROM items WHERE user_id=? AND deleted_at=0 AND kind IN ('link','file')").bind(user.id).first<{n:number,bytes:number}>();
  if((budget?.n||0)>10000||(budget?.bytes||0)>24*1024*1024)return json({error:'This library needs a newer Oriva client. Update Oriva to synchronize all items safely.',code:'client_update_required'},426);
  const result=await db().prepare(`SELECT ${legacyColumns} FROM items WHERE user_id=? AND deleted_at=0 AND kind IN ('link','file') ORDER BY updated DESC,id DESC`).bind(user.id).all();return json({items:result.results.map(decode)});
 }
 if(path==='items'&&method==='POST'){
  const body=await payload(req),id=crypto.randomUUID(),kind=['article','snippet'].includes(body.kind)?body.kind:'link',b=itemInput(kind==='link'?body:{...body,url:'https://oriva.invalid/content/'+id}),t=now(),content=contentBody(body.body),language=kind==='snippet'?value(body.language,40):'';await ensureCollection(user.id,b.collection);
  const existing=await db().prepare('SELECT id FROM items WHERE user_id=? AND url=?').bind(user.id,b.url).first();if(existing)fail('This link is already in your library',409);
  const image=await imageUpload(body,user.id);try{const result=await db().batch([db().prepare('INSERT INTO items (id,user_id,url,title,note,tags,collection,status,favorite,image,created,updated,kind,body,language,pinned,rating) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM items WHERE user_id=?)<10000').bind(id,user.id,b.url,b.title,b.note,b.tags,b.collection,b.status,b.favorite,image,t,t,kind,content,language,body.pinned?1:0,Math.min(5,Math.max(0,Number(body.rating)||0)),user.id),markItem(user.id,id),changed(user.id)]);if(!result[0].meta.changes)fail('Library limit reached (10,000 items)',422);}catch(e){await removeImage(user.id,image);throw e;}return json({item:{...b,id,image,kind,body:content,language,pinned:!!body.pinned,deleted_at:0,rating:Math.min(5,Math.max(0,Number(body.rating)||0)),tags:JSON.parse(b.tags),favorite:!!b.favorite,created:t,updated:t,revision:1}},201);
 }
 if(path.startsWith('items/')&&['PATCH','DELETE'].includes(method)){
  const id=path.slice(6),exists=await db().prepare('SELECT * FROM items WHERE id=? AND user_id=?').bind(id,user.id).first<Record<string,unknown>>();if(!exists)fail('Item not found',404);
  const body=await payload(req),revision=body.revision;
  // Old clients resend an indistinguishable full snapshot. Reject rather than guess intent.
  if(!Number.isSafeInteger(revision)||revision<1)return json({error:'Update Oriva before changing this item. Your saved content is unchanged.',code:'revision_required'},428);
  if(Number(exists.revision)!==revision)return json({error:'This item changed on another device. Your draft is kept; reload the latest version before retrying.',code:'revision_conflict',current:decode(exists)},409);
  if(method==='DELETE'){
   const trash=()=>db().prepare('UPDATE items SET deleted_at=?,updated=?,revision=revision+1,change_seq=(SELECT library_revision+1 FROM users WHERE id=items.user_id) WHERE id=? AND user_id=? AND revision=?').bind(now(),now(),id,user.id,revision);
   let historySaved=true,result;try{result=await db().batch([snapshotStatement(exists,user.id),trash(),changed(user.id)]);}catch(e){if(!/Account content storage limit reached/.test((e as Error).message))throw e;historySaved=false;result=await db().batch([trash(),changed(user.id)]);}
   if(!result[historySaved?1:0].meta.changes)fail('Item changed. Reload before deleting.',409);
   return json({ok:true,trashed:true,historySaved});
  }
  if(body.deleted===false&&Number(exists.deleted_at)>0&&Object.keys(body).every(key=>['revision','deleted'].includes(key))){const result=await db().batch([db().prepare('UPDATE items SET deleted_at=0,updated=?,revision=revision+1,change_seq=(SELECT library_revision+1 FROM users WHERE id=items.user_id) WHERE id=? AND user_id=? AND revision=? RETURNING *').bind(now(),id,user.id,revision),changed(user.id)]);if(!result[0].meta.changes)fail('Item changed. Reload before restoring.',409);return json({ok:true,item:decode(result[0].results[0] as Record<string,unknown>)});}
  let restored:Record<string,unknown>|null=null;if(body.restoreRevision!==undefined){const row=await db().prepare('SELECT snapshot FROM item_revisions WHERE item_id=? AND user_id=? AND revision=?').bind(id,user.id,Number(body.restoreRevision)).first<{snapshot:string}>();if(!row)fail('Revision not found',404);restored=JSON.parse(row.snapshot);}
  const merged={...exists,...(restored||{}),tags:JSON.parse(String(restored?.tags??exists.tags)),...body};
  const b=itemInput(exists.kind!=='link'?{...merged,url:'https://placeholder.oriva.invalid/'}:merged);if(exists.kind!=='link')b.url=String(exists.url);await ensureCollection(user.id,b.collection);
  const duplicate=await db().prepare('SELECT id FROM items WHERE user_id=? AND url=? AND id<>?').bind(user.id,b.url,id).first();if(duplicate)fail('This link is already in your library',409);
  let updated:Record<string,unknown>|null=null;
  const image=restored?String(restored.image||''):await imageUpload(body,user.id,String(exists.image));const content=contentBody(merged.body),language=value(merged.language,40),pinned=merged.pinned?1:0,rating=Math.min(5,Math.max(0,Number(merged.rating)||0)),deleted=body.deleted===false?0:Number(exists.deleted_at);
  try{
   const result=await db().batch([snapshotStatement(exists,user.id),db().prepare('UPDATE items SET url=?,title=?,note=?,tags=?,collection=?,status=?,favorite=?,image=?,updated=?,body=?,language=?,pinned=?,rating=?,deleted_at=?,revision=revision+1,change_seq=(SELECT library_revision+1 FROM users WHERE id=items.user_id) WHERE id=? AND user_id=? AND revision=? RETURNING *').bind(b.url,b.title,b.note,b.tags,b.collection,b.status,b.favorite,image,now(),content,language,pinned,rating,deleted,id,user.id,revision),changed(user.id)]);
   if(!result[1].meta.changes)fail('Item changed while saving. Your draft is kept; reload before retrying.',409);updated=result[1].results[0] as Record<string,unknown>;
  }catch(e){if(!restored&&image!==exists.image)await removeImage(user.id,image);throw e;}
  // Historical images remain reachable through the owner's revisions.
  return json({ok:true,item:decode(updated!)});
 }
 if(path==='import'&&method==='POST'){
  const body=await payload(req);if(!Array.isArray(body.items)||body.items.length>500)fail('Import up to 500 links at a time');
  const entries=body.items.filter((row:Record<string,unknown>)=>!row.kind||row.kind==='link').map((raw:Record<string,unknown>)=>({...itemInput(raw),id:crypto.randomUUID(),collectionId:crypto.randomUUID(),created:now(),updated:now()}));
  let added=0;
  for(let position=0;position<entries.length;){
   const group=[];let size=0;while(position<entries.length&&(size<250000||!group.length)){const entry=entries[position++];group.push(entry);size+=enc.encode(JSON.stringify(entry)).byteLength;}
   const serialized=JSON.stringify(group);
   const result=await db().batch([
    db().prepare("INSERT OR IGNORE INTO collections(id,user_id,name,created,updated) SELECT json_extract(value,'$.collectionId'),?,json_extract(value,'$.collection'),?,? FROM json_each(?) WHERE json_extract(value,'$.collection')<>'' GROUP BY json_extract(value,'$.collection')").bind(user.id,now(),now(),serialized),
    db().prepare("INSERT OR IGNORE INTO items(id,user_id,url,title,note,tags,collection,status,favorite,created,updated,change_seq) SELECT json_extract(value,'$.id'),?,json_extract(value,'$.url'),json_extract(value,'$.title'),json_extract(value,'$.note'),json_extract(value,'$.tags'),json_extract(value,'$.collection'),json_extract(value,'$.status'),json_extract(value,'$.favorite'),json_extract(value,'$.created'),json_extract(value,'$.updated'),(SELECT library_revision+1 FROM users WHERE id=?) FROM json_each(?) LIMIT max(0,10000-(SELECT COUNT(*) FROM items WHERE user_id=?))").bind(user.id,user.id,serialized,user.id),changed(user.id)]);
   added+=result[1].meta.changes||0;
  }
  return json({added,skipped:entries.length-added});
 }
 return json({error:'Not found'},404);
 }catch(e){const err=e as Error&{status?:number};const storageError=err.message?.match(/Account (?:content|file) storage limit reached/);if(storageError)return json({error:storageError[0],code:'account_storage_limit'},413);if(err.message?.includes('Upload was canceled during cleanup'))return json({error:'Upload was canceled during cleanup',code:'upload_canceled'},409);if(err.status)return json({error:err.message},err.status);console.error('Oriva API failure',err.name);return json({error:'Something went wrong. Please try again'},500);}}
export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;
