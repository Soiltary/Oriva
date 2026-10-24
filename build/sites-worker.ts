import handler from "vinext/server/fetch-handler";
// Public Oriva entry point; no connector capabilities or preview identities.
export default { fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
  return handler.fetch(request, env, ctx);
} };
