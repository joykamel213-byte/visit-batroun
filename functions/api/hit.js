// Records one anonymous event from the public site (see "hit()" in index.html).
import { STOPS } from "../_lib/stops.js";
const TYPES = new Set(["scan", "view", "locked", "listen", "directions", "home"]);
const LANGS = new Set(["en", "ar", "fr"]), DEVICES = new Set(["phone", "tablet", "desktop"]);
const IDS = new Set(STOPS.map(s => s.id));
const TZ = "Asia/Beirut";
const parts = d => Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(d).map(p => [p.type, p.value]));
const DOW = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const ok = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function onRequestPost({ request, env }){
  const len = +(request.headers.get("content-length") || 0);
  if (len > 1000) return ok();
  let b; try { b = JSON.parse(await request.text()); } catch(_){ return ok(); }
  if (!b || !TYPES.has(b.t)) return ok();
  const stop = b.s && IDS.has(b.s) ? b.s : null;
  if (b.t !== "home" && !stop) return ok();
  const visitor = typeof b.v === "string" && /^[\w-]{8,64}$/.test(b.v) ? b.v : null;
  if (!visitor) return ok();
  const now = new Date(), p = parts(now);
  const ts = now.getTime();
  // Ignore repeats of the same thing from the same phone within 10 seconds (double taps, reloads).
  const dup = await env.DB.prepare("SELECT 1 FROM events WHERE visitor = ? AND type = ? AND IFNULL(stop,'') = ? AND ts > ? LIMIT 1")
    .bind(visitor, b.t, stop || "", ts - 10000).first();
  if (dup) return ok();
  await env.DB.prepare("INSERT INTO events (ts, day, hour, dow, type, stop, from_stop, lang, device, country, visitor) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .bind(ts, `${p.year}-${p.month}-${p.day}`, +p.hour % 24, DOW[p.weekday] ?? 0, b.t, stop,
          b.f && IDS.has(b.f) && b.f !== stop ? b.f : null,
          LANGS.has(b.l) ? b.l : null, DEVICES.has(b.d) ? b.d : null,
          (request.cf && request.cf.country) || null, visitor).run();
  return ok();
}
export const onRequest = () => new Response("Method not allowed", { status: 405 });
