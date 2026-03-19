# CMS Environment Guide

This project can run your local app against either:

- Production CMS/database (shared with live site)
- Development CMS/database (sandbox)

## Commands

Use these scripts from project root:

```bash
npm run env:use:production
npm run env:use:development
```

Each command pulls Vercel env vars into `.env.local` and switches your local mode.

## Recommended workflow

1. Choose mode:
   - Shared/live content mode: `npm run env:use:production`
   - Safe testing mode: `npm run env:use:development`
2. Restart dev server:
   - stop current server
   - run `npm run dev`
3. Verify mode in terminal logs:
   - look for `[storage] Active mode: r2`
   - confirm content counts match expected environment

## Your current setup goal

If you want local and production to always use the same CMS data:

```bash
npm run env:use:production
npm run dev
```

Now publishing in local admin or production admin updates the same database.

## Later split plan (your future branches)

- `Production-team` branch:
  - use `npm run env:use:production` for content operations
- `Production-public` branch:
  - switch to its own Vercel project/env set when you are ready
  - keep a separate `.env.local` by running the matching pull command for that project

## Notes

- `.env.local` is gitignored and should never be committed.
- `NEXT_PUBLIC_*` values are public by design.
- After any env change, always restart `npm run dev`.
