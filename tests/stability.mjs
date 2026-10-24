import {call,context,sql,b} from './accounts.mjs';
import assert from 'node:assert/strict';
const raw=async(path,method='GET',body)=>{
 const response=await context.exports[method](new Request('https://oriva.test/api/'+path,{method,headers:{cookie:b.cookie,origin:'https://oriva.test','content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));
 return {status:response.status,data:await response.json()};
};
const created=await call('items','POST',{url:'https://example.test/docs#one',title:'Original',note:'Keep original',tags:['a'],collection:'Study'},b.cookie);
assert.equal(created.status,201);const original=created.data.item;
assert.equal(original.url,'https://example.test/docs#one');assert.equal(original.revision,1);
let result=await raw('items/'+original.id,'PATCH',{...original,note:'Newer note',revision:1});assert.equal(result.status,200);assert.equal(result.data.item.revision,2);
result=await raw('items/'+original.id,'PATCH',{...original,favorite:true});assert.equal(result.status,409);
assert.equal(result.data.current.note,'Newer note');
result=await raw('items/'+original.id,'PATCH',{favorite:true,revision:2});assert.equal(result.status,200);assert.equal(result.data.item.note,'Newer note');assert.equal(result.data.item.collection,'Study');assert.deepEqual(result.data.item.tags,['a']);
assert.equal((await raw('items/'+original.id,'PATCH',{...original,revision:undefined,favorite:true})).status,428);
for(const url of ['https://example.test/docs#two','https://example.test/#/account/3','https://example.test/?a=1&utm_source=x','https://example.test/path/','https://example.test/path','https://example.test/?a=%26%3D#%D8%B3']){
 const made=await call('items','POST',{url},b.cookie);assert.equal(made.status,201,url);assert.equal(made.data.item.url,new URL(url).toString());
}
const first=await raw('library?limit=2');assert.equal(first.status,200);assert.equal(first.data.items.length,2);assert.ok(first.data.nextCursor);
const all=[...first.data.items];let cursor=first.data.nextCursor;
while(cursor){const page=await raw('library?limit=2&version='+first.data.version+'&cursor='+cursor);assert.equal(page.status,200);all.push(...page.data.items);cursor=page.data.nextCursor}
assert.equal(new Set(all.map(x=>x.id)).size,all.length);assert.equal(all.length,7);
assert.equal((await raw('library?sinceVersion='+first.data.version)).data.unchanged,true);
await call('items','POST',{url:'https://example.test/later'},b.cookie);
assert.equal((await raw('library?version='+first.data.version+'&cursor='+first.data.nextCursor)).status,409);
assert.equal((await raw('library?cursor=bad')).status,400);
// Simultaneous conditional inserts near the limit cannot both consume the last slot.
const count=sql.prepare('SELECT COUNT(*) n FROM items WHERE user_id=?').get(b.data.user.id).n;
const insert=sql.prepare('INSERT INTO items (id,user_id,url,title,note,tags,collection,status,favorite,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
sql.exec('BEGIN');for(let i=count;i<9999;i++)insert.run(crypto.randomUUID(),b.data.user.id,'https://quota.test/'+i,'Quota','','[]','','inbox',0,1,1);sql.exec('COMMIT');
const concurrent=await Promise.all([call('items','POST',{url:'https://quota.test/a'},b.cookie),call('items','POST',{url:'https://quota.test/b'},b.cookie)]);
assert.deepEqual(concurrent.map(x=>x.status).sort(),[201,422]);assert.equal(sql.prepare('SELECT COUNT(*) n FROM items WHERE user_id=?').get(b.data.user.id).n,10000);
// Legacy oversized reads fail explicitly; paginated reads retain every full note.
sql.prepare('UPDATE items SET note=? WHERE user_id=?').run('n'.repeat(12000),b.data.user.id);
assert.equal((await raw('items')).status,426);
const large=await raw('library?limit=100');assert.equal(large.status,200);assert.equal(large.data.items[0].note.length,12000);
console.log('PASS revisions, narrow fields, legacy safe rejection, fragments/hash routes/queries, cursor consistency, unchanged sync, atomic quota and complete large notes.');
