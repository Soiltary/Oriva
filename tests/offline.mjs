import 'fake-indexeddb/auto';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import vm from 'node:vm';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]||null,get length(){return m.size}}};
const localStorage=storage(),sessionStorage=storage(),ctx={exports:{},indexedDB,crypto,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,localStorage,sessionStorage};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/offline-cache.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx);
const {cacheLibrary,cacheOpenedItem,readCachedLibrary,readCachedItem,forgetCachedLibrary,allowOwnerCache}=ctx.exports;
const snapshot=owner=>({user:{id:owner,name:'Synthetic',email:'synthetic@example.test'},items:[{id:'i',note:'PRIVATE_NOTE'}],collections:[],preferences:{},cachedAt:1});
allowOwnerCache('a');await cacheOpenedItem('a',{id:'article',body:'كامل '.repeat(1000)});await cacheLibrary(snapshot('a'));
assert.equal((await readCachedLibrary()).user.id,'a');assert.equal((await readCachedItem('a','article')).body.length,5000);
const db=await new Promise(resolve=>{const req=indexedDB.open('oriva-private-cache',1);req.onsuccess=()=>resolve(req.result)});
const get=(store,key)=>new Promise(resolve=>{const req=db.transaction(store).objectStore(store).get(key);req.onsuccess=()=>resolve(req.result)});
const record=await get('content','a'),key=await get('keys','a');assert.equal(key.extractable,false);assert.ok(!Buffer.from(record.cipher).includes(Buffer.from('PRIVATE_NOTE')));
allowOwnerCache('b');assert.equal(await readCachedItem('a','article'),null);await cacheLibrary(snapshot('b'));assert.equal((await readCachedLibrary()).user.id,'b');
sessionStorage.setItem('oriva-content-draft:a:article','unsaved');
const ongoing=cacheLibrary(snapshot('a'));await forgetCachedLibrary('a');await ongoing;assert.equal(await get('keys','a'),undefined);assert.equal(await get('content','a'),undefined);assert.equal(await get('content','a:item:article'),undefined);assert.equal(sessionStorage.getItem('oriva-content-draft:a:article'),null);
assert.ok(await get('keys','b'));assert.equal((await readCachedLibrary()).user.id,'b'); // Another owner's cache is preserved.
allowOwnerCache('a');await cacheLibrary(snapshot('a'));assert.equal((await readCachedLibrary()).user.id,'a');
localStorage.setItem('oriva-pending-logout','1');await forgetCachedLibrary('a');await cacheLibrary(snapshot('a'));assert.equal(await get('keys','a'),undefined);
db.close();console.log('PASS actual AES-GCM encryption, non-extractable keys, full-document cache, owner isolation, in-flight sign-out cleanup and blocked cache resurrection. IndexedDB uses a test emulator.');
