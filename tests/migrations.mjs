import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import assert from 'node:assert/strict';import * as schema from '../db/schema.ts';import {generateSQLiteDrizzleJson,generateSQLiteMigration} from 'drizzle-kit/api';
const db=new DatabaseSync(':memory:'),files=fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort();
for(const name of files.slice(0,3))db.exec(fs.readFileSync('drizzle/'+name,'utf8'));
db.prepare('INSERT INTO users(id,email,name,salt,password_hash,recovery_hash,created) VALUES(?,?,?,?,?,?,?)').run('old','old@example.test','Legacy','salt','hash','recovery',1);
db.prepare('INSERT INTO items(id,user_id,url,title,note,tags,collection,status,favorite,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('legacy','old','https://example.test/#original','قديم','ملاحظة','["عربي"]','بحث','archived',1,1,2);
for(const name of files.slice(3))db.exec(fs.readFileSync('drizzle/'+name,'utf8'));
const row=db.prepare('SELECT * FROM items WHERE id=?').get('legacy');assert.equal(row.note,'ملاحظة');assert.equal(row.url,'https://example.test/#original');assert.equal(row.status,'archived');assert.equal(row.revision,1);assert.equal(row.body,'');assert.equal(db.prepare('SELECT name FROM collections WHERE user_id=?').get('old').name,'بحث');
const final=JSON.parse(fs.readFileSync('drizzle/meta/0007_snapshot.json','utf8')),generated=await generateSQLiteDrizzleJson(schema);assert.deepEqual(await generateSQLiteMigration(final,generated),[]);
for(const table of Object.values(final.tables)){const names=db.prepare('PRAGMA table_info('+table.name+')').all().map(x=>x.name).sort();assert.deepEqual(names,Object.keys(table.columns).sort(),table.name)}
for(let i=3;i<=7;i++){const current=JSON.parse(fs.readFileSync('drizzle/meta/'+String(i).padStart(4,'0')+'_snapshot.json','utf8')),previous=JSON.parse(fs.readFileSync('drizzle/meta/'+String(i-1).padStart(4,'0')+'_snapshot.json','utf8'));assert.equal(current.prevId,previous.id)}
console.log('PASS existing Arabic records/flags/URLs survive all additive migrations; collection backfill, schema columns and Drizzle snapshot chain match.');
