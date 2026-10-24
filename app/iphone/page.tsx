import type {Metadata} from 'next';
import OrivaApp from '../oriva-app';
export const metadata:Metadata={title:'Oriva Mobile — Your library in your pocket',description:'Save files and links from your phone and access the same Oriva library on your computer',manifest:'/mobile.webmanifest',icons:{apple:'/oriva-logo.png'},appleWebApp:{capable:true,title:'Oriva',statusBarStyle:'black-translucent'}};
export default function MobilePage(){return <OrivaApp mobileView/>}
