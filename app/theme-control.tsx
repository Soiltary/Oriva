'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,Monitor,Moon,Sun} from 'lucide-react';
export type ThemeMode='light'|'dark'|'system';
export const THEME_KEY='oriva-theme';
export function validTheme(value:string|null):ThemeMode{return value==='light'||value==='dark'?value:'system'}
export function resolvedTheme(mode:ThemeMode,systemDark:boolean){return mode==='system'?(systemDark?'dark':'light'):mode}
export function applyTheme(mode:ThemeMode,systemDark:boolean){const theme=resolvedTheme(mode,systemDark);document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme==='light'?'only light':'dark';document.querySelectorAll<HTMLMetaElement>('meta[name="color-scheme"]').forEach(meta=>{meta.content=theme==='light'?'only light':'dark'});document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta=>{meta.content=theme==='dark'?'#090c16':'#ffffff';meta.removeAttribute('media')})}
export default function ThemeControl({lang}:{lang:'ar'|'en'}){
 const [mode,setMode]=useState<ThemeMode|null>(null);const popup=useRef<HTMLDetailsElement>(null);
 // Read origin storage after hydration and subscribe to external changes.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{let saved:ThemeMode='system';try{saved=validTheme(localStorage.getItem(THEME_KEY))}catch{}setMode(saved);const storage=(e:StorageEvent)=>{if(e.key===THEME_KEY||e.key===null)setMode(validTheme(e.key===null?null:e.newValue))};window.addEventListener('storage',storage);return()=>window.removeEventListener('storage',storage)},[]);
 useEffect(()=>{if(mode===null)return;const media=window.matchMedia('(prefers-color-scheme: dark)');const update=()=>applyTheme(mode,media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[mode]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(popup.current&&!popup.current.contains(e.target as Node))popup.current.open=false};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[]);
 const labels=lang==='ar'?{light:'فاتح',dark:'داكن',system:'النظام'}:{light:'Light',dark:'Dark',system:'System'};const current=mode||'system';const Icon=current==='light'?Sun:current==='dark'?Moon:Monitor;
 function choose(value:ThemeMode){setMode(value);try{localStorage.setItem(THEME_KEY,value)}catch{}applyTheme(value,window.matchMedia('(prefers-color-scheme: dark)').matches);if(popup.current){popup.current.open=false;popup.current.querySelector('summary')?.focus()}}
 return <details className="theme-control" ref={popup} dir={lang==='ar'?'rtl':'ltr'} onKeyDown={e=>{if(e.key==='Escape'&&popup.current?.open){popup.current.open=false;popup.current.querySelector('summary')?.focus();e.stopPropagation()}}}><summary aria-label={(lang==='ar'?'المظهر: ':'Appearance: ')+labels[current]} title={(lang==='ar'?'المظهر: ':'Appearance: ')+labels[current]}><Icon size={18}/></summary><div className="theme-options" role="group" aria-label={lang==='ar'?'اختيار المظهر':'Choose appearance'}><span>{lang==='ar'?'المظهر':'Appearance'}</span>{(['light','dark','system'] as ThemeMode[]).map(value=>{const OptionIcon=value==='light'?Sun:value==='dark'?Moon:Monitor;return <button type="button" key={value} aria-pressed={current===value} onClick={()=>choose(value)}><OptionIcon size={17}/><span>{labels[value]}</span>{current===value&&<Check size={15}/>}</button>})}</div></details>
}
