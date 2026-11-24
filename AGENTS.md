# AGENTS.md: linguo-landing

## 1. Project overview
Public website and student-facing app for **Linguo** (linguo.id), an online language school teaching 60+ languages at CEFR levels A1–B2.
This repo contains the marketing/SEO pages, checkout, the student dashboard (`/akun`), onboarding and intake forms, the placement test, the digital store and e-book catalog, and the self-paced LMS.
"Lingcore" is the learning platform/method brand used across the product (see `src/app/tentang/page.tsx`).
User-facing copy, code comments, and commit messages are in **Indonesian**.

## 2. Tech stack
- **Next.js 16.2** (App Router, `src/app`), **React 19.2**, **TypeScript 5** (`strict`)
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.*`; theme lives in `src/app/globals.css`), `@tailwindcss/typography`
- **Supabase**: `@supabase/ssr` (cookie sessions) + `@supabase/supabase-js`. Project ref `jbtgciepdmqxxcjflrxz`
- **Xendit** Invoice API (payments), **Resend** (email), `sonner` (toasts), `lucide-react` (icons), `framer-motion`, `three`
- TTS: Google Cloud TTS (Chirp 3 HD) + eSpeak NG WASM fallback; Azure/ElevenLabs/Gemini are used by some scripts and routes
- Tests: **Vitest 3**. Hosting: **Vercel** (region `sin1`, crons in `vercel.json`)

## 3. Commands
```bash
npm install            # postinstall copies the pdf.js worker (scripts/copy-pdf-worker.mjs)
npm run dev            # next dev
npm run build          # syncs public/slide-cover, then `next build --webpack` (same as Vercel)
npx tsc --noEmit       # typecheck (no npm script for it)
npm test               # vitest run
npm run cek:jsonld     # validate JSON-LD structured data
```
- `npm run lint` currently **fails**: ESLint 9 is installed but there is no `eslint.config.*`. Don't rely on it, and don't "fix" it as a drive-by.
- Some Vitest suites check that assets exist under `public/` and `content/`. They fail in sparse checkouts that leave those folders out.

## 4. Folder structure
```
src/app/            App Router pages + route handlers (src/app/api/*)
src/app/_home/      Homepage sections/islands (not a route)
src/app/akun/       Logged-in student dashboard (/akun); belajar/[lessonId] = LMS lesson player
src/app/api/        Server route handlers: invoices, onboarding, placement, tts, cron, quiz, ...
src/components/     Shared UI; akun/ (dashboard parts), lms/ (LMS shell/catalog), kursus/, watch/, quran/
src/lib/            Domain logic + Supabase clients (supabase-client/-server/-middleware.ts)
src/data/           Static data: curriculum/ (incl. curriculum/languages.ts), artwork maps, catalogs
src/middleware.ts   Supabase session refresh + affiliate ?ref= cookie
content/            E-book/curriculum JSON and assets (large; excluded from some function traces)
public/             Static assets (slide-cover/ is synced at build time)
scripts/            One-off & build .mjs scripts (e-book build/publish, pricing, audits, patches)
sql/                Hand-written SQL for the owner to run manually (YYYYMMDD-*.sql)
reports/, docs/     Content/artwork manifests and internal notes
```
Root-level `setup-*.mjs` / `fix-*.mjs` files and `*.bak*` files are old patch artifacts. Leave them alone and don't add new ones at the root.

## 5. Conventions & do/don't
**Do**
- Import with the `@/` alias (maps to `src/`), never long relative paths.
- Use brand teal `#1A9E9E` as the primary color (LMS also uses `#0F6E56` deep teal and `#FFC93C` yellow). Don't change brand colors without explicit instruction.
- Show toasts with `import { toast } from "sonner"`. The single `<Toaster>` is in `src/app/layout.tsx`; don't add another.
- Build tabs manually: a `useState` key plus `<button>`s with active styling (see `src/app/akun/page.tsx`). The repo has no shadcn/Radix. **Don't add shadcn `Tabs`** or any other shadcn/Radix component.
- In client code, use the single browser client: `import { supabase } from "@/lib/supabase-client"`. **Never** create another GoTrue/`createClient` instance in the browser.
- Mark code changes with a sentinel tag in a comment, e.g. `// [feature-name-v1] why…`. Bump `-vN` on revisions. Commit messages follow `feat|fix|chore(scope): <Indonesian summary> [feature-name-v1]`.
- Write patch scripts as idempotent `.mjs` files: check `src.includes('[sentinel-vN]')` before inserting, fail loudly if the anchor text isn't found, and make a second run a no-op.
- Keep comments explaining *why* (incidents, dates, data). That is the house style.

**Don't**
- Don't remove entries from `src/data/curriculum/languages.ts` or other language catalogs. URLs and SEO depend on them.
- Don't touch `.env*` files, and never print or commit secrets. Hard-code nothing except the public project URL/ref.
- Don't change redirects in `next.config.ts` from permanent to temporary. They carry SEO signals. `/kelas/konfirmasi/<token>` must stay live.
- Don't let a heavy route pull `content/` or `public/` into its serverless bundle. Vercel rejects functions over 250 MB (see `outputFileTracingExcludes` and `.vercelignore`).

**Env var names** (values live in Vercel and `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BASE_URL`, `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`, `XENDIT_PAYOUT_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_TTS_CREDENTIALS_JSON`, `GOOGLE_APPLICATION_CREDENTIALS`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `FONNTE_TOKEN`, `CRON_SECRET`, `REVALIDATE_SECRET`, `QUIZ_BOT_SECRET`, `QUIZ_FN_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_FB_PIXEL_ID`. See `.env.example` for the minimal set.

## 6. Database & Supabase rules
- **The owner runs all SQL manually in the Supabase SQL Editor.** Agents must NOT run migrations, `supabase db push`, MCP `apply_migration`, or any write SQL against the database. Read-only inspection is fine when asked.
- To change the schema or data, write a standalone file `sql/YYYYMMDD-<slug>.sql`. Make it idempotent (`if not exists`, `create or replace`, `on conflict`), wrap it in `begin; … commit;` where sensible, and list it in your final summary so the owner runs it. Code that depends on it must not break before it runs.
- **RLS is on for most tables.** Every new table needs `enable row level security` plus explicit policies. For every new query, check which role runs it:
  - Browser (`@/lib/supabase-client`) runs as **anon/authenticated** and is subject to RLS.
  - `@/lib/supabase-server` and most `src/app/api/*` routes use `SUPABASE_SERVICE_ROLE_KEY`, which **bypasses RLS**. Keep these server-only, validate input, and scope by user or token yourself.
- **The schema is shared** with the admin dashboard (dashboard.linguo.id, repo `linguo-admin-dashboard`), the teacher portal (teach.linguo.id), and Supabase edge functions plus the WhatsApp bot (repo `linguo-app`). Never rename or drop columns, tables, enum values, or RPCs without grepping the other repos and saying so. Prefer additive changes.
- Before using the Supabase MCP connector, confirm it targets project `jbtgciepdmqxxcjflrxz`. It may point at another project.

## 7. Key flows
**Auth**
- Supabase Auth with **cookie sessions** (`@supabase/ssr`, PKCE). `src/middleware.ts` calls `updateSupabaseSession` on every page request; it skips `/api`.
- Sign-in supports Google OAuth (`signInWithOAuth` → `/auth/callback`), password, and magic-link/OTP. The UI is in `src/app/_home/LoginModal.tsx` and `/akun`. Password reset is at `/auth/update-password`.
- The middleware also stores `?ref=CODE` in the `linguo_ref` cookie (60 days, last touch wins) and logs the click to the `track-affiliate-click` edge function.

**Payment (Xendit)**
- `src/app/api/create-*-invoice` routes (`create-invoice`, `-trial-`, `-kelas-`, `-cart-`, `-testprep-`, `-funnel-`, `-wl-`) create Xendit invoices server-side. They record a `leads` row keyed by `xendit_external_id` and redirect to `/payment/success?id=…` or `/payment/failed`.
- ⚠️ **The live Xendit webhook is the edge function `xendit-webhook` in repo `linguo-app`**, not `src/app/api/xendit-webhook`. That route is not registered with Xendit. Put new fulfillment (entitlements, e-book access, etc.) in the edge function, or the payment succeeds and the student gets nothing. Keep handlers idempotent.

**Onboarding**
- `/onboarding/[token]` is the post-payment form; the token is `leads.xendit_external_id`. `api/onboarding` reads and writes `leads`.
- Once a lead has `converted_registration_id`, Private/Semi/Kids students are redirected to `/pendataan/[token]`, the intake form stored in `student_intake_forms`. B2B uses `/pendataan-b2b`.

**Placement test**
- Lives at `/silabus/[lang]/coba` (`PlacementTest.tsx`). Questions come from `api/placement-questions` (`src/lib/placementBank.ts`), results go to `api/placement-result`, and `src/lib/placementNotify.ts` sends the WA/email notice.
- `/pretest/vietnam` is a separate B2B cohort pre-test.

**LMS (self-paced)**
- `/akun/belajar/[lessonId]` → `src/components/akun/LessonPlayer.tsx`. The catalog is `src/components/lms/LmsKatalog.tsx`.
- Data lives in `lms_lessons`, `lms_blocks`, and `lms_quiz_questions`. `lms_subscriptions` is activated on payment.
- `src/lib/lmsAccess.ts` is the **single source** of the access rule: A1.x is free, A2–B2 needs an entitlement. Don't duplicate this rule elsewhere.
- Audio comes from `/api/tts`. Voices are picked in `src/lib/ttsVoice.ts`: Chirp 3 HD where available, eSpeak NG for other Latin-script languages.

**Student dashboard**
- `/akun` (`src/app/akun/page.tsx`, very large) holds classes, schedule, recordings, library/e-books, simulations, groups, and the affiliate area. Make surgical edits there and don't reformat the file.

## 8. Deployment
- **Push to `main` = production deploy on Vercel** (linguo.id). There is no staging. Commit or push to `main` only when the owner asks; otherwise use a branch or PR. The `.github` workflow for AI bug fixes only ever opens PRs.
- The main local folder `~/linguo-landing` is often **behind or diverged from `origin/main`** and holds other sessions' uncommitted files. Work in a worktree: `git -C ~/linguo-landing worktree add --detach .claude/worktrees/<name> origin/main`. Don't pull, rebase, or reset the main folder.
- Vercel crons (`vercel.json`) call `/api/cron/*` and `/api/quiz/cron-daily`. Protect new cron routes with `CRON_SECRET`.
- Watch serverless bundle size when adding `fs` reads, large deps, or new heavy routes.

## 9. Definition of done
1. `npx tsc --noEmit` passes with zero errors.
2. `npm run build` passes, or for doc/SQL-only changes say that you skipped it.
3. `npm test` shows no new failures compared with `origin/main`.
4. Any required SQL is in `sql/` and called out for the owner to run manually. Note cross-app impact (dashboard, teacher portal, edge functions).
5. No secrets, `.env` changes, or stray `.bak` / patch files are committed.
6. The final message lists the files changed, the manual steps, and anything left unverified.
