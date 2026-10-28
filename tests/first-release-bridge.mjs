import {firstReleaseBridge} from '../scripts/first-release-bridge.mjs';
import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new DatabaseSync(':memory:');
for(const name of fs.readdirSync('drizzle').filter(x=>/^000[012]_.*\.sql$/.test(x)).sort())db.exec(fs.readFileSync('drizzle/'+name,'utf8'));
db.prepare('INSERT INTO users(id,email,name,salt,password_hash,recovery_hash,created) VALUES(?,?,?,?,?,?,?)').run('synthetic','bridge@example.test','عربي','salt','hash','recovery',1);
db.prepare('INSERT INTO items(id,user_id,url,title,note,tags,collection,status,favorite,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('synthetic-item','synthetic','https://bridge.example.test','عربي English','Original bytes','["test"]','Ideas','inbox',1,1,2);
const before=db.prepare('SELECT * FROM items').get(),userBefore=db.prepare('SELECT * FROM users').get(),proposal=await firstReleaseBridge();
assert.equal(proposal.deploymentAuthorized,false);assert.equal(proposal.providerLedgerVerified,false);
for(const sql of proposal.statements)db.exec(sql);
const after=db.prepare('SELECT * FROM items').get(),userAfter=db.prepare('SELECT * FROM users').get();
for(const [key,value] of Object.entries(before))assert.equal(after[key],value,key);
for(const [key,value] of Object.entries(userBefore))assert.equal(userAfter[key],value,key);
assert.equal(after.revision,1);assert.equal(after.deleted_at,0);assert.equal(userAfter.purge_revision,0);
assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'").get().n,15);
assert.equal(db.prepare('SELECT COUNT(*) n FROM collections').get().n,0,'No implicit collection backfill or seed writes');
// An older reader can still select every original field after schema changes.
assert.deepEqual(Object.fromEntries(Object.keys(before).map(key=>[key,after[key]])),{...before});
console.log('PASS offline schema-only hosted-baseline bridge: exact original account/item fields preserved,15tables, no reset/backfill/history replacement or deployment; provider ledger remains unverified.');
