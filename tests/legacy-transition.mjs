import {call,context,b} from './accounts.mjs';
import assert from 'node:assert/strict';
// This is the exact seven-field body produced by the historical 1.5.3
// libraryPatchBody, not call(), which supplies modern revision numbers.
const fields=item=>({title:item.title,url:item.url,note:item.note,collection:item.collection,status:item.status,tags:item.tags,favorite:item.favorite});
const legacy=async(id,body)=>{const response=await context.exports.PATCH(new Request('https://oriva.test/api/items/'+id,{method:'PATCH',headers:{origin:'https://oriva.test','content-type':'application/json','user-agent':'Oriva Desktop/1.5.3',cookie:b.cookie},body:JSON.stringify(body)}));return {status:response.status,data:await response.json()}};
const read=async id=>(await call('items/'+id,'GET',undefined,b.cookie)).data.item;
const created=await call('items','POST',{url:'https://example.test/legacy-transition#kept',title:'Legacy readable',note:'Original ملاحظة',collection:'Original group',tags:['one'],status:'reading'},b.cookie);assert.equal(created.status,201);const id=created.data.item.id;
const old=fields(await read(id));
assert.equal((await call('items/'+id,'PATCH',{revision:1,note:'Newer Arabic ملاحظة'},b.cookie)).status,200);
const rejectedFavorite=await legacy(id,{...old,favorite:true});assert.equal(rejectedFavorite.status,428);assert.equal(rejectedFavorite.data.code,'revision_required');assert.match(rejectedFavorite.data.error,/Update Oriva/);assert.equal((await read(id)).note,'Newer Arabic ملاحظة');assert.equal((await read(id)).favorite,false);
// The safe upgraded client expresses only the intended flag plus its revision.
let current=await read(id);assert.equal((await call('items/'+id,'PATCH',{revision:current.revision,favorite:true},b.cookie)).status,200);
current=await read(id);assert.equal((await call('items/'+id,'PATCH',{revision:current.revision,collection:'Newer مجموعة'},b.cookie)).status,200);
const rejectedArchive=await legacy(id,{...old,status:'archived'});assert.equal(rejectedArchive.status,428);current=await read(id);assert.equal(current.note,'Newer Arabic ملاحظة');assert.equal(current.collection,'Newer مجموعة');assert.equal(current.favorite,true);assert.equal(current.status,'reading');
assert.equal((await call('items/'+id,'PATCH',{revision:current.revision,status:'archived'},b.cookie)).status,200);current=await read(id);assert.equal(current.favorite,true);assert.equal(current.collection,'Newer مجموعة');assert.equal(current.note,'Newer Arabic ملاحظة');
const concurrent=await Promise.all([call('items/'+id,'PATCH',{revision:current.revision,note:'Concurrent A'},b.cookie),call('items/'+id,'PATCH',{revision:current.revision,note:'Concurrent B'},b.cookie)]);assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409]);
const modern=await call('items','POST',{kind:'article',title:'Modern content',body:'Preserve modern article'},b.cookie);assert.equal(modern.status,201);
const list=await call('items','GET',undefined,b.cookie);assert.equal(list.status,200);assert.ok(list.data.items.some(x=>x.id===id));assert.ok(!list.data.items.some(x=>x.id===modern.data.item.id));
// Indistinguishability witness: a historical form can submit this exact body
// after a concurrent favorite change, while a favorite click can submit it
// deliberately. Neither User-Agent nor the seven-field JSON encodes intent.
const snapshot=fields(await read(id));const deliberateFavorite={...snapshot,favorite:!snapshot.favorite};const staleFormSubmission=JSON.parse(JSON.stringify(deliberateFavorite));assert.deepEqual(deliberateFavorite,staleFormSubmission);
assert.equal((await legacy(id,deliberateFavorite)).status,428);assert.equal((await legacy(id,staleFormSubmission)).status,428);
console.log('PASS exact legacy seven-field contract: stale favorite/archive rejected428 with upgrade guidance; newer notes/collections preserved; upgraded narrow flags work; competing edits200/409; legacy reads retain links and hide modern documents. Transparent unmodified1.5.3 writes cannot be inferred safely.');
