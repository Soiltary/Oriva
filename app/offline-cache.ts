// Private content is encrypted before IndexedDB persistence. The non-extractable
// key is origin-local, owner-scoped, and removed along with content on sign-out.
// This does not protect an unlocked origin against XSS or a compromised profile.
type OfflineSnapshot={user:{id:string;name:string;email:string};items:unknown[];collections:unknown[];preferences:unknown;cachedAt:number};
const pending=new Map<string,Set<Promise<unknown>>>();
function tracked<T>(owner:string,task:Promise<T>){const active=pending.get(owner)||new Set();active.add(task);pending.set(owner,active);void task.finally(()=>{active.delete(task);if(!active.size)pending.delete(owner)}).catch(()=>{});return task}
const revoked=new Set<string>();
const keyTasks=new Map<string,Promise<CryptoKey>>();
async function ownerKey(owner:string){let task=keyTasks.get(owner);if(!task){task=(async()=>{let key=await stored<CryptoKey>('keys',owner);if(!key){key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);if(!revoked.has(owner))await write('keys',owner,key)}return key})();keyTasks.set(owner,task)}return task}
const database=()=>new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('oriva-private-cache',1);request.onupgradeneeded=()=>{request.result.createObjectStore('keys');request.result.createObjectStore('content')};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
async function stored<T>(store:string,key:string):Promise<T|undefined>{const db=await database();try{return await new Promise((resolve,reject)=>{const request=db.transaction(store).objectStore(store).get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}finally{db.close()}}
async function write(store:string,key:string,value:unknown){const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
async function cacheLibraryImpl(snapshot:OfflineSnapshot){
 const owner=snapshot.user.id;if(revoked.has(owner)||localStorage.getItem('oriva-pending-logout'))return;const key=await ownerKey(owner);
 const iv=crypto.getRandomValues(new Uint8Array(12)),data=new TextEncoder().encode(JSON.stringify(snapshot)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(owner)},key,data);
 if(revoked.has(owner))return;await write('content',owner,{iv,cipher});localStorage.setItem('oriva-offline-owner',owner);
}
export async function readCachedLibrary():Promise<OfflineSnapshot|null>{
 const owner=localStorage.getItem('oriva-offline-owner');if(!owner)return null;
 const [key,record]=await Promise.all([stored<CryptoKey>('keys',owner),stored<{iv:Uint8Array;cipher:ArrayBuffer}>('content',owner)]);if(!key||!record)return null;
 try{const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv as Uint8Array<ArrayBuffer>,additionalData:new TextEncoder().encode(owner)},key,record.cipher),snapshot=JSON.parse(new TextDecoder().decode(bytes));return snapshot.user?.id===owner?snapshot:null}catch{return null}
}
export async function forgetCachedLibrary(owner:string){
 revoked.add(owner);await Promise.allSettled([...(pending.get(owner)||[])]);await keyTasks.get(owner)?.catch(()=>{});keyTasks.delete(owner);
 const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['keys','content'],'readwrite');tx.objectStore('keys').delete(owner);const content=tx.objectStore('content'),cursor=content.openCursor();cursor.onsuccess=()=>{const item=cursor.result;if(!item)return;if(item.key===owner||String(item.key).startsWith(owner+':item:'))item.delete();item.continue()};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}finally{db.close()}
 if(localStorage.getItem('oriva-offline-owner')===owner)localStorage.removeItem('oriva-offline-owner');
 for(let i=sessionStorage.length-1;i>=0;i--){const key=sessionStorage.key(i);if(key&&(key.startsWith('oriva-draft:'+owner+':')||key.startsWith('oriva-content-draft:'+owner+':')))sessionStorage.removeItem(key)}
}

async function cacheOpenedItemImpl(owner:string,item:{id:string;[key:string]:unknown}){if(revoked.has(owner))return;const key=await ownerKey(owner);const iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(owner)},key,new TextEncoder().encode(JSON.stringify(item)));if(revoked.has(owner))return;await write('content',owner+':item:'+item.id,{iv,cipher})}
export async function readCachedItem(owner:string,id:string):Promise<Record<string,unknown>|null>{if(localStorage.getItem('oriva-offline-owner')!==owner)return null;const key=await stored<CryptoKey>('keys',owner),record=await stored<{iv:Uint8Array;cipher:ArrayBuffer}>('content',owner+':item:'+id);if(!key||!record)return null;try{return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv as Uint8Array<ArrayBuffer>,additionalData:new TextEncoder().encode(owner)},key,record.cipher)))}catch{return null}}

export function allowOwnerCache(owner:string){revoked.delete(owner);localStorage.setItem('oriva-offline-owner',owner)}
export function cacheLibrary(snapshot:OfflineSnapshot){return tracked(snapshot.user.id,cacheLibraryImpl(snapshot))}
export function cacheOpenedItem(owner:string,item:{id:string;[key:string]:unknown}){return tracked(owner,cacheOpenedItemImpl(owner,item))}
