# OMA Aircraft Temps

Vite + React + Tailwind web app for overnight RON aircraft prep, on-the-go cabin temperature logging, and a desktop-friendly dashboard. Connects directly to Supabase (no auth yet).

## Getting started

```bash
npm install
npm run dev
```

Environment variables (already provisioned in deployment):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

You can copy `.env.example` to `.env` for local runs (includes the provided OMA Supabase anon key).

If you need admin features like creating users via Supabase Admin API, add `VITE_SUPABASE_SERVICE_ROLE_KEY` to your environment (never expose this key in client builds).

## App routes

- `/prep` – tonight's aircraft (add/update tails, purge toggle)
- `/log` – mobile-first logging with mark-in + purge sync
- `/dashboard` – management snapshot with filters, cards, and nightly history
- `/reports` – archived aircraft and temperature logs
- `/admin` – admin-only user management UI (protected by Supabase RLS)

## Database

- `db/profiles.sql` contains the `profiles` table definition (id/full_name/email/role/station/is_active + timestamps) and RLS policies to ensure only admins can manage users while individuals can read/update their own active profile.
