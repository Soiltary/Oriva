import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import React from 'react';
const vinextRoot=fs.realpathSync(new URL('../node_modules/vinext',import.meta.url)),fromVinext=createRequire(path.join(vinextRoot,'package.json'));
const ogPackage=fromVinext.resolve('@vercel/og/package.json'),ogRoot=path.dirname(ogPackage),og=JSON.parse(fs.readFileSync(ogPackage,'utf8')),fromOg=createRequire(ogPackage);
assert.equal(og.name,'@oriva/og-compat');assert.equal(og.version,'0.0.0');
assert.equal(JSON.parse(fs.readFileSync(fromOg.resolve('next/package.json'),'utf8')).version,'16.4.1');
// Render through the actual framework shim, without remote fonts or assets.
const {ImageResponse}=await import(pathToFileURL(path.join(vinextRoot,'dist/shims/og.js')));
const response=new ImageResponse(React.createElement('div',{style:{display:'flex',fontSize:24,background:'white',color:'black'}},'Oriva <script> & safe'),{width:320,height:120});
const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(bytes.readUInt32BE(16),320);assert.equal(bytes.readUInt32BE(20),120);assert.match(response.headers.get('content-type'),/image\/png/);
// Reach the upstream serializer seam without rewriting its implementation.
// The renderer is byte-for-byte upstream plus one test-only export; copy its
// own local assets into a fresh disposable fixture, never the live package.
const os=await import('node:os'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'oriva-og-regression-'));
try{
 const upstream=fromOg.resolve('next/dist/compiled/@vercel/og/index.node.js'),source=fs.readFileSync(upstream,'utf8');
 const instrumented=path.join(temp,'renderer.mjs');fs.writeFileSync(instrumented,source+'\nexport { satori as fixtureSatori };\n');
 for(const name of ['Geist-Regular.ttf','resvg.wasm','yoga.wasm'])fs.copyFileSync(path.join(path.dirname(upstream),name),path.join(temp,name));
 const {fixtureSatori}=await import(pathToFileURL(instrumented));
 const font=fs.readFileSync(path.join(temp,'Geist-Regular.ttf'));
 const svg=await fixtureSatori(React.createElement('div',{style:{display:'flex',fontSize:18}},'Literal <script>alert(1)</script> & quotes "'),{width:300,height:80,embedFont:false,fonts:[{name:'Geist',data:font,weight:400,style:'normal'}]});
 assert.ok(svg.startsWith('<svg'));assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;')&&svg.includes('&gt;'));
 const injected=await fixtureSatori(React.createElement('div',{style:{color:'red"/><path data-pwned="true"/><text fill="red'}},'safe'),{width:300,height:80,embedFont:false,fonts:[{name:'Geist',data:font,weight:400,style:'normal'}]});
 assert.ok(!injected.includes('<path data-pwned="true"'));assert.ok(injected.includes('fill="red&quot;/&gt;&lt;path data-pwned=&quot;true&quot;/&gt;&lt;text fill=&quot;red"'));
 await assert.rejects(()=>fixtureSatori(React.createElement('div',{style:{display:'flex',_inheritedClipPathId:'\"><script>alert(1)</script>'}},'safe'),{width:300,height:80,fonts:[{name:'Geist',data:font,weight:400,style:'normal'}]}),/Invalid style property/);
}finally{assert.equal(path.dirname(path.resolve(temp)),path.resolve(os.tmpdir()));assert.ok(path.basename(temp).startsWith('oriva-og-regression-'));fs.rmSync(temp,{recursive:true,force:true});}
console.log('PASS pinned Next patched renderer adapter: actual Vinext ImageResponse PNG/dimensions/headers, escaped text and rejected internal-style injection; local assets only.');
