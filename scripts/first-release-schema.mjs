// Fresh-resource schema preparation only. No provider credentials, networking,
// migration-history writes or apply command are present in this module.
import * as schema from '../db/schema.ts';
import {generateSQLiteDrizzleJson,generateSQLiteMigration} from 'drizzle-kit/api';
import {storageQuotaTriggers} from './storage-quota-sql.mjs';
export async function firstReleaseSchema(){
 const empty=await generateSQLiteDrizzleJson({}),current=await generateSQLiteDrizzleJson(schema),statements=await generateSQLiteMigration(empty,current);
 if(!statements.length||statements.some(s=>!/^CREATE (?:TABLE|(?:UNIQUE )?INDEX)\b/i.test(s.trim())))throw Error('Fresh schema contains a non-schema operation');
 return {productVersion:'1.0.0',target:'verified-empty-database-only',deploymentAuthorized:false,statements:[...statements,...storageQuotaTriggers(true,false)]};
}
