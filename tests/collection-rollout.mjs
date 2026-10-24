import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {spawnSync} from 'node:child_process';
import {schemaOnlyProposal,collectionBackfillPage} from '../scripts/collection-rollout.mjs';
const history=()=>Object.fromEntries(fs.readdirSync('drizzle',{recursive:true}).filter(x=>/\.(sql|json)$/.test(x)).map(x=>[x,crypto.createHash('sha256').update(fs.readFileSync(path.join('drizzle',x))).digest('hex')]));
const before=history(),proposal=schemaOnlyProposal(process.cwd());assert.equal(proposal.deploymentAuthorized,false);assert.equal(proposal.separatedBackfills,1);
const db=new DatabaseSync(':memory:');
try{
 for(const migration of proposal.migrations.slice(0,3))for(const sql of migration.statements)db.exec(sql);
 const insert=db.prepare('INSERT INTO items(id,user_id,url,title,collection,created,updated) VALUES(?,?,?,?,?,?,?)');
 for(let i=0;i<10000;i++)insert.run(String(i).padStart(8,'0'),'owner-'+i%17,'https://example.test/'+i,'محفوظ '+i,i%7===0?'   ':i%3===0?' بحث ':'بحث '+i%23,10000-i,20000+i);
 const old=()=>db.prepare('SELECT id,user_id,url,title,note,tags,collection,status,favorite,created,updated,image,kind,file_key,file_name,file_size,file_type FROM items ORDER BY id').all();
 const values=old();for(const migration of proposal.migrations.slice(3))for(const sql of migration.statements)db.exec(sql);
 assert.deepEqual(old(),values);assert.equal(db.prepare('SELECT COUNT(*) n FROM collections').get().n,0);
 db.prepare('INSERT INTO collections(id,user_id,name,icon,color,parent_id,created,updated,revision) VALUES(?,?,?,?,?,?,?,?,?)').run('existing-owner-group','owner-1','بحث 1','star','#123456','custom-parent',1,2,8);
 const existing=db.prepare('SELECT * FROM collections WHERE id=?').get('existing-owner-group');let largestPage=0;
 const adapter={prepare(query){let args=[];return {bind(...values){args=values;return this},async first(){return db.prepare(query).get(...args)},async all(){const results=db.prepare(query).all(...args);largestPage=Math.max(largestPage,results.length);return {results}},async run(){return db.prepare(query).run(...args)}}},async batch(statements){db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}}};
 const initialDigest=JSON.stringify(db.prepare('SELECT * FROM collections ORDER BY id').all());
 const interrupted={...adapter,async batch(statements){db.exec('BEGIN');try{await statements[0].run();throw new Error('synthetic interruption')}finally{db.exec('ROLLBACK')}}};
 await assert.rejects(()=>collectionBackfillPage(interrupted,null,37),/synthetic interruption/);assert.equal(JSON.stringify(db.prepare('SELECT * FROM collections ORDER BY id').all()),initialDigest);
 const scan=db.prepare('EXPLAIN QUERY PLAN SELECT id,user_id,collection,created,updated FROM items WHERE id>? AND id<=? ORDER BY id LIMIT ?').all('','99999999',37);assert.ok(scan.some(x=>x.detail.includes('SEARCH items USING INDEX')));assert.ok(!scan.some(x=>x.detail.includes('TEMP B-TREE')));
 let page=await collectionBackfillPage(adapter,null,37);const firstCursor=page.cursor;
 await collectionBackfillPage(adapter,null,37);page=await collectionBackfillPage(adapter,firstCursor,37);
 let pages=2;while(!page.done){page=await collectionBackfillPage(adapter,JSON.parse(JSON.stringify(page.cursor)),37);pages++}
 assert.ok(pages>200);assert.equal(largestPage,37);assert.deepEqual(old(),values);assert.deepEqual(db.prepare('SELECT * FROM collections WHERE id=?').get('existing-owner-group'),existing);
 const expected=db.prepare("SELECT user_id,name,min(created) created,max(updated) updated FROM (SELECT user_id,collection name,created,updated FROM items WHERE length(trim(collection))>0) GROUP BY user_id,name ORDER BY user_id,name").all(),actual=db.prepare('SELECT user_id,name,created,updated FROM collections ORDER BY user_id,name').all();assert.equal(actual.length,expected.length);
 for(let i=0;i<expected.length;i++)if(expected[i].user_id!=='owner-1'||expected[i].name!=='بحث 1')assert.deepEqual(actual[i],expected[i]);
 const digest=()=>crypto.createHash('sha256').update(JSON.stringify(db.prepare('SELECT * FROM collections ORDER BY id').all())).digest('hex');const complete=digest();let replay=await collectionBackfillPage(adapter,null,100);while(!replay.done)replay=await collectionBackfillPage(adapter,replay.cursor,100);assert.equal(digest(),complete);
 await assert.rejects(()=>collectionBackfillPage(adapter,null,101));await assert.rejects(()=>collectionBackfillPage(adapter,{after:'z',through:'a'}));
 for(const args of [[],['--check'],['--regenerate']]){const child=spawnSync(process.execPath,['scripts/sync-migration-snapshots.mjs',...args],{encoding:'utf8'});assert.equal(child.status,args.includes('--regenerate')?1:0,child.stderr)}
 assert.deepEqual(history(),before);console.log('PASS schema-only proposal, 10,000 legacy rows unchanged; bounded resumable/replay-safe collection backfill, Arabic exact names, existing metadata preserved; snapshot command cannot rewrite history. Provider rollout remains gated.');
}finally{db.close()}
