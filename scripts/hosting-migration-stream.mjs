// Offline append-only preparation. Never applies SQL or connects to a provider.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {firstReleaseBridge} from './first-release-bridge.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function prepareHostingMigrations(baselineRoot,destination){
 const baseline=path.resolve(baselineRoot,'drizzle'),target=path.resolve(destination);
 if(fs.existsSync(target))throw Error('Destination must not exist; existing migrations are never replaced');
 const journalBytes=fs.readFileSync(path.join(baseline,'meta/_journal.json')),journal=JSON.parse(journalBytes);
 const expected=JSON.parse(fs.readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url)));
 if(JSON.stringify(journal)!==JSON.stringify({...expected,entries:expected.entries.slice(0,3)}))throw Error('Hosted baseline journal differs from reviewed 0000..0002');
 const files=journal.entries.flatMap(entry=>[entry.tag+'.sql','meta/'+String(entry.idx).padStart(4,'0')+'_snapshot.json']);
 const inventory=fs.readdirSync(baseline,{recursive:true,withFileTypes:true}).map(entry=>{
  if(entry.isSymbolicLink())throw Error('Baseline symlinks are not supported');
  return entry.isFile()?path.relative(baseline,path.join(entry.parentPath,entry.name)).split(path.sep).join('/'):null;
 }).filter(Boolean).sort();
 if(JSON.stringify(inventory)!==JSON.stringify([...files,'meta/_journal.json'].sort()))throw Error('Baseline migration inventory differs from reviewed 0000..0002');
 const preserved=files.map(name=>{const bytes=fs.readFileSync(path.join(baseline,name)),reviewed=fs.readFileSync(new URL('../drizzle/'+name,import.meta.url));if(!bytes.equals(reviewed))throw Error('Baseline differs: '+name);return {path:name,bytes,sha256:hash(bytes)}});
 const proposal=await firstReleaseBridge();
 if(hash(fs.readFileSync(path.join(baseline,'meta/0002_snapshot.json')))!==proposal.baseSnapshotSha256)throw Error('Bridge baseline mismatch');
 const entry={idx:3,version:'6',when:journal.entries.at(-1).when+1,tag:'0003_first_public_release',breakpoints:true};
 // The parent must exist. Non-recursive mkdir claims the output exclusively
 // after generation; a competing invocation cannot overwrite its files.
 fs.mkdirSync(target);fs.mkdirSync(path.join(target,'meta'));
 for(const file of preserved)fs.writeFileSync(path.join(target,file.path),file.bytes);
 fs.writeFileSync(path.join(target,entry.tag+'.sql'),proposal.statements.join('\n--> statement-breakpoint\n')+'\n');
 fs.writeFileSync(path.join(target,'meta/0003_snapshot.json'),JSON.stringify(proposal.snapshot,null,2)+'\n');
 fs.writeFileSync(path.join(target,'meta/_journal.json'),JSON.stringify({...journal,entries:[...journal.entries,entry]},null,2)+'\n');
 return {status:'offline-prepared',deploymentAuthorized:false,providerLedgerVerified:false,baselineJournalSha256:hash(journalBytes),preserved:preserved.map(({path,sha256})=>({path,sha256})),statements:proposal.statements.length,destination:target};
}
