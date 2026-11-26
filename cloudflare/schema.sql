-- Visit Batroun: visit counts for the admin dashboard (Cloudflare D1).
-- Apply once:  npx wrangler d1 execute visit-batroun --remote --file=cloudflare/schema.sql
CREATE TABLE IF NOT EXISTS events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL,          -- milliseconds since 1970 (UTC)
  day       TEXT    NOT NULL,          -- YYYY-MM-DD, Batroun local time
  hour      INTEGER NOT NULL,          -- 0-23, Batroun local time
  dow       INTEGER NOT NULL,          -- 0 = Monday ... 6 = Sunday
  type      TEXT    NOT NULL,          -- scan | view | locked | listen | directions | home
  stop      TEXT,                      -- landmark id, e.g. "st-george"
  from_stop TEXT,                      -- previous stop scanned by the same phone (for routes)
  lang      TEXT,                      -- en | ar | fr
  device    TEXT,                      -- phone | tablet | desktop
  country   TEXT,                      -- two-letter code from Cloudflare
  visitor   TEXT NOT NULL              -- random id stored on the phone (no personal data)
);
CREATE INDEX IF NOT EXISTS ev_day   ON events(day);
CREATE INDEX IF NOT EXISTS ev_type  ON events(type, day);
CREATE INDEX IF NOT EXISTS ev_vis   ON events(visitor, ts);
