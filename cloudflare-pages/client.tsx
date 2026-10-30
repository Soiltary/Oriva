import React from 'react';
import {createRoot} from 'react-dom/client';
import OrivaApp from '../app/oriva-app';
import '../app/globals.css';
import '../app/premium.css';
import '../app/light.css';
import '../app/theme-ui.css';
import '../app/workspace-upgrade.css';

const mobileView=location.pathname==='/iphone'||location.pathname.startsWith('/iphone/');
if(mobileView){
 document.title='Oriva Mobile — Your library in your pocket';
 document.querySelector('#app-manifest')?.setAttribute('href','/mobile.webmanifest');
 document.querySelector('link[rel="canonical"]')?.setAttribute('href','https://oriva-library.pages.dev/iphone/');
 document.querySelector('meta[property="og:url"]')?.setAttribute('content','https://oriva-library.pages.dev/iphone/');
}
createRoot(document.getElementById('root')!).render(<OrivaApp mobileView={mobileView}/>);
