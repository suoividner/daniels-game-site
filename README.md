# Daniel's Game — Website (Next.js + Supabase)

**You get:** a site where players sign in with **Discord**, buy from a **daily shop**, see the **leaderboard**, and view their **private inventory**. **Only you** (admin) can change scores/balances.

---
## Quick setup (copy/paste friendly)

### 0) Download & unzip
Unzip this folder somewhere easy (Desktop is fine).

### 1) Make a free Supabase project
- Go to supabase.com → create a project (free plan).
- In **Project Settings → API**, copy **Project URL** and **anon public key**.

### 2) Enable Discord login
- In Supabase: **Auth → Providers → Discord → Enable**.
- In Discord: https://discord.com/developers → **New Application** → OAuth2 → add Redirect URL:
  - Local dev: `http://localhost:3000/auth/v1/callback`
  - When deployed: `https://YOUR-SITE-DOMAIN/auth/v1/callback`
- Paste the Discord Client ID/Secret into Supabase provider settings.

### 3) Make yourself the admin (by Discord ID)
- In Discord: Settings → Advanced → **Developer Mode ON**. Right‑click yourself → **Copy User ID**.
- In Supabase **SQL Editor**, run:
```
select set_config('app.admin_discord_id', '<PASTE_YOUR_DISCORD_ID>', true);
```
(Leave the SQL editor open.)

### 4) Create tables, rules, and items
- Open the `supabase.sql` file from this project.
- Copy/paste it into Supabase **SQL Editor** and run it. Done.

### 5) Deploy the site (cheap/free)
**A) Vercel (recommended)**
- vercel.com → New Project → Import this folder (push to GitHub first or drag-drop).
- Set environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon public key
- Deploy.

**B) Run locally (optional)**
- Install Node.js from nodejs.org (LTS).
- In a terminal inside this folder:
```
npm install
npm run dev
```
- Open http://localhost:3000

### 6) First login
- Visit the site → **Sign in with Discord**.
- Because you set the admin Discord ID earlier, your role will be **admin**.

### 7) Use Admin page
- Go to **Admin** in the navbar.
- Pick a player → **Adjust Score** / **Adjust Coins** (never below 0).
- Click **Refresh Shop** once a day to roll 10 random items.

### 8) Players
- Players also **Sign in with Discord**.
- They can buy items (limited daily stock), see **My Inventory**, and **trash** items if full (max 5).

---
## Notes
- This site **does not connect to Discord** chats. You still run the game in Discord; use the Admin page to record results.
- Complex item effects (Copycat, Poison, etc.) are tracked as inventory only; apply the impact manually via Admin.
- `WOUND` is special: spend coins and reduce score manually per your rule.

## Fixes if stuck
- **Login loop**: redirect URLs must match exactly in both Discord Dev Portal and Supabase.
- **Not admin**: set your Discord ID (Step 3) then log out/in.
- **Empty shop**: visit Admin → Refresh Shop.
