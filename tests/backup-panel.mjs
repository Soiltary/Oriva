import {call,context,b} from './accounts.mjs';import React from 'react';import TestRenderer,{act} from 'react-test-renderer';import ts from 'typescript';import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const cache=new Map(),requests=[];let view,previewFault=0,storageBlocked=false;
const scope={exports:{},require:createRequire(import.meta.url),crypto,TextEncoder,TextDecoder,window:{confirm:()=>true},sessionStorage:{getItem:k=>{if(storageBlocked)throw Error('Storage blocked');return cache.get(k)||null},setItem:(k,v)=>{if(storageBlocked)throw Error('Storage blocked');cache.set(k,v)},removeItem:k=>{if(storageBlocked)throw Error('Storage blocked');cache.delete(k)}}};
scope.fetch=async(url,options={})=>{const response=previewFault&&url.endsWith('/preview')?Response.json({error:'Synthetic unavailable service'},{status:previewFault}):await context.exports[options.method||'GET'](new Request('https://oriva.test'+url,{...options,headers:{...options.headers,cookie:b.cookie,origin:'https://oriva.test'}}));requests.push({url,method:options.method||'GET',status:response.status});return response;};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/backup-panel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,scope);
const Panel=scope.exports.default,button=text=>view.root.findAllByType('button').find(x=>x.children.join('')===text),idle=async()=>{for(let n=0;n<80;n++){await act(async()=>new Promise(resolve=>setTimeout(resolve,5)));if(!view.root.findAllByType('button').some(x=>x.props.disabled&&x.children.join('')==='Close'))return}throw Error('Panel did not settle')};
const header={type:'header',format:'oriva-complete-backup',version:1,sourceOwner:b.data.user.id},serialized=JSON.stringify(header),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('\n'+serialized)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const file=new File([serialized+'\n'+JSON.stringify({type:'end',records:1,sha256:digest})+'\n'],'synthetic.oriva');
await act(async()=>{view=TestRenderer.create(React.createElement(Panel,{owner:b.data.user.id,lang:'en',onClose(){},onRestored(){}}))});
await act(async()=>view.root.findByType('input').props.onChange({target:{files:[file]}}));await idle();assert.ok(button('Stage or resume restore'));
await act(async()=>button('Stage or resume restore').props.onClick());await idle();assert.ok(button('Recoverable rollback'));
const key=[...cache.keys()][0],rolledBackId=cache.get(key);
await act(async()=>button('Recoverable rollback').props.onClick());await idle();
await act(async()=>button('Stage or resume restore').props.onClick());await idle();
assert.equal(requests.filter(x=>x.url==='/api/restore/start').length,2,'After rollback the same backup must start a fresh session, rather than reusing the rolled-back cached ID');
await act(async()=>view.root.findAllByType('input').find(x=>x.props.type==='checkbox').props.onChange({target:{checked:true}}));
await act(async()=>button('Confirm or resume restore').props.onClick());await idle();assert.ok(JSON.stringify(view.toJSON()).includes('Restore complete'));
const starts=()=>requests.filter(x=>x.url==='/api/restore/start').length;
async function remount(lang='en'){
 await act(async()=>view.unmount());await act(async()=>{view=TestRenderer.create(React.createElement(Panel,{owner:b.data.user.id,lang,onClose(){},onRestored(){}}))});
 await act(async()=>view.root.findByType('input').props.onChange({target:{files:[file]}}));await idle();
}
// A completed restore resumes its status rather than silently duplicating it.
let previous=starts();await remount();await act(async()=>button('Stage or resume restore').props.onClick());await idle();assert.equal(starts(),previous);assert.equal(button('Confirm or resume restore').props.disabled,true);
// Cached IDs left by older versions can already be rolled back or missing.
cache.set(key,rolledBackId);await remount();previous=starts();await act(async()=>button('Stage or resume restore').props.onClick());await idle();assert.equal(starts(),previous+1);assert.notEqual(cache.get(key),rolledBackId);
cache.set(key,crypto.randomUUID());await remount();previous=starts();await act(async()=>button('Stage or resume restore').props.onClick());await idle();assert.equal(starts(),previous+1);
const resumable=cache.get(key);previewFault=500;await remount();previous=starts();await act(async()=>button('Stage or resume restore').props.onClick());await idle();assert.equal(starts(),previous);assert.equal(cache.get(key),resumable);assert.ok(view.root.findByProps({role:'alert'}));
previewFault=0;await act(async()=>button('Stage or resume restore').props.onClick());await idle();assert.equal(starts(),previous);assert.ok(button('Recoverable rollback'));
previewFault=401;await remount('ar');await act(async()=>button('تحضير الاستعادة أو استئنافها').props.onClick());await idle();assert.equal(starts(),previous);assert.ok(view.root.findByProps({role:'alert'}).children.join('').includes('انتهت جلسة الدخول'));assert.equal(cache.get(key),resumable);
previewFault=0;cache.clear();storageBlocked=true;await remount('ar');await act(async()=>button('تحضير الاستعادة أو استئنافها').props.onClick());await idle();assert.equal(starts(),previous+1);assert.ok(button('التراجع القابل للاستعادة'));assert.equal(view.root.findAllByProps({role:'alert'}).length,0);
const bad=new File([serialized+'\n'+JSON.stringify({type:'end',records:1,sha256:'bad'})+'\n'],'invalid-synthetic.oriva');await act(async()=>view.root.findAllByType('input').find(x=>x.props.type==='file').props.onChange({target:{files:[bad]}}));await idle();assert.ok(view.root.findByProps({role:'alert'}).children.join('').includes('فشل التحقق من سلامة'));assert.equal(button('تحضير الاستعادة أو استئنافها'),undefined);
await act(async()=>view.unmount());console.log('PASS mounted backup panel: rollback/restage and old rolled-back/404 caches recover; complete resumes;500/401 preserve session without duplicate starts; Arabic errors; blocked storage fallback; corrupt backup refused.');
