# Visit Batroun on Cloudflare: scan counts + private admin page

What this adds:

- **`/api/hit`** (functions/api/hit.js): the public site sends one small, anonymous note when someone scans a QR code, opens a stop, plays a story or taps Directions. It stores no names, emails or IP addresses. It only keeps a random id saved on the phone, plus the stop, language, device type and country.
- **D1 database** `visit-batroun` (cloudflare/schema.sql): stores those notes in a single table, `events`.
- **`/admin`** (admin/index.html): the insights dashboard. Until the database answers, for example on GitHub Pages, it shows clearly labelled sample data.
- **Cloudflare Access** keeps the admin page private to one email. The functions in functions/_lib/access.js also check the Access login a second time, so the numbers stay private even if the Access rule is ever removed.

## One-time setup (about 20 minutes)

1. **Create the database.** In the Cloudflare dashboard, go to Storage & Databases → D1 → Create, and name it `visit-batroun`. Copy its **Database ID**. Open the database's **Console** tab, paste everything from `cloudflare/schema.sql`, and run it.
2. **Fill in `wrangler.toml`.**
   - `database_id`: the ID from step 1.
   - `ADMIN_EMAILS`: the admin email. To allow more than one person, separate the addresses with commas.
   - `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`: these come from step 4.
3. **Connect the site.** Go to Workers & Pages → Create → Pages → Connect to Git, and choose `joykamel213-byte/visit-batroun`.
   - Framework preset: None.
   - Build command: leave it empty.
   - Build output directory: `/`.
   - Deploy. The site appears at `https://visit-batroun.pages.dev`, or on your own domain once you add one under Custom domains.
4. **Lock the admin page.**
   1. Open Zero Trust from the dashboard and choose a team name. Your team domain is `<team>.cloudflareaccess.com`.
   2. Go to Access → Applications → Add an application → Self-hosted, and name it "Batroun admin".
   3. Add two destinations on the site's domain: path `admin` and path `api/admin`.
   4. Add a policy: Action Allow → Include → Emails → the admin email.
   5. Login method: One-time PIN. It's on by default: Cloudflare emails a 6-digit code to that address at each login, so there's no password to steal. Google login also works if the admin account has 2-step verification.
   6. Save, then copy the **Application Audience (AUD) Tag** into `ACCESS_AUD`, and the team domain into `ACCESS_TEAM_DOMAIN`.
   7. In the Pages project, also turn on Settings → General → "Access policy" for preview deployments.
5. **Push** the updated `wrangler.toml`. Cloudflare redeploys by itself.
6. **Test.**
   - Open `/admin`. Cloudflare should ask for the email and then a code, and the dashboard should load **without** the "Sample data" banner.
   - From a private window, try a different email. It should be refused.
   - Scan any QR code, then reload the dashboard. The scan should show up.

## The QR codes must point to the Cloudflare address

Scans are only counted where the site runs on Cloudflare. GitHub Pages has no backend, so a scan there isn't counted. Print the QR codes with the final address: open `#qr-admin-batroun` on the Cloudflare site and change the base address field. If codes with the github.io address are already up, the GitHub copy can forward visitors to the Cloudflare address, keeping the stop and its key in the link.

## Optional

- **Rate limit (needs your own domain).** Go to Security → WAF → Rate limiting rules. Block `/api/hit` above 30 requests per 10 seconds from one IP. This stops anyone from padding the numbers.
- **Local test.**
  - `npx wrangler d1 execute visit-batroun --local --file=cloudflare/schema.sql`
  - then `npx wrangler pages dev . --binding ALLOW_LOCAL_DEV=1`
  - then open http://localhost:8788/admin/. `ALLOW_LOCAL_DEV` only opens the admin page on localhost. Never set it on the real site.
