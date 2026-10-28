import {call,context,sql,b,files} from './accounts.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const owner=b.data.user.id,cookie=b.cookie;
const group=await call('collections','POST',{name:'Backup parent'},cookie);assert.equal(group.status,201);
const article=await call('items','POST',{kind:'article',title:'Saved article',body:'Original body',collection:'Backup parent',tags:['keep'],favorite:true},cookie);assert.equal(article.status,201);
const imageData='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1X8AAAAASUVORK5CYII=';
assert.equal((await call('collections/'+group.data.collection.id,'PATCH',{revision:1,imageData,icon:'book',color:'#123456'},cookie)).status,200);
await call('collections','POST',{name:'Empty nested collection',parent_id:group.data.collection.id},cookie);
const link=await call('items','POST',{url:'https://backup.test/article#chapter',title:'Link notes',note:'Exact note',tags:['link'],status:'archived'},cookie);assert.equal(link.status,201);
assert.equal((await call('health','POST',{id:link.data.item.id,state:'restricted',http_status:403},cookie)).status,200);
const image=await call('items/'+article.data.item.id+'/images','POST',{imageData},cookie);assert.equal(image.status,201);
await call('items/'+article.data.item.id,'PATCH',{revision:1,body:'![image]('+image.data.url+')\nUpdated body'},cookie);
const bytes=Uint8Array.from({length:1100000},(_,i)=>i%251);
const upload=await context.exports.POST(new Request('https://oriva.test/api/files',{method:'POST',headers:{cookie,origin:'https://oriva.test','content-type':'application/octet-stream','x-file-name':encodeURIComponent('ملف with spaces.bin')},body:bytes}));assert.equal(upload.status,201);
const sourceFile=(await upload.json()).item;
const linkedBody='![image]('+image.data.url+')\nUpdated body\n[download]('+sourceFile.url+')';
assert.equal((await call('items/'+article.data.item.id,'PATCH',{revision:2,body:linkedBody},cookie)).status,200);
assert.equal((await call('items/'+article.data.item.id,'PATCH',{revision:3,body:linkedBody+'\nLatest'},cookie)).status,200);
assert.equal((await context.exports.POST(new Request('https://oriva.test/api/files',{method:'POST',headers:{cookie,origin:'https://oriva.test','x-file-name':'empty.bin'},body:new Uint8Array()}))).status,201);
await call('items','POST',{kind:'snippet',title:'Inert code',language:'javascript',body:'  console.log("never execute");\n'},cookie);
await call('preferences','PATCH',{revision:0,preferences:{view:'compact',widgets:['recent','totals'],favoriteCollections:[group.data.collection.id,'unmapped-synthetic-collection'],download:sourceFile.url,image:image.data.url}},cookie);
const response=await context.exports.GET(new Request('https://oriva.test/api/backup',{headers:{cookie}}));assert.equal(response.status,200);
const records=(await response.text()).trim().split('\n').map(JSON.parse);assert.equal(records[0].format,'oriva-complete-backup');assert.equal(records.at(-1).type,'end');
assert.ok(records.some(x=>x.type==='blob'));assert.ok(records.some(x=>x.type==='revision'));assert.ok(records.some(x=>x.type==='attachment'));
let chain='';for(const record of records.slice(0,-1))chain=createHash('sha256').update(chain+'\n'+JSON.stringify(record)).digest('hex');assert.equal(records.at(-1).sha256,chain);
// Retain compatibility with earlier development backups whose revision was JSON text.
for(const record of records)if(record.type==='revision'){assert.equal(typeof record.row.snapshot,'object');record.row.snapshot=JSON.stringify(record.row.snapshot)}
// Exercise a file link whose destination metadata is a forward reference.
const itemsFirst=records.filter(x=>x.type==='item').sort((a,b)=>Number(b.row.kind==='article')-Number(a.row.kind==='article'));let itemPosition=0;
for(let i=0;i<records.length;i++)if(records[i].type==='item')records[i]=itemsFirst[itemPosition++];
chain='';for(const record of records.slice(0,-1))chain=createHash('sha256').update(chain+'\n'+JSON.stringify(record)).digest('hex');records.at(-1).sha256=chain;
const target=await call('register','POST',{email:'restore-target@example.test',password:'restore-target-strong-password',name:'Restored'});assert.equal(target.status,201);
const started=await call('restore/start','POST',{},target.cookie),session=started.data.id;assert.equal(started.status,201);
let concurrentBlob=false;for(let sequence=0;sequence<records.length;sequence++){const input={sequence,record:records[sequence]};if(input.record.type==='blob'&&!concurrentBlob){const results=await Promise.all([call('restore/'+session+'/record','POST',input,target.cookie),call('restore/'+session+'/record','POST',input,target.cookie)]);for(const result of results)assert.equal(result.status,200,JSON.stringify(result));concurrentBlob=true}else{const result=await call('restore/'+session+'/record','POST',input,target.cookie);assert.equal(result.status,200,JSON.stringify(result))}if(sequence===2)assert.equal((await call('restore/'+session+'/record','POST',input,target.cookie)).status,200,'Replay is idempotent');}
const preview=await call('restore/'+session+'/preview','GET',undefined,target.cookie);assert.equal(preview.data.state,'ready');assert.equal(preview.data.conflicts.length,0);
assert.equal((await call('restore/'+session+'/commit','POST',{confirm:false,policy:'keep-existing'},target.cookie)).status,400);
let done=false;for(let i=0;i<records.length+2&&!done;i++){const result=await call('restore/'+session+'/commit','POST',{confirm:true,policy:'keep-existing'},target.cookie);assert.equal(result.status,200,JSON.stringify(result));done=!!result.data.done;}assert.equal(done,true);
const restored=(await call('library','GET',undefined,target.cookie)).data.items;
assert.equal(restored.length,5);const restoredArticle=restored.find(x=>x.kind==='article'),restoredFile=restored.find(x=>x.kind==='file'&&x.file_size===bytes.length);
assert.equal(restoredArticle.title,'Saved article');assert.equal(restoredArticle.favorite,true);assert.equal(restoredArticle.collection,'Backup parent');assert.notEqual(restoredArticle.id,article.data.item.id);
assert.ok(restoredArticle.body.includes('Updated body'));assert.ok(!restoredArticle.body.includes(image.data.url));
assert.ok(restoredArticle.body.includes(restoredFile.url));assert.ok(!restoredArticle.body.includes(sourceFile.url));
const download=await context.exports.GET(new Request('https://oriva.test'+restoredFile.url,{headers:{cookie:target.cookie}}));assert.equal(download.status,200);assert.equal(createHash('sha256').update(Buffer.from(await download.arrayBuffer())).digest('hex'),createHash('sha256').update(bytes).digest('hex'));
assert.equal(restoredFile.file_name,'ملف with spaces.bin');
const emptyFile=restored.find(x=>x.file_name==='empty.bin');assert.ok(emptyFile);assert.equal((await (await context.exports.GET(new Request('https://oriva.test'+emptyFile.url,{headers:{cookie:target.cookie}}))).arrayBuffer()).byteLength,0);
const groups=(await call('collections','GET',undefined,target.cookie)).data.collections,parent=groups.find(x=>x.name==='Backup parent'),child=groups.find(x=>x.name==='Empty nested collection');assert.equal(child.parent_id,parent.id);assert.equal(parent.color,'#123456');assert.equal(parent.icon,'book');assert.ok(parent.image);
const health=(await call('health','GET',undefined,target.cookie)).data.health;assert.equal(health.length,1);assert.equal(health[0].state,'restricted');assert.equal(health[0].item_id,restored.find(x=>x.kind==='link').id);
const history=await call('items/'+restoredArticle.id+'/revisions','GET',undefined,target.cookie);assert.equal(history.data.revisions.length,3);
assert.ok((await call('items/'+restoredArticle.id+'/revisions/3','GET',undefined,target.cookie)).data.snapshot.body.includes(restoredFile.url));
assert.equal((await call('preferences','GET',undefined,target.cookie)).data.preferences.view,'compact');
assert.deepEqual((await call('preferences','GET',undefined,target.cookie)).data.preferences.favoriteCollections,[parent.id],'Favorite collections must map to destination IDs and omit dangling source references');
const restoredPreferences=(await call('preferences','GET',undefined,target.cookie)).data.preferences;assert.equal(restoredPreferences.download,restoredFile.url);assert.ok(!restoredPreferences.image.includes(image.data.id));
assert.equal((await call('restore/'+session+'/preview','GET',undefined,cookie)).status,404);
// Tampering is detected before any library item is restored.
const bad=await call('restore/start','POST',{},target.cookie);for(let sequence=0;sequence<records.length-1;sequence++){const record=structuredClone(records[sequence]);if(record.type==='item')record.row.title='Tampered';assert.equal((await call('restore/'+bad.data.id+'/record','POST',{sequence,record},target.cookie)).status,200);}
assert.equal((await call('restore/'+bad.data.id+'/record','POST',{sequence:records.length-1,record:records.at(-1)},target.cookie)).status,400);
assert.equal((await call('library','GET',undefined,target.cookie)).data.items.length,5);
await call('restore/'+session+'/rollback','POST',{confirm:true},target.cookie);
assert.ok((await call('library','GET',undefined,target.cookie)).data.items.every(x=>x.deleted_at>0));
assert.equal((await call('library','GET',undefined,cookie)).data.items.length,5,'Source account is unchanged');
console.log('PASS complete streamed backup and isolated restore: multi-chunk file bytes, image remapping, articles/snippets/tags/flags/collections/settings/revisions, tamper rejection, resumable replay, owner isolation and recoverable rollback.');
