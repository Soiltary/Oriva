import {call,sql,files,context,b} from './accounts.mjs';
import assert from 'node:assert/strict';
import {metadataQuota} from '../scripts/storage-quota-sql.mjs';
const r=await call('register','POST',{email:'lifecycle@example.test',password:'Synthetic-lifecycle-29!'}),cookie=r.cookie,owner=r.data.user.id;
const put=context.__env.BUCKET.put;
context.__env.BUCKET.put=async()=>{throw new Error('Synthetic ambiguous write')};
const upload=()=>context.exports.POST(new Request('https://oriva.test/api/files',{method:'POST',headers:{origin:'https://oriva.test',cookie,'x-file-name':'failed.bin'},body:Uint8Array.of(1,2)}));
assert.equal((await upload()).status,500);
context.__env.BUCKET.put=put;
let list=await call('storage/orphans','GET',undefined,cookie);
assert.equal(list.status,200,'Failed reservations must be discoverable and reclaimable');
assert.equal(list.data.objects.length,1);
const key=list.data.objects[0].key;
assert.equal((await call('storage/cleanup','POST',{keys:[key]},cookie)).status,400);
assert.equal((await call('storage/cleanup','POST',{confirm:true,keys:[key]},b.cookie)).status,404);
assert.equal((await call('storage/cleanup','POST',{confirm:true,keys:[key]},cookie)).status,200);
assert.equal(sql.prepare('SELECT object_bytes,metadata_bytes FROM storage_usage WHERE user_id=?').get(owner).object_bytes,0);
const item=(await call('items','POST',{url:'https://quota.test/trash',note:'recoverable'},cookie)).data.item;
sql.prepare('UPDATE storage_usage SET metadata_bytes=? WHERE user_id=?').run(metadataQuota,owner);
const trash=await call('items/'+item.id,'DELETE',{revision:item.revision},cookie);
assert.equal(trash.status,200,'Moving to recoverable trash must work when history allowance is full');
assert.equal(sql.prepare('SELECT note FROM items WHERE id=?').get(item.id).note,'recoverable');
let revision=sql.prepare('SELECT revision FROM items WHERE id=?').get(item.id).revision;
assert.equal((await call('items/'+item.id,'PATCH',{revision,deleted:false},cookie)).status,200,'Exact undelete does not allocate a duplicate history snapshot');
revision++;assert.equal((await call('items/'+item.id,'DELETE',{revision},cookie)).status,200);revision++;
const beforePurge=(await call('library','GET',undefined,cookie)).data.version;
assert.equal((await call('storage/trash/'+item.id,'POST',{confirm:true,revision:revision-1},cookie)).status,409);
assert.equal((await call('storage/trash/'+item.id,'POST',{confirm:true,revision},b.cookie)).status,404);
assert.equal((await call('storage/trash/'+item.id,'POST',{confirm:true,revision},cookie)).status,200);
assert.equal(sql.prepare('SELECT id FROM items WHERE id=?').get(item.id),undefined);
const sync=(await call('library?sinceVersion='+beforePurge+'&afterVersion='+beforePurge,'GET',undefined,cookie)).data;assert.equal(sync.delta,false,'Permanent deletion forces fresh full sync');assert.ok(!sync.items.some(x=>x.id===item.id));
assert.ok(sql.prepare('SELECT metadata_bytes FROM storage_usage WHERE user_id=?').get(owner).metadata_bytes<metadataQuota);
// Remove only the synthetic high-water counter; all real charged rows above
// were purged. The following import needs room for both item and collection.
sql.prepare('UPDATE storage_usage SET metadata_bytes=0 WHERE user_id=?').run(owner);
assert.equal((await call('import','POST',{items:[{url:'https://quota.test/import',collection:'Imported'}]},cookie)).status,200);
assert.match(sql.prepare('SELECT id FROM collections WHERE user_id=?').get(owner).id,/^[0-9a-f-]{36}$/);
// Active writes cannot release their reservation; a write-then-throw remains
// charged and discoverable until it settles and explicit cleanup succeeds.
let release,entered;const started=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
context.__env.BUCKET.put=async(...args)=>{entered();await gate;await put(...args);throw new Error('Synthetic write succeeded but response failed')};
const pending=upload();await started;
const inFlight=(await call('storage/orphans','GET',undefined,cookie)).data.objects[0].key;
const waiting=await call('storage/cleanup','POST',{confirm:true,keys:[inFlight]},cookie);assert.deepEqual(waiting.data.retained,[inFlight]);
release();assert.equal((await pending).status,500);assert.equal(files.has(inFlight),true);assert.equal(sql.prepare('SELECT bytes FROM object_storage WHERE key=?').get(inFlight).bytes,2,'Ambiguous writes stay charged and discoverable');
assert.equal((await call('storage/cleanup','POST',{confirm:true,keys:[inFlight]},cookie)).status,200);assert.equal(files.has(inFlight),false);assert.equal(sql.prepare('SELECT key FROM object_storage WHERE key=?').get(inFlight),undefined,'No permanent uncharged tombstone');
context.__env.BUCKET.put=put;
// Existing saved references and revision-only cover images survive cleanup.
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1X8AAAAASUVORK5CYII=';
const covered=(await call('items','POST',{url:'https://quota.test/image',imageData:png},cookie)).data.item,imageKey=owner+'/'+covered.image;
assert.deepEqual((await call('storage/cleanup','POST',{confirm:true,keys:[imageKey]},cookie)).data.retained,[imageKey]);
assert.equal((await call('items/'+covered.id,'PATCH',{revision:covered.revision,removeImage:true},cookie)).status,200);
assert.deepEqual((await call('storage/cleanup','POST',{confirm:true,keys:[imageKey]},cookie)).data.retained,[imageKey]);assert.ok(files.has(imageKey));
// Metadata writes cannot attach a previously canceled UUID.
assert.throws(()=>sql.prepare('UPDATE items SET image=? WHERE id=?').run(inFlight.slice(-36),covered.id),/canceled during cleanup/);
assert.throws(()=>sql.prepare('UPDATE items SET body=? WHERE id=?').run('![late](/api/images/'+inFlight.slice(-36)+')',covered.id),/canceled during cleanup/);
assert.throws(()=>sql.prepare('INSERT INTO preferences(user_id,data,revision) VALUES(?,?,1)').run(owner,JSON.stringify({image:'/api/images/'+inFlight.slice(-36)})),/canceled during cleanup/);
// Two cleanup requests must not both enter R2 deletion. Otherwise the second
// can delete bytes recreated by a restore retry after the first has finished.
const free=await upload();assert.equal(free.status,201);const freeItem=(await free.json()).item;
await call('items/'+freeItem.id,'DELETE',{revision:freeItem.revision},cookie);
await call('storage/trash/'+freeItem.id,'POST',{confirm:true,revision:freeItem.revision+1},cookie);
const freeKey=owner+'/files/'+freeItem.file_key,remove=context.__env.BUCKET.delete;let unblock,arrived,removes=0;
const deleting=new Promise(resolve=>arrived=resolve),deleteGate=new Promise(resolve=>unblock=resolve);
context.__env.BUCKET.delete=async key=>{removes++;arrived();await deleteGate;return remove(key)};
const first=call('storage/cleanup','POST',{confirm:true,keys:[freeKey]},cookie);await deleting;
assert.deepEqual((await call('storage/cleanup','POST',{confirm:true,keys:[freeKey]},cookie)).data.retained,[freeKey]);assert.equal(removes,1);
unblock();assert.equal((await first).status,200);context.__env.BUCKET.delete=remove;
console.log('PASS failed upload quota reclamation, confirmation/isolation, full-quota recoverable trash, revision-scoped permanent purge and canonical imported collection IDs.');
