import {call,context,b} from './accounts.mjs';import assert from 'node:assert/strict';
const made=await call('items','POST',{kind:'snippet',title:'Escaped code boundary',body:'"'.repeat(650000),language:'plaintext'},b.cookie);assert.equal(made.status,201);
assert.equal((await call('items/'+made.data.item.id,'PATCH',{revision:1,body:'Updated'},b.cookie)).status,200);
const response=await context.exports.GET(new Request('https://oriva.test/api/backup',{headers:{cookie:b.cookie}})),lines=(await response.text()).trim().split('\n');
const maximum=Math.max(...lines.map(line=>new TextEncoder().encode(line).byteLength));assert.ok(maximum<2_000_000,'Every supported record must fit the restore reader boundary; actual '+maximum);
const records=lines.map(JSON.parse);assert.equal(records.at(-1).type,'end');const target=await call('register','POST',{email:'backup-boundary@example.test',password:crypto.randomUUID(),name:'Boundary'}),session=(await call('restore/start','POST',{},target.cookie)).data.id;
for(let sequence=0;sequence<records.length;sequence++){const result=await call('restore/'+session+'/record','POST',{sequence,record:records[sequence]},target.cookie);assert.equal(result.status,200,JSON.stringify(result))}
let done=false;for(let i=0;i<records.length+2&&!done;i++){const result=await call('restore/'+session+'/commit','POST',{confirm:true,policy:'keep-existing'},target.cookie);assert.equal(result.status,200,JSON.stringify(result));done=!!result.data.done}assert.ok(done);
const item=(await call('library','GET',undefined,target.cookie)).data.items[0],history=(await call('items/'+item.id+'/revisions/1','GET',undefined,target.cookie)).data.snapshot;assert.equal(history.body,'"'.repeat(650000));
console.log('PASS large escaped revision backup/restore within record and D1-row boundaries, preserving all 650,000 quote characters.');
