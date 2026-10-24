// Development metadata only. Does not connect to D1 or execute SQL migrations.
import fs from 'node:fs';import crypto from 'node:crypto';
import * as schema from '../db/schema.ts';
import {generateSQLiteDrizzleJson,generateSQLiteMigration} from 'drizzle-kit/api';
const final=await generateSQLiteDrizzleJson(schema),base=JSON.parse(fs.readFileSync('drizzle/meta/0002_snapshot.json','utf8'));
let previous=base;
for(let stage=3;stage<=7;stage++){
 const snapshot=structuredClone(previous);snapshot.prevId=previous.id;snapshot.id=crypto.randomUUID();snapshot.internal=structuredClone(final.internal);
 const fields=stage===3?['revision']:stage===4?['body','language','pinned','deleted_at','rating']:stage===5?['restore_session']:stage===6?['change_seq']:[];
 for(const field of fields)snapshot.tables.items.columns[field]=final.tables.items.columns[field];
 if(stage===3){snapshot.tables.users.columns.library_revision=final.tables.users.columns.library_revision;snapshot.tables.items.indexes.items_owner_order=final.tables.items.indexes.items_owner_order}
 if(stage===6)snapshot.tables.items.indexes.items_owner_changes=final.tables.items.indexes.items_owner_changes;
 const tables=stage===4?['collections','item_revisions','attachments','preferences']:stage===5?['restore_sessions','restore_records','restore_maps']:stage===7?['item_health']:[];
 for(const name of tables)snapshot.tables[name]=final.tables[name];
 fs.writeFileSync('drizzle/meta/'+String(stage).padStart(4,'0')+'_snapshot.json',JSON.stringify(snapshot,null,2)+'\n');previous=snapshot;
}
const remaining=await generateSQLiteMigration(previous,final);if(remaining.length)throw new Error('Unexpected schema drift: '+JSON.stringify(remaining));
console.log('PASS snapshots 0003–0007 match the final Drizzle schema; no pending schema changes. No database accessed.');
