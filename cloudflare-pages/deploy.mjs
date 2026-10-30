import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here),account='f9b1e5fd6056a136b90ced1f00b53bd9';
if(process.env.CLOUDFLARE_ACCOUNT_ID&&process.env.CLOUDFLARE_ACCOUNT_ID!==account)throw new Error('Wrong Cloudflare account');
const result=spawnSync(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'pages','deploy',path.join(root,'pages-dist'),'--project-name','oriva-library','--branch','main'],{cwd:here,stdio:'inherit',env:{...process.env,CLOUDFLARE_ACCOUNT_ID:account,WRANGLER_SEND_METRICS:'false'}});
if(result.error)throw result.error;process.exit(result.status??1);
