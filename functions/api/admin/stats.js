// Numbers for the admin dashboard. Protected by ../admin/_middleware.js.
const TZ = "Asia/Beirut";
const dayStr = d => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export async function onRequestGet({ request, env }){
  const url = new URL(request.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "30", 10) || 30, 1), 730);
  const now = new Date();
  const to = dayStr(now);
  const from = dayStr(new Date(now.getTime() - (days - 1) * 864e5));
  const pFrom = dayStr(new Date(now.getTime() - (2 * days - 1) * 864e5));
  const pTo = dayStr(new Date(now.getTime() - days * 864e5));
  const q = (sql, ...a) => env.DB.prepare(sql).bind(...a);
  const W = "day BETWEEN ? AND ?";
  const totalsSQL = `SELECT
      SUM(type='scan') AS scans,
      COUNT(DISTINCT visitor) AS visitors,
      SUM(type='listen') AS listens,
      SUM(type='directions') AS directions,
      SUM(type IN ('view','locked')) AS views,
      COUNT(DISTINCT CASE WHEN type='scan' THEN visitor||'|'||stop END) AS unlocks
    FROM events WHERE ${W}`;
  const r = await env.DB.batch([
    q(totalsSQL, from, to),
    q(totalsSQL, pFrom, pTo),
    q(`SELECT stop, SUM(type='scan') AS scans, SUM(type='listen') AS listens, SUM(type='directions') AS directions,
         COUNT(DISTINCT CASE WHEN type='scan' THEN visitor END) AS visitors
       FROM events WHERE ${W} AND stop IS NOT NULL GROUP BY stop`, from, to),
    q(`SELECT day, SUM(type='scan') AS scans, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ${W} GROUP BY day ORDER BY day`, from, to),
    q(`SELECT dow, hour, COUNT(*) AS scans FROM events WHERE ${W} AND type='scan' GROUP BY dow, hour`, from, to),
    q(`SELECT lang AS k, COUNT(DISTINCT visitor) AS n FROM events WHERE ${W} AND lang IS NOT NULL GROUP BY lang`, from, to),
    q(`SELECT device AS k, COUNT(DISTINCT visitor) AS n FROM events WHERE ${W} AND device IS NOT NULL GROUP BY device`, from, to),
    q(`SELECT country AS k, COUNT(DISTINCT visitor) AS n FROM events WHERE ${W} AND country IS NOT NULL GROUP BY country ORDER BY n DESC LIMIT 10`, from, to),
    q(`SELECT from_stop AS a, stop AS b, COUNT(*) AS n FROM events WHERE ${W} AND type='scan' AND from_stop IS NOT NULL GROUP BY from_stop, stop ORDER BY n DESC LIMIT 10`, from, to),
    q(`SELECT n, COUNT(*) AS visitors FROM (SELECT visitor, COUNT(DISTINCT stop) AS n FROM events WHERE ${W} AND type='scan' GROUP BY visitor) GROUP BY n`, from, to),
  ]);
  const rows = i => r[i].results || [];
  const body = {
    range: { days, from, to }, generated: now.toISOString(), sample: false,
    totals: rows(0)[0] || {}, previous: rows(1)[0] || {},
    perStop: rows(2), perDay: rows(3), heat: rows(4),
    langs: rows(5), devices: rows(6), countries: rows(7), routes: rows(8), progress: rows(9),
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
