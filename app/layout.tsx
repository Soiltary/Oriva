import type { Metadata,Viewport } from 'next';
import './globals.css';
import './premium.css';
import './light.css';
import './theme-ui.css';
import './workspace-upgrade.css';
export const metadata:Metadata={title:'Oriva — Your library, wherever you are',description:'Save links and the thoughts behind them. Your private library, synced between your computer and phone.',icons:{icon:'/oriva-logo.png'},manifest:'/manifest.webmanifest'};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',colorScheme:'light dark',themeColor:[{media:'(prefers-color-scheme: light)',color:'#ffffff'},{media:'(prefers-color-scheme: dark)',color:'#090c16'}]};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl" suppressHydrationWarning><head><meta name="darkreader-lock"/><script dangerouslySetInnerHTML={{__html:`(()=>{let m='system';try{let s=localStorage.getItem('oriva-theme');if(s==='light'||s==='dark')m=s}catch{}let t=m==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t==='light'?'only light':'dark';let c=document.querySelector('meta[name="color-scheme"]');if(c)c.content=t==='light'?'only light':'dark'})()`}}/></head><body>{children}</body></html>}
