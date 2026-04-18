# Eveninghf Academy Management Systemssss

Local-first management app for a private evening tutoring academy. HhPhase 1
scaffold: auth, i18n (French / Arabic RTL), data model, and CRUD for students,
teachers, subjects, classrooms, and the weekly timetable. Financial modules
(attendance-driven balances, invoices, dashboard) land in later phases.

## Tech stackhhhh

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Tailwind CSS v4**
- **Prisma** ORM on **SQLite** (file-based, `dev.db`)
- **NextAuth v5** (Credentials + bcrypt, JWT sessions, roles: `DIRECTOR` / `STAFF`)
- **next-intl** — locales: `fr` (default), `ar` (RTL), `en`
- **zod** for validation, **lucide-react** icons, **class-variance-authority**

## Requirements

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
npm run db:migrate  # creates dev.db and applies migrations
npm run db:seed     # creates director/staff users + sample data
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/fr/login`.

### Dev credentials (from seed)

| Role      | Email                  | Password   |
| --------- | ---------------------- | ---------- |
| Director  | director@example.com   | `password` |
| Staff     | staff@example.com      | `password` |

## Scripts

| Command               | What it does                                 |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Start Next.js dev server                     |
| `npm run build`       | Production build                             |
| `npm start`           | Serve the production build                   |
| `npm run lint`        | Run ESLint                                   |
| `npm run db:migrate`  | Apply Prisma migrations to `dev.db`          |
| `npm run db:seed`     | Seed the database with dev data              |
| `npm run db:studio`   | Open Prisma Studio (DB browser)              |
| `npm run db:reset`    | Drop + recreate + migrate + seed (DEV ONLY)  |

## Project layout

```
prisma/
  schema.prisma        # data model
  seed.ts              # idempotent dev seed
  migrations/
src/
  app/
    [locale]/
      (auth)/login/    # unauthenticated login page
      (app)/           # authenticated shell (sidebar + header)
        dashboard/
        students/      (list, new, [id], [id]/edit)
        teachers/
        subjects/
        classrooms/
        timetable/
      layout.tsx       # sets <html lang dir> for RTL support
  components/
    app/               # sidebar, header, logout, locale switcher
    ui/                # button, input, card, table, form-message, ...
  i18n/                # next-intl routing + navigation
  lib/
    auth.ts            # NextAuth config + requireSession / requireDirector
    db.ts              # Prisma singleton
    money.ts           # parseMoney / formatMoneyMinor / formatCurrency (minor units)
    time.ts            # HH:MM <-> minutes, rangesOverlap, DAY_KEYS
    audit.ts           # recordAudit helper -> AuditLog
    action-helpers.ts  # redirectLocalized
  middleware.ts        # auth gating + next-intl locale negotiation
messages/
  en.json fr.json ar.json
```

## Conventions

- **Money is stored in minor units (centimes DZD) as `Int`**. Never use floats.
  Use `parseMoney` on input and `formatMoneyMinor` / `formatCurrency` on
  output (`src/lib/money.ts`).
- **Timetable times are minutes-since-midnight `Int`**. Use `parseHHMM` /
  `formatHHMM` / `rangesOverlap` (`src/lib/time.ts`).
- **Student / Teacher `cachedBalance` is derived** from an append-only ledger
  (`StudentLedgerEntry` / `TeacherLedgerEntry`). Phase 1 never mutates balances;
  Phase 2 will only mutate them inside the same transaction that writes a
  ledger entry.
- **Deactivate, don't delete** for entities referenced by ledgers / audit logs
  (students, teachers, subjects, classrooms). Timetable slots are hard-deleted.
- **Every mutation writes an `AuditLog`** via `recordAudit`.

## Not in Phase 1 (intentionally)

- Attendance entry, barcode scanner integration, session cost deduction (Phase 2)
- Student / teacher ledger UI and balance display (Phase 2)
- Financial dashboard, debt reports, revenue charts (Phase 3)
- Invoice generation / printing / PDF export (Phase 4)
- Tauri / Electron desktop wrapper — the app currently runs as a Next.js web
  app. Wrapping for offline single-desktop deployment is a later follow-up,
  deliberately deferred so the domain model ships first.
- Teacher login — cut from v1 per PRD decisions. Admins print teacher
  statements instead.

## i18n

- `fr` is the default locale; URLs are always locale-prefixed (`/fr/...`).
- `ar` ships with full RTL layout via `<html dir="rtl">` and uses the
  "Noto Kufi Arabic" font stack.
- To add a string, edit all three files in `messages/`. Keep the key
  hierarchy consistent across locales.
