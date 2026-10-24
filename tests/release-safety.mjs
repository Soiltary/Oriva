import {call,context,sql,b,files} from './accounts.mjs';
import assert from 'node:assert/strict';
const created=await call('items','POST',{url:'https://example.test/release-safety',title:'Preserved',note:'Current note'},b.cookie);assert.equal(created.status,201);
const id=created.data.item.id;
// Submit the original full-snapshot contract directly, without the test helper
// that supplies revisions to modern requests. Revisionless writes must fail shut.
const legacy=async(method,body)=>context.exports[method](new Request('https://oriva.test/api/items/'+id,{method,headers:{origin:'https://oriva.test','content-type':'application/json',cookie:b.cookie},body:JSON.stringify(body)}));
const legacyBody={url:created.data.item.url,title:'Old client snapshot',note:'Stale note',favorite:true};
assert.equal((await legacy('PATCH',legacyBody)).status,428);
assert.equal((await legacy('DELETE',{})).status,428);
const clients=await Promise.all([call('items/'+id,'PATCH',{revision:1,note:'Client A'},b.cookie),call('items/'+id,'PATCH',{revision:1,note:'Client B'},b.cookie)]);
assert.deepEqual(clients.map(x=>x.status).sort(),[200,409]);
assert.ok(['Client A','Client B'].includes((await call('items/'+id,'GET',undefined,b.cookie)).data.item.note));
assert.equal((await legacy('PATCH',legacyBody)).status,428);
const legacyList=await call('items','GET',undefined,b.cookie);assert.equal(legacyList.status,200);assert.ok(legacyList.data.items.some(x=>x.id===id&&x.kind==='link'));
// A 1.5.3 read must not expose articles or recoverable trash it cannot represent.
const article=await call('items','POST',{kind:'article',title:'Modern document',body:'Retain'},b.cookie);assert.equal(article.status,201);
const trash=await call('items','POST',{url:'https://example.test/trashed',title:'Trash'},b.cookie);assert.equal(trash.status,201);assert.equal((await call('items/'+trash.data.item.id,'DELETE',{revision:1},b.cookie)).status,200);
const visible=(await call('items','GET',undefined,b.cookie)).data.items;assert.ok(!visible.some(x=>[article.data.item.id,trash.data.item.id].includes(x.id)));
const fingerprint=()=>JSON.stringify(sql.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(({name})=>[name,sql.prepare('SELECT * FROM "'+name+'" ORDER BY rowid').all()]));
const before=fingerprint(),beforeFiles=[...files.entries()];
context.__env.ORIVA_LIBRARY_READ_ONLY='1';
for(const [route,method,body] of [['items','POST',{url:'https://example.test/blocked'}],['items/'+id,'PATCH',{revision:2,note:'Blocked'}],['items/'+id,'DELETE',{revision:2}],['collections','POST',{name:'Blocked'}],['preferences','PATCH',{revision:0,preferences:{view:'board'}}],['restore/start','POST',{}],['restore/'+crypto.randomUUID()+'/commit','POST',{confirm:true,policy:'keep-existing'}],['import','POST',{items:[]}],['health','POST',{}]]){
 const result=await call(route,method,body,b.cookie);assert.equal(result.status,503,route);assert.equal(result.data.code,'library_read_only');
}
const upload=await context.exports.POST(new Request('https://oriva.test/api/files',{method:'POST',headers:{origin:'https://oriva.test',cookie:b.cookie,'x-file-name':'blocked.bin'},body:new Uint8Array([1,2,3])}));assert.equal(upload.status,503);assert.equal(upload.headers.get('Retry-After'),'300');
assert.equal(fingerprint(),before);assert.deepEqual([...files.entries()],beforeFiles);
assert.equal((await call('library','GET',undefined,b.cookie)).status,200);assert.equal((await call('items/'+article.data.item.id,'GET',undefined,b.cookie)).data.item.body,'Retain');
const backup=await context.exports.GET(new Request('https://oriva.test/api/backup',{headers:{cookie:b.cookie}}));assert.equal(backup.status,200);const lines=(await backup.text()).trim().split('\n').map(JSON.parse);assert.ok(!lines.some(x=>x.type==='error'));assert.equal(lines.at(-1).type,'end');
assert.equal((await call('logout','POST',{},b.cookie)).status,200);
delete context.__env.ORIVA_LIBRARY_READ_ONLY;
// A fresh modern session still writes after the containment flag is removed.
const account=await call('register','POST',{email:crypto.randomUUID()+'@example.test',password:crypto.randomUUID(),name:'Fresh synthetic'});assert.equal(account.status,201);
assert.equal((await call('items','POST',{url:'https://example.test/resumed'},account.cookie)).status,201);
console.log('PASS legacy library shape/filtering; revisionless writes fail428; concurrent modern edits200/409; schema-compatible write containment preserves all SQL/R2 bytes and supports reading/backup/logout; explicit resume works. Not transparent legacy write compatibility or a provider backup.');
