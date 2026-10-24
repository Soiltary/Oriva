// Derived from the existing MIT-licensed Sites plugin; see its LICENSE.
// Public export retains artifact copying only. Private local sign-in emulation
// is deliberately absent; Oriva authenticates with its own API.
import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";
export function sites(): Plugin {
  let root = process.cwd(), command: "build" | "serve" = "build";
  return { name: "sites", configResolved(config) { root=config.root; command=config.command; },
    async closeBundle() {
      if(command!=="build") return;
      const output=resolve(root,"dist",".openai");
      await rm(output,{recursive:true,force:true}); await mkdir(output,{recursive:true});
      await cp(resolve(root,".openai","hosting.json"),resolve(output,"hosting.json"));
      try { await access(resolve(root,"drizzle")); }
      catch(error) { if((error as NodeJS.ErrnoException).code==="ENOENT") return; throw error; }
      await cp(resolve(root,"drizzle"),resolve(output,"drizzle"),{recursive:true});
    }
  };
}
