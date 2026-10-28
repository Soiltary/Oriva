// Fixed schema-owned accounting; no live database client or apply operation.
// Costs include escaped UTF-8 fields and 2 KiB per logical record. This bounds
// exported record overhead as well as content, with headroom inside restore's
// 64 MiB record / 1 GiB chunk budgets. Trash and revisions remain chargeable.
export const metadataQuota=32*1024*1024,objectQuota=512*1024*1024;
export const metadataFields={
 items:['id','user_id','url','title','note','tags','collection','status','kind','file_key','file_name','file_type','image','body','language'],
 collections:['id','user_id','name','parent_id','icon','color','image'],
 item_revisions:['item_id','user_id','snapshot'],attachments:['id','user_id','item_id','mime'],preferences:['user_id','data'],item_health:['item_id','user_id','state']
};
export const metadataCost=(table,alias)=>'2048'+metadataFields[table].map(c=>`+length(CAST(json_quote(${alias}.${c}) AS BLOB))`).join('');
export function storageBootstrap(owner,lifecycle=false){
 const terms=Object.keys(metadataFields).map(t=>`(SELECT COALESCE(SUM(${metadataCost(t,'q')}),0) FROM ${t} q WHERE q.user_id=${owner})`);
 terms.push(`(SELECT COUNT(*)*2048 FROM object_storage WHERE user_id=${owner})`);
 return `INSERT OR IGNORE INTO storage_usage(user_id,metadata_bytes,object_bytes) SELECT ${owner},${terms.join('+')},(SELECT COALESCE(SUM(bytes),0) FROM object_storage WHERE user_id=${owner}) WHERE NOT EXISTS(SELECT 1 FROM storage_usage WHERE user_id=${owner});`;
}
function referenceGuard(table,legacyFileUrlGuard=true){
 const id="substr(o.key,-36)",link=expression=>`(instr(${expression},'/api/images/'||${id})>0 OR instr(${expression},'/api/files/'||${id})>0)`;
 const references={items:`NEW.file_key=${id} OR NEW.image=${id} OR ${link('NEW.body')}`,collections:`NEW.image=${id}`,attachments:`NEW.id=${id}`,item_revisions:`json_extract(NEW.snapshot,'$.file_key')=${id} OR json_extract(NEW.snapshot,'$.image')=${id} OR ${link("COALESCE(json_extract(NEW.snapshot,'$.body'),'')")}`,preferences:link('NEW.data')};
 const required={items:[['NEW.image',"''"],['NEW.file_key',"'files/'"]],collections:[['NEW.image',"''"]],attachments:[['NEW.id',"''"]],item_revisions:[["COALESCE(json_extract(NEW.snapshot,'$.image'),'')","''"],["COALESCE(json_extract(NEW.snapshot,'$.file_key'),'')","'files/'"]]};
 const missingParts=(required[table]||[]).map(([field,prefix])=>`(${field}!='' AND NOT EXISTS(SELECT 1 FROM object_storage o WHERE o.user_id=NEW.user_id AND o.key=NEW.user_id||'/'||${prefix}||${field} AND o.state='ready'))`);
 const body={items:'NEW.body',item_revisions:"COALESCE(json_extract(NEW.snapshot,'$.body'),'')",preferences:'NEW.data'}[table];
 if(body)for(const [path,prefix] of (legacyFileUrlGuard?[['/api/images/',''],['/api/files/','files/']]:[['/api/images/','']])){
  // Parse only reserved, canonical API UUID URLs. Plain text remains inert;
  // malformed/non-UUID paths do not become storage references.
  missingParts.push(`EXISTS(WITH RECURSIVE refs(rest,id) AS (SELECT ${body},'' UNION ALL SELECT substr(rest,instr(rest,'${path}')+${path.length+36}),substr(rest,instr(rest,'${path}')+${path.length},36) FROM refs WHERE instr(rest,'${path}')>0) SELECT 1 FROM refs WHERE length(id)=36 AND id NOT GLOB '*[^0-9a-f-]*' AND NOT EXISTS(SELECT 1 FROM object_storage o WHERE o.user_id=NEW.user_id AND o.key=NEW.user_id||'/${prefix}'||refs.id AND o.state='ready'))`);
 }
 const missing=missingParts.join(' OR ');
 return references[table]?`SELECT CASE WHEN ${missing?missing+' OR ':''}EXISTS(SELECT 1 FROM object_storage o WHERE o.user_id=NEW.user_id AND o.state='purging' AND (${references[table]})) THEN RAISE(ABORT,'Upload was canceled during cleanup') END; `:'';
}
export function storageReferenceQuery(){return "SELECT id FROM items WHERE user_id=?1 AND (file_key=?2 OR image=?2 OR instr(body,?3)>0 OR instr(body,?4)>0) UNION ALL SELECT id FROM collections WHERE user_id=?1 AND image=?2 UNION ALL SELECT id FROM attachments WHERE user_id=?1 AND id=?2 UNION ALL SELECT item_id FROM item_revisions WHERE user_id=?1 AND (json_extract(snapshot,'$.file_key')=?2 OR json_extract(snapshot,'$.image')=?2 OR instr(COALESCE(json_extract(snapshot,'$.body'),''),?3)>0 OR instr(COALESCE(json_extract(snapshot,'$.body'),''),?4)>0) UNION ALL SELECT user_id FROM preferences WHERE user_id=?1 AND (instr(data,?3)>0 OR instr(data,?4)>0) LIMIT 1";}
export function storageQuotaTriggers(lifecycle=false,legacyFileUrlGuard=true){
 const statements=[`CREATE TRIGGER storage_new_account AFTER INSERT ON users BEGIN INSERT INTO storage_usage(user_id,object_census) VALUES(NEW.id,1); END;`];
 for(const t of Object.keys(metadataFields)){
  const n=metadataCost(t,'NEW'),o=metadataCost(t,'OLD'),guard=lifecycle?referenceGuard(t,legacyFileUrlGuard):'';
  statements.push(`CREATE TRIGGER storage_${t}_insert AFTER INSERT ON ${t} BEGIN ${guard}${storageBootstrap('NEW.user_id',lifecycle)} UPDATE storage_usage SET metadata_bytes=metadata_bytes+(${n}) WHERE user_id=NEW.user_id AND changes()=0; SELECT CASE WHEN metadata_bytes>${metadataQuota} THEN RAISE(ABORT,'Account content storage limit reached') END FROM storage_usage WHERE user_id=NEW.user_id; END;`);
  statements.push(`CREATE TRIGGER storage_${t}_delete AFTER DELETE ON ${t} BEGIN ${storageBootstrap('OLD.user_id',lifecycle)} UPDATE storage_usage SET metadata_bytes=max(0,metadata_bytes-(${o})) WHERE user_id=OLD.user_id AND changes()=0; END;`);
  statements.push(`CREATE TRIGGER storage_${t}_update AFTER UPDATE ON ${t} BEGIN ${guard}SELECT CASE WHEN NEW.user_id!=OLD.user_id THEN RAISE(ABORT,'Record storage owner cannot change') END; ${storageBootstrap('NEW.user_id',lifecycle)} UPDATE storage_usage SET metadata_bytes=max(0,metadata_bytes+(${n})-(${o})) WHERE user_id=NEW.user_id AND changes()=0; SELECT CASE WHEN metadata_bytes>${metadataQuota} AND (${n})>(${o}) THEN RAISE(ABORT,'Account content storage limit reached') END FROM storage_usage WHERE user_id=NEW.user_id; END;`);
 }
 if(lifecycle){
  const cost=()=>`2048`,valid="SELECT CASE WHEN NEW.state NOT IN ('pending','ready','failed','purging') OR NEW.bytes<0 THEN RAISE(ABORT,'Invalid object storage state') END;";
  statements.push(`CREATE TRIGGER storage_object_insert AFTER INSERT ON object_storage BEGIN ${valid} ${storageBootstrap('NEW.user_id',true)} UPDATE storage_usage SET object_bytes=object_bytes+NEW.bytes,metadata_bytes=metadata_bytes+(${cost('NEW')}) WHERE user_id=NEW.user_id AND changes()=0; SELECT CASE WHEN object_bytes>${objectQuota} OR metadata_bytes>${metadataQuota} THEN RAISE(ABORT,'Account file storage limit reached') END FROM storage_usage WHERE user_id=NEW.user_id; END;`);
  statements.push(`CREATE TRIGGER storage_object_delete AFTER DELETE ON object_storage BEGIN ${storageBootstrap('OLD.user_id',true)} UPDATE storage_usage SET object_bytes=max(0,object_bytes-OLD.bytes),metadata_bytes=max(0,metadata_bytes-(${cost('OLD')})) WHERE user_id=OLD.user_id AND changes()=0; END;`);
  statements.push(`CREATE TRIGGER storage_object_update AFTER UPDATE ON object_storage BEGIN ${valid} SELECT CASE WHEN NEW.user_id!=OLD.user_id THEN RAISE(ABORT,'Object storage owner cannot change') END; UPDATE storage_usage SET object_bytes=object_bytes+NEW.bytes-OLD.bytes,metadata_bytes=metadata_bytes+(${cost('NEW')})-(${cost('OLD')}) WHERE user_id=NEW.user_id; SELECT CASE WHEN (object_bytes>${objectQuota} AND NEW.bytes>OLD.bytes) OR (metadata_bytes>${metadataQuota} AND (${cost('NEW')})>(${cost('OLD')})) THEN RAISE(ABORT,'Account file storage limit reached') END FROM storage_usage WHERE user_id=NEW.user_id; END;`);
  return statements;
 }
 statements.push(`CREATE TRIGGER storage_object_insert AFTER INSERT ON object_storage BEGIN ${storageBootstrap('NEW.user_id')} UPDATE storage_usage SET object_bytes=object_bytes+NEW.bytes,metadata_bytes=metadata_bytes+2048 WHERE user_id=NEW.user_id AND changes()=0; SELECT CASE WHEN object_bytes>${objectQuota} OR metadata_bytes>${metadataQuota} THEN RAISE(ABORT,'Account file storage limit reached') END FROM storage_usage WHERE user_id=NEW.user_id; END;`);
 statements.push(`CREATE TRIGGER storage_object_delete AFTER DELETE ON object_storage BEGIN ${storageBootstrap('OLD.user_id')} UPDATE storage_usage SET object_bytes=max(0,object_bytes-OLD.bytes),metadata_bytes=max(0,metadata_bytes-2048) WHERE user_id=OLD.user_id AND changes()=0; END;`);
 statements.push(`CREATE TRIGGER storage_object_update AFTER UPDATE ON object_storage BEGIN SELECT CASE WHEN NEW.user_id!=OLD.user_id THEN RAISE(ABORT,'Object storage owner cannot change') END; UPDATE storage_usage SET object_bytes=object_bytes+NEW.bytes-OLD.bytes WHERE user_id=NEW.user_id; SELECT CASE WHEN object_bytes>${objectQuota} AND NEW.bytes>OLD.bytes THEN RAISE(ABORT,'Account file storage limit reached') END FROM storage_usage WHERE user_id=NEW.user_id; END;`);
 return statements;
}
export function storageLifecycleUpgradeSQL(legacyFileUrlGuard=true){return [...storageQuotaTriggers().map(s=>'DROP TRIGGER '+s.match(/^CREATE TRIGGER (\S+)/)[1]+';'),...storageQuotaTriggers(true,legacyFileUrlGuard)];}
