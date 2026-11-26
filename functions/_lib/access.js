// Checks the Cloudflare Access login on every /admin and /api/admin request.
// Access itself blocks strangers at Cloudflare's edge; this is a second lock in
// case the Access rule is ever removed or misconfigured: no valid Access token
// for an allowed email means no data.
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), c => c.charCodeAt(0));
const json = s => JSON.parse(new TextDecoder().decode(b64u(s)));
let certCache = { at: 0, keys: [] };

async function certs(team){
  if (Date.now() - certCache.at < 3600e3 && certCache.keys.length) return certCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error("certs");
  certCache = { at: Date.now(), keys: (await r.json()).keys || [] };
  return certCache.keys;
}
function cookie(req, name){
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}
export async function adminEmail(request, env){
  const url = new URL(request.url);
  // Local testing only (npx wrangler pages dev): never true on the real site.
  if (env.ALLOW_LOCAL_DEV === "1" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return "local-dev";
  const token = request.headers.get("Cf-Access-Jwt-Assertion") || cookie(request, "CF_Authorization");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  try {
    const [h, p, sig] = token.split(".");
    const head = json(h), body = json(p);
    const jwk = (await certs(env.ACCESS_TEAM_DOMAIN)).find(k => k.kid === head.kid);
    if (!jwk || head.alg !== "RS256") return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(sig), new TextEncoder().encode(h + "." + p));
    const aud = Array.isArray(body.aud) ? body.aud : [body.aud];
    const now = Date.now() / 1000;
    if (!ok || !aud.includes(env.ACCESS_AUD) || body.iss !== `https://${env.ACCESS_TEAM_DOMAIN}` || !(body.exp > now) || (body.nbf && body.nbf > now + 60)) return null;
    const email = String(body.email || "").toLowerCase();
    const allowed = String(env.ADMIN_EMAILS || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
    return allowed.includes(email) ? email : null;
  } catch(_){ return null; }
}
export async function requireAdmin(context){
  const who = await adminEmail(context.request, context.env);
  if (!who) return new Response("Not allowed", { status: 403, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
  context.data.admin = who;
  const res = await context.next();
  const out = new Response(res.body, res);
  out.headers.set("cache-control", "no-store");
  out.headers.set("x-robots-tag", "noindex, nofollow");
  return out;
}
