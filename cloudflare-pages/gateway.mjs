const UPSTREAM='https://oriva.soltairy.chatgpt.site';
const PRODUCTION='https://oriva-library.pages.dev';
function allowedOrigin(url){return url.origin===PRODUCTION||(url.protocol==='https:'&&/^[a-z0-9-]+\.oriva-library\.pages\.dev$/.test(url.hostname));}
const jsonError=(error,status)=>Response.json({error},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function gateway(request,fetcher=fetch){
 const current=new URL(request.url);
 if(!allowedOrigin(current))return jsonError('Unknown application origin',403);
 const unsafe=!['GET','HEAD','OPTIONS'].includes(request.method);
 const origin=request.headers.get('origin');
 if((unsafe&&!origin)||(origin&&origin!==current.origin))return jsonError('Invalid request origin',403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 const headers=new Headers();
 for(const name of ['accept','content-type','content-length','range','if-none-match']){const value=request.headers.get(name);if(value)headers.set(name,value);}
 const cookie=request.headers.get('cookie')?.split(';').map(c=>c.trim()).find(c=>c.startsWith('__Host-oriva='));
 if(cookie)headers.set('cookie',cookie);
 if(unsafe)headers.set('origin',UPSTREAM);
 const init={method:request.method,headers,redirect:'manual'};
 if(!['GET','HEAD'].includes(request.method)){init.body=request.body;init.duplex='half';}
 let response;
 try{response=await fetcher(UPSTREAM+current.pathname+current.search,init);}catch{return jsonError('The existing Oriva data service is temporarily unavailable',502);}
 const resultHeaders=new Headers(response.headers);
 // Do not expose hosting-provider cookies on the new application origin.
 const cookies=typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():response.headers.getAll('Set-Cookie');
 resultHeaders.delete('set-cookie');
 for(const cookie of cookies)if(cookie.startsWith('__Host-oriva='))resultHeaders.append('set-cookie',cookie);
 resultHeaders.set('cache-control','private, no-store');
 resultHeaders.set('x-content-type-options','nosniff');
 resultHeaders.delete('access-control-allow-origin');
 resultHeaders.delete('access-control-allow-credentials');
 const location=resultHeaders.get('location');
 if(location){try{const target=new URL(location,UPSTREAM);if(target.origin===UPSTREAM){resultHeaders.set('location',current.origin+target.pathname+target.search+target.hash);}}catch{}}
 // Oriva uses __Host-oriva with Secure, HttpOnly, Path=/ and no Domain.
 // Forwarding that host-only Set-Cookie scopes the new session to Pages.
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers:resultHeaders});
}
export default {fetch(request,env){const url=new URL(request.url);return url.pathname==='/api'||url.pathname.startsWith('/api/')?gateway(request):env.ASSETS.fetch(request);}};
