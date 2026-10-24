// Offline rollout preparation only: no live bindings, networking, CLI apply,
// deployment configuration changes or migration-history writes.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const backfill="INSERT INTO collections(id,user_id,name,created,updated) SELECT lower(hex(randomblob(16))),user_id,collection,MIN(created),MAX(updated) FROM items WHERE length(trim(collection))>0 GROUP BY user_id,collection;";
const sha=value=>createHash('sha256').update(value).digest('hex');
export function schemaOnlyProposal(root){
 const directory=path.join(root,'drizzle'),names=fs.readdirSync(directory).filter(x=>/^\d{4}_.+\.sql$/.test(x)).sort();let separated=0;
 const migrations=names.map(name=>{const original=fs.readFileSync(path.join(directory,name)),statements=original.toString('utf8').split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean);
  const schema=statements.filter(sql=>{if(name==='0004_workspace.sql'&&sql===backfill){separated++;return false;}if(!/^(?:CREATE (?:UNIQUE )?(?:TABLE|INDEX)|ALTER TABLE)\b/i.test(sql))throw new Error('Unreviewed migration statement: '+name);return true;});
  return {name,sourceSha256:sha(original),statements:schema};});
 if(separated!==1)throw new Error('Expected exactly the reviewed collection backfill');
 return {status:'proposal-only',deploymentAuthorized:false,providerLedgerVerified:false,recoveryVerified:false,migrations,separatedBackfills:separated,requiredBeforeUse:['Verified paired provider recovery','Actual provider ledger proving each changed migration unapplied','Provider-supported pending migration repair and exact source packaging','Frozen isolated restoration and bounded backfill rehearsal']};
}
function targetId(owner,name){const s=sha(JSON.stringify(['oriva-collection-backfill-v1',owner,name]));return s.slice(0,8)+'-'+s.slice(8,12)+'-8'+s.slice(13,16)+'-a'+s.slice(17,20)+'-'+s.slice(20,32);}
// Use on a frozen isolated restoration. The cursor is not a live-source lock;
// callers must durably store returned progress. Replays use deterministic IDs.
export async function collectionBackfillPage(database,cursor=null,limit=100){
 if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw new Error('Backfill page limit must be 1–100');
 const initial=cursor===null,through=initial?(await database.prepare('SELECT MAX(id) AS id FROM items').first())?.id||'':cursor.through,after=initial?'':cursor.after;
 if(typeof after!=='string'||typeof through!=='string'||after.length>64||through.length>64||after>through)throw new Error('Invalid backfill cursor');
 const rows=(await database.prepare('SELECT id,user_id,collection,created,updated FROM items WHERE id>? AND id<=? ORDER BY id LIMIT ?').bind(after,through,limit).all()).results;
 const statements=rows.filter(row=>row.collection.trim().length).map(row=>database.prepare(`INSERT INTO collections(id,user_id,name,created,updated) VALUES(?,?,?,?,?) ON CONFLICT(user_id,name) DO UPDATE SET created=min(collections.created,excluded.created),updated=max(collections.updated,excluded.updated) WHERE collections.id=excluded.id`).bind(targetId(row.user_id,row.collection),row.user_id,row.collection,row.created,row.updated));
 if(statements.length)await database.batch(statements);
 const next={after:rows.at(-1)?.id||after,through};return {cursor:next,done:!rows.length||next.after===through,scanned:rows.length,statements:statements.length};
}
