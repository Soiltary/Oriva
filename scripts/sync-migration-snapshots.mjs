// Historical command name retained. Existing SQL/snapshot/journal identities
// are verified, never regenerated: they may already have been applied.
import fs from 'node:fs';import * as schema from '../db/schema.ts';
import {generateSQLiteDrizzleJson,generateSQLiteMigration} from 'drizzle-kit/api';
if(process.argv.slice(2).some(x=>x!=='--check'))throw new Error('Read-only verification only; applied migration history must not be regenerated');
const journal=JSON.parse(fs.readFileSync('drizzle/meta/_journal.json','utf8'));let previous=null;
for(const entry of journal.entries){
 const file='drizzle/meta/'+String(entry.idx).padStart(4,'0')+'_snapshot.json',current=JSON.parse(fs.readFileSync(file,'utf8'));
 if(previous&&current.prevId!==previous.id)throw new Error('Broken snapshot chain: '+file);
 if(!fs.existsSync('drizzle/'+entry.tag+'.sql'))throw new Error('Missing journal migration: '+entry.tag);previous=current;
}
if(!previous)throw new Error('Empty migration journal');
const remaining=await generateSQLiteMigration(previous,await generateSQLiteDrizzleJson(schema));
if(remaining.length)throw new Error('Append a new generated migration; existing snapshots remain immutable: '+JSON.stringify(remaining));
console.log('PASS immutable migration snapshots/journal match current schema; no files or databases changed.');
