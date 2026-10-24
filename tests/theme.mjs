import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import postcss from 'postcss';
const layout=fs.readFileSync('app/layout.tsx','utf8');
const script=layout.match(/__html:`([^`]+)`/s)?.[1];
assert.ok(script,'Initial appearance must be resolved before the first paint');
for(const [saved,systemDark,want] of [['light',true,'light'],['dark',false,'dark'],['system',true,'dark'],['system',false,'light'],[null,true,'dark'],['invalid',false,'light']]){
 const root={dataset:{},style:{}};
 vm.runInNewContext(script,{localStorage:{getItem:()=>saved},matchMedia:()=>({matches:systemDark}),document:{documentElement:root,querySelector:()=>null}});
 assert.equal(root.dataset.theme,want,`Saved ${saved}, system dark=${systemDark}`);
 assert.equal(root.style.colorScheme,want==='light'?'only light':'dark');
}
const root={dataset:{},style:{}};
vm.runInNewContext(script,{localStorage:{getItem:()=>{throw Error('Blocked storage')}},matchMedia:()=>({matches:false}),document:{documentElement:root,querySelector:()=>null}});
assert.equal(root.dataset.theme,'light','Unavailable storage must fall back to system without breaking startup');
const css=postcss.parse(fs.readFileSync('app/light.css','utf8'));
let rules=0;css.walkRules(rule=>{rules++;for(const selector of rule.selectors)assert.ok(selector.startsWith(':root[data-theme="light"]'),`Unscoped light selector ${selector}`)});
assert.ok(rules>100);assert.equal(css.nodes.some(n=>n.type==='atrule'&&n.params.includes('prefers-color-scheme')),false,'System CSS must not override a manually chosen mode');
console.log('PASS: explicit preferences override the OS, system mode follows it, blocked storage falls back safely, and all light styles are scoped');

// Exercise the actual selector's apply function, including native browser colors.
const themeSource=ts.transpileModule(fs.readFileSync('app/theme-control.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const themeColor={content:'',removeAttribute(name){this.removed=name}},colorScheme={content:''};
const dom={documentElement:{dataset:{},style:{}},querySelectorAll(selector){return selector==='meta[name="color-scheme"]'?[colorScheme]:[themeColor]}};
const context={exports:{},require:()=>({}),document:dom};vm.runInNewContext(themeSource,context);
for(const [mode,os,want] of [['light',true,'light'],['dark',false,'dark'],['system',true,'dark'],['system',false,'light']]){
 context.exports.applyTheme(mode,os);assert.equal(dom.documentElement.dataset.theme,want);assert.equal(dom.documentElement.style.colorScheme,want==='light'?'only light':'dark');assert.equal(colorScheme.content,want==='light'?'only light':'dark');assert.equal(themeColor.content,want==='light'?'#ffffff':'#090c16');assert.equal(themeColor.removed,'media');
}
assert.match(layout,/<meta name="darkreader-lock"/);assert.match(fs.readFileSync('app/light.css','utf8'),/color-scheme:only light/);
console.log('PASS: manual and system switching update the actual DOM and browser metadata; light opts out of automatic darkening, with a Dark Reader lock');
