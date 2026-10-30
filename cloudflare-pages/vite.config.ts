import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
export default defineConfig({
 root:here,publicDir:path.join(root,'public'),base:'/',
 resolve:{alias:{'next/link':path.join(here,'link.tsx'),'@':root}},
 plugins:[react(),{
  name:'official-oriva-download',
  transform(code,id){if(id.split('?')[0].replaceAll('\\','/').endsWith('/app/oriva-app.tsx'))return code.replaceAll('https://github.com/Soiltary/Oriva/releases"','https://github.com/Soiltary/Oriva/releases/download/v1.0.0/Oriva-Windows-x64-v1.0.0.zip"');}
 }],
 build:{outDir:path.join(root,'pages-dist'),emptyOutDir:true,sourcemap:false},
});
