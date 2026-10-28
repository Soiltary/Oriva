// Offline proposal for the verified hosted 0000..0002 baseline. This does not
// replace a migration directory, mutate history, connect to Sites, or apply SQL.
import fs from 'node:fs';import {createHash} from 'node:crypto';
import * as schema from '../db/schema.ts';
import {generateSQLiteDrizzleJson,generateSQLiteMigration} from 'drizzle-kit/api';
import {storageQuotaTriggers} from './storage-quota-sql.mjs';
export async function firstReleaseBridge(){
 const source=fs.readFileSync(new URL('../drizzle/meta/0002_snapshot.json',import.meta.url),'utf8'),base=JSON.parse(source),current=await generateSQLiteDrizzleJson(schema),statements=await generateSQLiteMigration(base,current);
 if(statements.some(sql=>!/^CREATE (?:TABLE|(?:UNIQUE )?INDEX)\b|^ALTER TABLE [`\w]+ ADD /i.test(sql.trim())))throw Error('Bridge contains a destructive or data-changing statement');
 return {status:'proposal-only',deploymentAuthorized:false,providerLedgerVerified:false,baseSnapshotSha256:createHash('sha256').update(source).digest('hex'),statements:[...statements,...storageQuotaTriggers(true,false)]};
}
