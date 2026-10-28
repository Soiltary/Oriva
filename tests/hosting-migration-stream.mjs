import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {generateSQLiteDrizzleJson,generateSQLiteMigration} from 'drizzle-kit/api';import * as schema from '../db/schema.ts';
import {prepareHostingMigrations} from '../scripts/hosting-migration-stream.mjs';
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'oriva-hosting-stream-'));
try{
 const base=path.join(temp,'baseline'),target=path.join(temp,'prepared');fs.mkdirSync(path.join(base,'drizzle/meta'),{recursive:true});
 const original=JSON.parse(fs.readFileSync('drizzle/meta/_journal.json'));
 const journal={...original,entries:original.entries.slice(0,3)};
 fs.writeFileSync(path.join(base,'drizzle/meta/_journal.json'),JSON.stringify(journal));
 for(const e of journal.entries)for(const name of [e.tag+'.sql','meta/'+String(e.idx).padStart(4,'0')+'_snapshot.json'])fs.copyFileSync('drizzle/'+name,path.join(base,'drizzle',name));
 const proof=await prepareHostingMigrations(base,target);assert.equal(proof.deploymentAuthorized,false);assert.equal(proof.providerLedgerVerified,false);
 for(const e of proof.preserved)assert.deepEqual(fs.readFileSync(path.join(target,e.path)),fs.readFileSync(path.join(base,'drizzle',e.path)));
 const nextJournal=JSON.parse(fs.readFileSync(path.join(target,'meta/_journal.json')));assert.deepEqual(nextJournal.entries.slice(0,3),journal.entries);assert.equal(nextJournal.entries.length,4);
 const db=new DatabaseSync(':memory:');for(const e of nextJournal.entries)for(const sql of fs.readFileSync(path.join(target,e.tag+'.sql'),'utf8').split('--> statement-breakpoint'))if(sql.trim())db.exec(sql);
 const snapshot=JSON.parse(fs.readFileSync(path.join(target,'meta/0003_snapshot.json')));assert.equal(snapshot.prevId,JSON.parse(fs.readFileSync('drizzle/meta/0002_snapshot.json')).id);
 assert.deepEqual(await generateSQLiteMigration(snapshot,await generateSQLiteDrizzleJson(schema)),[]);
 assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").get().n,15);db.close();
 await assert.rejects(()=>prepareHostingMigrations(base,target),/must not exist/);
 const contested=path.join(temp,'contested'),race=await Promise.allSettled([prepareHostingMigrations(base,contested),prepareHostingMigrations(base,contested)]);assert.equal(race.filter(x=>x.status==='fulfilled').length,1);assert.equal(race.filter(x=>x.status==='rejected').length,1);
 const baseJournal=path.join(base,'drizzle/meta/_journal.json');fs.writeFileSync(baseJournal,JSON.stringify({...journal,dialect:'postgresql'}));await assert.rejects(()=>prepareHostingMigrations(base,path.join(temp,'bad-header')),/journal differs/);fs.writeFileSync(baseJournal,JSON.stringify(journal));
 const extra=path.join(base,'drizzle/0003_unreviewed.sql');fs.writeFileSync(extra,'DROP TABLE users;');await assert.rejects(()=>prepareHostingMigrations(base,path.join(temp,'extra')),/inventory differs/);fs.unlinkSync(extra);
 fs.appendFileSync(path.join(base,'drizzle',journal.entries[0].tag+'.sql'),'\n-- altered');
 const rejected=path.join(temp,'rejected');await assert.rejects(()=>prepareHostingMigrations(base,rejected),/Baseline differs/);assert.equal(fs.existsSync(rejected),false);
 console.log('PASS hosting stream: original SQL/snapshots/journal entries preserved; append-only schema matches current model; existing destinations and changed baselines rejected before writes.');
}finally{assert.ok(path.basename(temp).startsWith('oriva-hosting-stream-'));fs.rmSync(temp,{recursive:true,force:true});}
