# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Resgatando Almas" is a wellness/energy-tracking app (UI text and user-facing API messages in Brazilian Portuguese). Monorepo with two independent npm projects, `frontend/` (React 19 + Vite) and `backend/` (Express 5 + Prisma 7 + PostgreSQL 17), orchestrated by `docker-compose.yml`.

## Commands

Full stack (repo root): `docker compose up --build`. Frontend http://localhost:5173, API http://localhost:3001/api, Postgres on 5432 (`postgres`/`postgres`, db `resgatando_almas`). The backend container runs `prisma generate`, `migrate deploy` and `db seed` on start. After changing a `package.json`, use `docker compose up --build -V` — `node_modules` lives in an anonymous volume that otherwise keeps the old dependencies.

Backend (`cd backend`; local runs read `.env`, copy from `.env.example`):
- `npm run dev` — tsx watch
- `npm run typecheck` — tsc over `src/`, `prisma/`, `prisma.config.ts` (no emit)
- `npm run build` / `npm start` — generate client, compile `src/` to `dist/` (`tsconfig.build.json`)
- `npm run db:migrate -- --name <name>` — create + apply a migration after editing `prisma/schema.prisma`; then `npm run db:generate` (Prisma 7's `migrate dev` does not regenerate the client)
- `npm run db:seed` — idempotent: upserts the activity catalog; outside production also creates demo user `mariana@exemplo.com` / `demo123`

Frontend (`cd frontend`): `npm run dev`, `npm run build` (`tsc -b` + vite build), `npm run lint` (oxlint).

No test framework is configured in either project.

## Backend architecture

ESM (`"type": "module"`, relative imports end in `.js`). Layers under `src/`: `routes/index.ts` (all routes) → `controllers/` (parse input with zod schemas from `validation/`, set cookies/status) → `services/` (business rules, DTO shaping) → `repositories/` (the only place that touches `prisma`). `middlewares/error-handler.ts` turns `HttpError` (`lib/errors.ts`), `ZodError`, bad JSON and Prisma P2002 into `{ error: { message, fields? } }`; Express 5 forwards async throws, so handlers just throw.

- **Prisma client** is generated into `src/generated/prisma` (gitignored) and instantiated with the `@prisma/adapter-pg` driver adapter in `lib/prisma.ts`. Import types/enums from `../generated/prisma/client.js` / `enums.js`.
- **Auth** is an opaque session token in an httpOnly cookie `ra_session` (path `/api`, SameSite=Lax); only its SHA-256 is stored in `Session`. "Lembrar de mim" → 30-day persistent cookie, otherwise browser-session cookie with 24h server expiry. Passwords use bcryptjs (cost 12). `middlewares/authenticate.ts` sets `req.user`; controllers get the id via `currentUserId(req)`. Never accept a `userId` from the request body — schemas are `z.strictObject`, so unknown keys are rejected, and every repository query for personal data filters by `userId`.
- **Domain rules** (`domain/energy.ts`) mirror the frontend's former reducer: assessment score = answers' weights (0–4) / 48 × 100, score > 80 → `CALM` scenario else `VITALITY`; feedback energy level → 10/30/50/70/90. The server computes scores; the client only sends answers.
- **Progress** (`services/progress.service.ts`) is derived, not stored: history = assessments + feedbacks; "completed" activities are those since the latest assessment (a new assessment restarts the protocol); week/streak grouping uses `APP_TIMEZONE`.
- `Activity.id` values (`exercises-0`, `calmExercises-2`, …) must match `frontend/src/data/catalog.ts`; `prisma/activities.ts` is the seed copy of that catalog.

## Frontend architecture

No router or state library — everything is hand-rolled:

- **Routing**: hash-based via `hooks/useHashRoute.ts`. The `Route` union lives in `types.ts`, the whitelist array in `useHashRoute.ts`, and the route→page switch in `App.tsx`; adding a page means updating all three. Only `login`/`signup` are public; `AppContext` redirects anonymous users there and `App.tsx` renders protected screens only once `authStatus === "authenticated"`.
- **API**: `src/services/` wraps `fetch` (`api.ts`, same-origin `/api`, proxied by Vite to `API_PROXY_TARGET` or `localhost:3001`). Services map the UI's option indexes to the API enums (`dto.ts`).
- **State**: one `useReducer` in `state/AppContext.tsx` with reducer/helpers in `state/model.ts`. Server data enters via the `progress`/`profile`/`assessed`/`feedback-saved` actions; async operations (`login`, `submitAssessment`, `submitFeedback`, `saveProfile`, …) live in the context, and any 401 ends the session.
- **Modals**: all dialogs render in `components/ModalHost.tsx` on a single `<dialog>`, switched by `ModalKind`. Password change and "forgot password" are still simulated.
- **UI kit**: shared primitives in `components/ui.tsx`, showcased at `#design`. `EnergyChart` draws real weekly values when given `values`, otherwise an illustrative series.
- **Styling**: global CSS in `src/styles.css` with `:root` variables. `App.css` and default Vite assets are unused template leftovers.
- `src/config.tsx` holds public presentation settings only (default video ID, WhatsApp number).
