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

## App routes

- `/prep` – tonight's aircraft (add/update tails, purge toggle)
- `/log` – mobile-first logging with mark-in + purge sync
- `/dashboard` – management snapshot with filters, cards, and nightly history
