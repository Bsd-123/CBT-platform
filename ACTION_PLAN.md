# Project Remediation & Execution Plan

**Project:** CBT Community Platform (Next.js 16 App Router, React 19, Prisma 6, Supabase Auth, Cloudflare R2)
**Audit date:** 2026-10-05 · **Scope:** `src/`, `prisma/`, `supabase/`, config, scripts (static review + `eslint`/`tsc`; no runtime penetration test)
**Spec used:** `.cursorrules` (master prompt) and `db-schema-en.md`

---

## 1. Executive Summary & Health Check

**Overall health: 🔴 Not production-ready.** The product surface is broad and the UI is mostly complete. The code that decides who may do what is the weak point. A secure-looking layer (`actions/submit.ts`, `actions/admin.ts`) sits next to an insecure one (`actions/index.ts`), and the insecure one is publicly callable.

**Major risk factors**

1. **Unauthenticated privilege escalation (SEC-01).** `src/lib/actions/index.ts` is marked `"use server"` and re-exports raw repository writes with no auth checks. Every exported function is a public HTTP endpoint in Next.js. Any visitor who knows the action ID can call `editUserProfile(<own id>, { role: "admin" })` and take over the platform. The same file also lets anyone approve their own expert-referral registration, resolve reports, create notifications for anyone, create or detach tags, and read any user's data.
2. **Authorization is enforced only in the UI wrapper, not at the data layer.** `submit.ts` is careful, but it calls the unguarded functions in `index.ts`. Page-level guards exist (`(main)/layout.tsx`, `assertAdminAccess`), but nothing in `proxy.ts` blocks unauthenticated traffic.
3. **File storage is weakly protected (SEC-02 to SEC-04).** Any approved user can obtain a signed download URL for any object key in the bucket. Uploads have no content-type or extension allow-list. File keys submitted with materials are never checked for ownership.
4. **A shipped admin page is broken (BUG-01).** `listMaterialsForAdmin` queries a `tags` relation that does not exist on the `Material` model. The `as any` cast hides it from the compiler, and the page will throw at runtime.
5. **No operational safety net.** There are no tests, no rate limiting, no structured logging, no input-validation library, no security headers, and no global `error.tsx`, `not-found.tsx` or `loading.tsx`. Only `admin/` and `events/` have error boundaries.
6. **Insecure dev defaults can leak into production (SEC-07).** `npm run dev` sets `NODE_TLS_REJECT_UNAUTHORIZED=0` and a hardcoded Supabase URL. The R2 client disables TLS verification when `NODE_ENV === "development"`.

**Good news**

- `.env` and `.env.local` are git-ignored and were never committed (checked with `git log --all`).
- The Prisma client is used throughout, so there are no raw SQL injection vectors.
- No `dangerouslySetInnerHTML` or `eval` was found.
- Hidden-content filtering (`visibleContentWhere`) is applied consistently on reads.
- `next/navigation` redirects are used correctly in the guards.

---

## 2. Priority & Impact Matrix

| ID | Title | Category | Urgency | Impact | Effort |
|----|-------|----------|---------|--------|--------|
| SEC-01 | Unauthenticated server actions in `actions/index.ts` (role escalation, self-approval, data exposure) | Security | **Critical** | Full platform takeover | M (4–6h) |
| SEC-02 | `requestFileDownloadUrl` signs any bucket key (no ownership or prefix check) | Security | **Critical** | Read any uploaded file | S (1–2h) |
| SEC-03 | `file_url` on materials and responses accepts arbitrary client strings | Security | **High** | Cross-user file access, stored garbage | S (1–2h) |
| SEC-04 | No file type, extension or content validation on uploads; signed-upload route has no size cap | Security | **High** | Malware hosting, storage abuse, XSS via served files | M (3–4h) |
| SEC-05 | Referral approval gate fails open (`none` = approved) and the expert code is only 32 bits | Security | **High** | Bypass of expert vetting | M (3–4h) |
| SEC-06 | No rate limiting on any action or endpoint | Security | **High** | Spam, brute force, cost abuse | M (4h) |
| SEC-07 | Insecure TLS and dev settings in scripts and R2 client | Security | **High** | MITM if shipped | S (1h) |
| SEC-08 | No input validation or length limits (no zod) | Security | **High** | Oversized writes, 500 errors, data integrity | L (1–2d) |
| SEC-09 | `adminUpdateUserRole` accepts unvalidated role; admin can demote self or last admin | Security | Medium | Lock-out or garbage data | S (1h) |
| SEC-10 | Missing security headers and CSP; `proxy.ts` does not gate routes | Security | Medium | XSS and clickjacking hardening | S–M (2–3h) |
| SEC-11 | `auth/callback` `next` param is only prefix-checked | Security | Low | Redirect edge cases (`//`, `/\`) | XS (20m) |
| SEC-12 | Error messages leaked to clients (`error.message` in upload routes) | Security | Low | Information disclosure | XS (30m) |
| BUG-01 | Admin materials page queries nonexistent `tags` relation | Bug | **High** | Admin page crashes | S (1h) |
| BUG-02 | Missing global `error.tsx`, `not-found.tsx` and `loading.tsx` | Bug | Medium | White screens, poor UX | S (2h) |
| BUG-03 | Date and time parsing unvalidated (`new Date("")`, `parseTimeInput` NaN) | Bug | Medium | Invalid dates stored, 500s | S (1h) |
| BUG-04 | Race conditions: rating create/update, forum-like toggle, duplicate reports | Bug | Medium | Unique-constraint 500s | S (2h) |
| BUG-05 | Comments and answers allowed on hidden or deleted parents; no target-exists check on reports | Bug | Medium | Orphan or invisible data | S (2h) |
| BUG-06 | User/content deletion order and FK handling in `moderation.repository` (non-transactional) | Bug | Medium | Partial deletes | M (3h) |
| ARC-01 | Duplicated action layers (`index.ts` vs `submit.ts`, plus duplicate `fetchNotifications`, `resolveReport`, `decideReferralApproval`) | Architecture | **High** | Root cause of SEC-01 | M (1d) |
| ARC-02 | Three parallel upload paths (server action, API route, presigned URL) | Architecture | Medium | Triple the attack surface | M (3h) |
| ARC-03 | ~12 duplicated UI components | Architecture | Low | Maintenance cost | M (1d) |
| ARC-04 | `any` casts and weak typing in repositories | Architecture | Low | Hidden runtime errors | S (1h) |
| ARC-05 | Pages call repositories via actions with no pagination | Architecture | Medium | Scalability | M–L (2d) |
| ARC-06 | Recursive per-row deletes in moderation (N+1) | Architecture | Low | Slow deletes | S (2h) |
| INF-01 | No automated tests | Infrastructure | **High** | No regression safety | L (3–5d) |
| INF-02 | No structured logging / error monitoring | Infrastructure | Medium | Blind in production | S (3h) |
| INF-03 | No env validation at boot (`dbConfig` and `r2Config` fail lazily) | Infrastructure | Medium | Late failures | S (1h) |
| INF-04 | No CI pipeline (lint, typecheck, build, test) | Infrastructure | Medium | Broken main | S (2h) |
| INF-05 | Prisma migrations not used (`db push` workflow) | Infrastructure | Medium | Unsafe schema changes | M (3h) |
| INF-06 | Fonts loaded in root layout `<head>`, `.next` included in tsconfig type-check | Infrastructure | Low | Lint warnings, noisy `tsc` | XS (20m) |

---

## 3. Phased Implementation Roadmap

### Phase 1 — Critical Security Hotfixes & Operational Blockers (P0) · target: 2–3 days
Do not deploy or invite real users before this phase is complete.

1. **SEC-01 / ARC-01:** remove `"use server"` from `actions/index.ts`, turn it into an internal data module, and put authorization on every callable action.
2. **SEC-02 / SEC-03:** scope file downloads and file references by key prefix and ownership.
3. **SEC-07:** strip `NODE_TLS_REJECT_UNAUTHORIZED=0` and the hardcoded Supabase URL from `package.json`, and gate the R2 insecure-TLS flag.
4. **BUG-01:** fix the admin materials query so the admin page loads.
5. **SEC-09:** validate roles and add a last-admin guard.
6. **Rotate secrets:** because `.env` holds live Supabase service-role and R2 keys on a dev machine, rotate them before launch.

### Phase 2 — Core Architectural Stabilization & Page Fixes (P1) · target: 1–2 weeks
1. **SEC-08:** introduce zod schemas for every action input.
2. **SEC-04:** file allow-list, size caps, and content-disposition on downloads.
3. **SEC-05:** harden the referral flow.
4. **SEC-06:** rate limiting.
5. **SEC-10:** security headers and CSP.
6. **BUG-02 to BUG-05:** error boundaries, date validation, race conditions, parent checks.
7. **ARC-02:** collapse to one upload path.
8. **INF-01 (partial), INF-03, INF-04:** auth and authorization tests, env validation, CI.

### Phase 3 — Technical Debt, Optimization & Feature Completion (P2) · target: 2–4 weeks
1. **ARC-03, ARC-04, ARC-05, ARC-06:** component dedupe, typing, pagination, bulk deletes.
2. **INF-01 (rest), INF-02, INF-05, INF-06:** wider test coverage, logging and monitoring, move to `prisma migrate`, config cleanups.
3. **BUG-06:** transactional moderation.
4. Accessibility pass (`TagSelect` aria warning), Hebrew/RTL QA, and compare each page against the `.cursorrules` spec for missing features.

---

## 4. Itemized Issue Breakdown

### SEC-01 — Unauthenticated server actions expose privileged writes
**Category:** Security (Critical)

**Description & Root Cause**
`src/lib/actions/index.ts` starts with `"use server"`. In Next.js, every exported async function in such a file becomes a publicly invocable endpoint, whether or not any page imports it. The file exports thin wrappers around repositories with no authentication:

| Exported action | Abuse |
|---|---|
| `editUserProfile(id, input)` | `UpdateUserInput` includes `role`. Anyone can make any user `admin` (privilege escalation). |
| `registerUserProfile(input)` | Creates users with a caller-supplied `role`. |
| `decideReferralApproval(expert, user, {status})` | Anyone can approve their own pending registration and bypass vetting. |
| `submitReferralApproval` | Create approvals for arbitrary pairs. |
| `resolveReport` | Close any report. |
| `notifyUser`, `fetchNotifications(user_id)`, `readNotification`, `readAllNotifications`, `fetchUnreadNotificationCount` | Spam or read any user's notifications. |
| `createNewTag`, `tagEntity`, `untagEntity` | Tag tampering. |
| `postEvent`, `postForumQuestion`, `postMaterialRequest`, `rateMaterial`, `toggleForumLike`, `postRecommendation` and the other `post*` | Write content as **any** `user_id`. |
| `uploadMaterial`, `removeMaterialRating`, `editMaterialRating`, `editEvent`, `fetchPendingReferralsForExpert` | Missing ownership and role checks. |

Several functions share a name with a guarded version in another file (`actions/notifications.ts`, `actions/expert.ts`, `actions/admin.ts`). That duplication is why the unguarded copies were never noticed.

**Recommended Solution**
1. Move the file out of the server-action boundary. Rename it to `src/lib/data/index.ts` (or `.server.ts`), delete `"use server"`, and add `import "server-only";` at the top. Pages that call it during server rendering keep working; the browser can no longer invoke it.
2. Update imports in the 13 pages that import from `@/lib/actions` (listed by `grep "@/lib/actions\""`).
3. Keep `"use server"` only in files whose every function starts with an auth guard: `submit.ts`, `admin.ts`, `expert.ts`, `profile.ts`, `notifications.ts`, `upload.ts`, `auth.ts`.
4. For read-only pages that need data, call repositories directly from server components, inside a `requireApprovedRegistration()` boundary.
5. Never accept `user_id` from the client. Always derive it from the session, as `submit.ts` already does.
6. Never accept `role` in `UpdateUserInput` from a non-admin path. Split the types:

```ts
// models/user.ts
export type UpdateOwnProfileInput = { full_name: string; title?: string | null };
export type AdminUpdateUserInput  = { role: UserRole };   // admin.ts only
```

7. Add a lint rule or a CI grep (`"use server"` files must contain `require` on every export) so this cannot regress.

---

### SEC-02 — Download URLs signed for arbitrary keys
**Category:** Security (Critical)

**Description & Root Cause**
`requestFileDownloadUrl(key)` in `actions/upload.ts` checks that the caller is approved, then signs whatever `key` is passed. Any approved member can download any object in the bucket, including files tied to hidden or deleted materials and other users' request responses.

**Recommended Solution**
Look the key up in the database and sign only keys that belong to visible content:

```ts
export async function requestFileDownloadUrl(key: string) {
  const auth = await requireApprovedRegistration();
  if (!/^(materials|material-responses)\/[0-9a-f-]{36}\/[\w.-]+$/.test(key)) {
    throw new Error("Invalid file key.");
  }
  const [material, response] = await Promise.all([
    prisma.material.findFirst({ where: { file_url: key, is_hidden: false } }),
    prisma.materialResponse.findFirst({ where: { file_url: key } }),
  ]);
  if (!material && !response && auth.profile.role !== "admin") {
    throw new Error("File not found.");
  }
  return createSignedDownloadUrl({ key, expiresIn: 300, filename: material?.title });
}
```

Shorten the expiry (3600s is long for a one-click download). Add `ResponseContentDisposition: attachment` to the `GetObjectCommand` so served files download rather than render.

---

### SEC-03 — Client-supplied `file_url` is trusted
**Category:** Security (High)

**Description & Root Cause**
`submitMaterialUpload` and `submitMaterialResponse` store `input.file_url` verbatim. A user can attach another user's key, or `../` style strings, and then use SEC-02 to read it.

**Recommended Solution**
Validate that the key starts with `materials/${auth.userId}/` (or `material-responses/${auth.userId}/`) and matches the key pattern. Optionally HEAD the object in R2 to confirm it exists. Store the key only; never store full URLs.

---

### SEC-04 — Upload validation and abuse controls
**Category:** Security (High)

**Description & Root Cause**
- `/api/upload/material` and `/api/upload/material-response` check size only, and trust the client-supplied `file.type`.
- `requestMaterialUploadUrl` returns a presigned PUT with no size limit and any content type. A user can upload multi-GB files straight to R2.
- `next.config.ts` raises the server-action body limit to 50 MB globally.
- The upload code buffers the whole file in memory (`Buffer.from(await file.arrayBuffer())`).
- Three overlapping upload paths exist (see ARC-02).

**Recommended Solution**
1. Pick the single path (recommended: presigned PUT) and delete the other two.
2. Enforce an allow-list of extensions and MIME types (PDF, DOCX, PPTX, XLSX, images, mp4). Reject everything else server-side before signing.
3. Keep the `ContentLength` of the presigned request fixed by signing it. Require the client to send `size` and validate `size <= 50MB`.
4. On submission, HEAD the object and verify `ContentLength` and `ContentType`.
5. Serve downloads with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
6. Remove the 50 MB global `bodySizeLimit` once the presigned path is the only one.
7. Remove the `isResponseParsingError` catch in `r2/upload.ts` that treats HTTP 418 and `Unknown` errors as success. It hides real upload failures.
8. Consider a malware scan hook (ClamAV or a Cloudflare worker) before files become visible.

---

### SEC-05 — Weak referral and approval gate
**Category:** Security (High)

**Description & Root Cause**
- `isRegistrationApproved` returns true when the status is `none`. Anyone who skips the expert code on the profile form is auto-approved. If vetting is meant to be mandatory, this is a bypass; if it is optional, the spec and the code must say so.
- `getRegistrationStatus` uses `findFirst` on a user with possibly several approval rows, so the result depends on row order.
- Expert codes are the first 8 hex characters of the expert's UUID (`formatExpertCode`), about 32 bits. `resolveExpertReferralId` loads all experts and compares each one, so codes can be tested offline with no rate limit.
- `registerProfile` accepts a raw UUID in place of a code (leaking nothing, but removing the code's secrecy).
- `completeRegistration` runs for any authenticated Supabase user, and email verification is not checked in code.

**Recommended Solution**
1. Decide the policy and encode it explicitly (`approved | pending | rejected | not_required`). Default to deny.
2. Add a unique `(user_id)` constraint on `ExpertApproval` or order by `created_at desc` consistently.
3. Generate expert referral codes as random 10–12 character tokens stored in a `referral_code` column with a unique index. Add `referral_code_expires_at` if desired.
4. Rate-limit `completeRegistration` (see SEC-06).
5. Reject sessions where `user.email_confirmed_at` is null (`getAuthSession`).
6. Send the pending expert a notification and log all decisions in an audit table.

---

### SEC-06 — No rate limiting
**Category:** Security (High)

**Description & Root Cause**
Login, registration, password reset, uploads, comments, reports, likes and signed-URL generation are all unthrottled. Supabase's auth limits apply to Supabase endpoints only, not to this app's server actions.

**Recommended Solution**
Add a small limiter (Upstash Redis `@upstash/ratelimit` on serverless, or an in-memory LRU for single-instance hosts):

```ts
// lib/security/rate-limit.ts
export async function limit(key: string, max: number, windowSec: number) { /* ... */ }

// in every mutating action
await limit(`post:${auth.userId}`, 20, 60);
```

Suggested starting limits: auth and registration 5/min per IP, uploads 10/hour per user, comments and posts 20/min per user, reports 10/hour per user.

---

### SEC-07 — Insecure TLS and dev settings
**Category:** Security (High)

**Description & Root Cause**
- `package.json` `dev` script: `NODE_TLS_REJECT_UNAUTHORIZED=0` disables certificate validation for **every** outbound request of the Node process, and hardcodes the Supabase project URL.
- `r2/client.ts` disables TLS verification whenever `NODE_ENV === "development"`.
- `supabase/fetch.ts` comments assume the above.
These are workarounds for a filtered or proxied network on the developer's machine. They are dangerous if copied to staging or production.

**Recommended Solution**
1. Remove the env flags from `package.json`. Put the Supabase URL in `.env.local`.
2. Fix the root cause by trusting the corporate or filter CA with `NODE_EXTRA_CA_CERTS=path/to/ca.pem` in a local `.env`.
3. In `r2/client.ts`, gate the insecure agent behind an explicit opt-in (`ALLOW_INSECURE_TLS=true`) and throw if it is set when `NODE_ENV === "production"`.
4. Add a boot check that fails if `NODE_TLS_REJECT_UNAUTHORIZED=0` in production.

---

### SEC-08 — No structured input validation
**Category:** Security (High)

**Description & Root Cause**
Server actions accept TypeScript-typed inputs that are not validated at runtime. TypeScript types do not exist at the network boundary. Titles, descriptions and content have no maximum length. `role`, `target_type`, `type` and `status` can be any string sent by an attacker, which Prisma rejects with a 500 and a leaked message. Tag names are parsed ad hoc.

**Recommended Solution**
Add `zod` and validate at the top of every action:

```ts
const MaterialUpload = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  material_type_id: z.string().uuid(),
  file_url: z.string().regex(KEY_PATTERN),
  tag_ids: z.array(z.string().uuid()).min(1).max(10),
});
export async function submitMaterialUpload(raw: unknown) {
  const input = MaterialUpload.parse(raw);
  ...
}
```

Return a typed `{ ok: false, error }` result rather than throwing raw messages. Mirror the same limits as DB constraints (`VARCHAR(n)` or `CHECK`).

---

### SEC-09 — Admin role management
**Category:** Security (Medium)

**Description & Root Cause**
`adminUpdateUserRole(user_id, role)` does not validate `role`, lets an admin demote themselves, and can leave the platform without an admin. There is no audit record of role changes.

**Recommended Solution**
Validate with `isUserRole`, refuse if `user_id === auth.userId` and the target is the last admin, and write an `AuditLog` row (`actor_id, action, target_id, before, after`).

---

### SEC-10 — Security headers and route gating
**Category:** Security (Medium)

**Description & Root Cause**
`next.config.ts` sets no headers. `proxy.ts` refreshes the Supabase session but does not redirect unauthenticated requests, so protection depends on every layout and page remembering to guard (the `(main)` layout does; the `api/upload` routes do). New routes added outside `(main)` would be public by default.

**Recommended Solution**
```ts
// next.config.ts
async headers() {
  return [{ source: "/(.*)", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.r2.cloudflarestorage.com" },
  ]}];
}
```
In `proxy.ts`, redirect to `/login` for any path not in a public allow-list (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`). Keep page-level checks as defense in depth.

---

### SEC-11 — Redirect target validation
**Category:** Security (Low)

**Description & Root Cause**
`auth/callback/route.ts` accepts `next` when it merely starts with `/`. Because the origin is prefixed, classic open redirects are not possible, but `//` and `/\` forms are brittle.

**Recommended Solution**
Accept only `/^\/(?![\/\\])[\w\-\/?=&%]*$/`, otherwise fall back to `/`.

---

### SEC-12 — Error message disclosure
**Category:** Security (Low)

**Description & Root Cause**
The upload API routes return `error.message` for any thrown error with status 500, which can include R2 or Prisma internals. Other actions throw raw Prisma errors to the client.

**Recommended Solution**
Use a small `AppError` class with user-safe messages, log everything else server-side, and return a generic Hebrew message plus an error ID.

---

### BUG-01 — Admin materials page uses a nonexistent relation
**Category:** Bug (High)

**Description & Root Cause**
`listMaterialsForAdmin` in `material.repository.ts` includes `tags: { select: { id: true, name: true } }` on `prisma.material`. The `Material` model has no `tags` relation; tags are polymorphic via `EntityTag`. Prisma throws a validation error at runtime. The `(m: any)` cast and `m.tags ?? []` hide the problem from TypeScript (ESLint reports the `any` as an error).

**Recommended Solution**
Remove `tags` from the `include`, then fetch tags with a single follow-up query:

```ts
const ids = items.map((m) => m.id);
const links = await prisma.entityTag.findMany({
  where: { entity_type: "material", entity_id: { in: ids } },
  include: { tag: { select: { id: true, name: true } } },
});
const tagsByMaterial = Map.groupBy(links, (l) => l.entity_id);
```
Drop the `any` cast, and add the page to the smoke test (INF-01).

---

### BUG-02 — Missing error and not-found boundaries
**Category:** Bug (Medium)

**Description & Root Cause**
Only `(main)/admin/error.tsx` and `(main)/events/error.tsx` exist. There is no `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` or any `loading.tsx`. A failing DB call in the forum, materials, profile or recommendations pages shows the default Next error page. Detail pages (`[id]`) call `notFound()` only if they implement it.

**Recommended Solution**
Add `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` (Hebrew, RTL), and `loading.tsx` for list pages. Make every `[id]` page call `notFound()` when the record is null or hidden.

---

### BUG-03 — Date and time parsing
**Category:** Bug (Medium)

**Description & Root Cause**
`submitEvent` and `submitEventUpdate` do `new Date(input.event_date)` and `parseTimeInput(time)` with `split(":").map(Number)`. Invalid strings give `Invalid Date`/`NaN`, which Prisma rejects with a 500. Time zones are not handled (`setUTCHours` stores the user's local time as UTC).

**Recommended Solution**
Validate with zod (`z.string().date()`, `z.string().regex(/^\d{2}:\d{2}$/)`), store events as a single `timestamptz` plus an `all_day` flag, and render in `Asia/Jerusalem`.

---

### BUG-04 — Race conditions
**Category:** Bug (Medium)

**Description & Root Cause**
- `submitMaterialRating` reads then creates or updates; two quick clicks cause a unique-constraint failure.
- `toggleForumLike` reads then creates or deletes with the same race.
- `submitContentReport` has no dedupe, so one user can submit unlimited reports for one item.

**Recommended Solution**
Use `prisma.materialRating.upsert` on the `(material_id, user_id)` unique key. For likes, use `createMany({ skipDuplicates: true })` and fall back to `deleteMany`, or wrap in a serializable transaction. Add a unique `(user_id, target_type, target_id)` on reports (or update the existing open report).

---

### BUG-05 — Missing parent and target checks
**Category:** Bug (Medium)

**Description & Root Cause**
`createEventComment`, `createForumAnswer` and `createRecommendationComment` use `findUnique` without checking `is_hidden`, so users can comment on hidden content. `parent_comment_id` and `parent_answer_id` are not checked to belong to the same parent entity, which allows cross-thread replies. `createReport` does not verify that `target_id` exists for its `target_type`. `ForumAnswer` threading is only read to three levels, so deeper replies are saved but never shown.

**Recommended Solution**
Use the `visibleContentWhere()` helper in these lookups, verify `parent.request_id === input.request_id`, validate the report target, and either cap depth on write or render recursively.

---

### BUG-06 — Non-transactional moderation deletes
**Category:** Bug (Medium)

**Description & Root Cause**
`deleteReportedContent` performs many separate deletes. A failure midway leaves partial data (e.g. likes deleted, answer remains). Related reports, notifications and the R2 file are not cleaned up, and deleting a material leaves its R2 object in the bucket.

**Recommended Solution**
Wrap each case in `prisma.$transaction`, add `onDelete: Cascade` to the schema relations (answer to replies, question to answers, and so on), and delete the R2 object after the DB commit.

---

### ARC-01 — Duplicate and conflicting action layers
**Category:** Architecture (High)

**Description & Root Cause**
Two layers do the same job with different security properties. `actions/index.ts` (370 lines, unguarded) and the guarded files (`submit.ts`, `admin.ts`, `expert.ts`, `notifications.ts`) overlap in names and behaviour. The `repositories` layer also contains business rules (notifications triggered inside `createForumAnswer`).

**Recommended Solution**
Adopt a strict three-layer rule:
1. `repositories/`: Prisma only, no auth, never imported by client code (`import "server-only"`).
2. `services/`: business rules and notifications; take an already-authorized `actor`.
3. `actions/`: `"use server"`, validates input (zod), authenticates, authorizes, calls services.

Delete duplicates, and keep one `fetchNotifications()` that takes no `userId` parameter. Add `eslint-plugin-boundaries` or `no-restricted-imports` to enforce the layering.

---

### ARC-02 — Three upload mechanisms
**Category:** Architecture (Medium)

**Description & Root Cause**
`actions/upload.ts` (server actions with `File`), `app/api/upload/*` (route handlers), and presigned URLs (`requestMaterialUploadUrl`, `upload-r2.ts`) all exist. Only the API route is used by the current form, and the other two stay exposed. `uploadObjectToR2` also contains a fallback chain (SDK, then HEAD check, then presigned PUT) built for a filtered-network workaround.

**Recommended Solution**
Keep presigned PUT with a post-upload `confirm` action (SEC-04), delete the other two paths, and delete the fallback chain.

---

### ARC-03 — Duplicated components
**Category:** Architecture (Low)

**Description & Root Cause**
Near-duplicates include:
- `auth/LogoutButton` and `layout/LogoutButton`
- `materials/DownloadMaterialButton`, `MaterialDownloadButton` and `shared/DownloadFileButton`
- `RateMaterialForm` and `MaterialRatingForm`
- `CreateForumQuestionForm` and `PostForumQuestionForm`
- `ProfessionalCommentForm` and `ProfessionalRequestCommentForm`
- Five recommendation comment components (`RecommendationComment*`)
- `MaterialRequestForm` and `PostMaterialRequestForm`

**Recommended Solution**
Find the one actually imported (`grep`), delete the rest, and extract a shared `<CommentThread>` and `<FileDownloadButton>`.

---

### ARC-04 — Weak typing
**Category:** Architecture (Low)

**Description & Root Cause**
`any` in `material.repository.ts` (also the one ESLint error). `tsconfig` includes `.next/dev/types`, which produces two stale `tsc` errors. `UpdateUserInput` is reused for both user and admin edits.

**Recommended Solution**
Remove `any`, exclude `.next` in `tsconfig.json`, split input types, and enable `strict` plus `noUncheckedIndexedAccess`.

---

### ARC-05 — No pagination
**Category:** Architecture (Medium)

**Description & Root Cause**
`listMaterials`, `searchForumQuestions`, `listRecommendations`, `listEvents`, `listUsers` and the admin directories use unbounded `findMany`. The forum fetch eagerly loads three nested reply levels. `getMaterialIdsWithAllTags` loads every `entity_tag` row for the filter tags into memory. `resolveExpertReferralId` loads all experts.

**Recommended Solution**
Add cursor pagination (`take`, `cursor`), push the "all tags" filter into SQL (`GROUP BY entity_id HAVING COUNT(DISTINCT tag_id) = n`), add indexes on `(entity_type, entity_id)`, `(is_hidden, created_at)` and `user_id` columns, and look up experts by indexed code.

---

### ARC-06 — N+1 recursive deletes
**Category:** Architecture (Low)

**Description & Root Cause**
`deleteForumAnswerTree` and `deleteProfessionalRequestCommentTree` recurse one query at a time.

**Recommended Solution**
Use schema-level `onDelete: Cascade` (see BUG-06).

---

### INF-01 — No tests
**Category:** Infrastructure (High)

**Description & Root Cause**
No test files, no test runner, and no `test` script. The security bugs above would have been caught by a basic authorization matrix.

**Recommended Solution**
Add Vitest plus a test database (Docker Postgres or a Supabase branch). Priorities:
1. **Authorization matrix test.** For each exported server action, call as anonymous, pending user, approved user, owner, expert and admin, and assert the expected result.
2. Repository tests for visibility filtering.
3. Upload key validation tests.
4. Playwright smoke tests: register, login, upload, comment, report, admin hide.

---

### INF-02 — Logging and monitoring
**Category:** Infrastructure (Medium)

**Description & Root Cause**
Errors are swallowed (`catch {}` in `getAuthSession`, `proxy.ts`) or surfaced with `alert()` (`AdminMaterialsList`). Nothing is logged in production, and Prisma logs only `error` there.

**Recommended Solution**
Add `pino` (or Sentry) with request IDs, log every denied authorization and every admin action, add Next's `instrumentation.ts` for error reporting, and replace `alert()` with a toast.

---

### INF-03 — Environment validation
**Category:** Infrastructure (Medium)

**Description & Root Cause**
`.env.example` documents only `FIRST_ADMIN_USER_IDS` and `NEXT_PUBLIC_SITE_URL`, not `DATABASE_URL`, `DIRECT_URL`, the Supabase keys or the R2 keys. `requireEnv` fails lazily at first use. `SUPABASE_SERVICE_ROLE_KEY` is present in `.env` but is not used in the code reviewed; remove it from the runtime environment if it is unnecessary.

**Recommended Solution**
Create `lib/env.ts` with a zod schema parsed once at boot (`instrumentation.ts`), and list every variable in `.env.example` with no values.

---

### INF-04 — No CI
**Category:** Infrastructure (Medium)

**Recommended Solution**
GitHub Actions: `npm ci`, `prisma generate`, `eslint`, `tsc --noEmit`, `next build`, tests, and `npm audit --omit=dev`. Protect `main` with required checks.

---

### INF-05 — Schema migrations
**Category:** Infrastructure (Medium)

**Description & Root Cause**
The workflow uses `db push`; there is no `prisma/migrations` directory in git. Changes cannot be reviewed or rolled back, and Row Level Security is not defined anywhere. Because the app connects to Postgres through Prisma (bypassing RLS), the database is only as safe as the application code.

**Recommended Solution**
Baseline with `prisma migrate diff`, commit migrations, deploy with `prisma migrate deploy`. Enable RLS on all tables with a deny-all default so the Supabase anon key cannot read tables through PostgREST.

---

### INF-06 — Config cleanups
**Category:** Infrastructure (Low)

**Recommended Solution**
Move Google Fonts to `next/font`, add `"exclude": ["node_modules", ".next"]` to `tsconfig.json`, delete the unused `eslint-disable` and fix the `TagSelect` `aria-required` warning.

---

## 5. Verification & Testing Checklist

Run every item against a staging environment before go-live. Tick each box and record the evidence.

### Security
- [ ] **SEC-01:** From a logged-out `curl` and from a logged-in plain user, invoke each former `actions/index.ts` function (capture the action IDs from the browser's Network tab). Every call must fail with 401/403, and `role` on the test user must be unchanged.
- [ ] **SEC-01:** `grep -L "require" $(grep -rl '"use server"' src)` returns nothing (every server-action file contains an auth guard); CI runs this check.
- [ ] **SEC-01:** `import "server-only"` is present in `repositories/` and `services/`. A client component importing them fails the build.
- [ ] **SEC-02/03:** As user A, request a download URL for a key owned by an unrelated, hidden or non-existent object. Expect rejection. Request an A-owned visible key and expect success with a 5-minute expiry.
- [ ] **SEC-03:** Submit a material with `file_url` set to `materials/<other-user-id>/x.pdf` and to `../../x`. Expect a validation error.
- [ ] **SEC-04:** Upload `.exe`, `.html`, `.svg` and a 200 MB file. All are rejected. Downloaded files carry `Content-Disposition: attachment` and `nosniff`.
- [ ] **SEC-05:** Register with no code, an invalid code, an expired code and your own code. Each behaves per the documented policy. Try 100 wrong codes quickly and confirm the rate limiter blocks it.
- [ ] **SEC-06:** Script 50 requests to login, comment and report. Confirm a 429 after the limit.
- [ ] **SEC-07:** `grep -rn "TLS_REJECT" package.json src .env*` returns nothing. A production boot with the insecure flag set fails.
- [ ] **SEC-08:** Send oversize, empty, wrong-type and Unicode edge payloads to each action. Expect clean validation errors and no stack traces or Prisma messages.
- [ ] **SEC-09:** An admin cannot demote the last admin or set `role: "root"`; every role change appears in the audit log.
- [ ] **SEC-10:** `curl -I` shows all security headers; Mozilla Observatory or securityheaders.com scores A or better; an unauthenticated request to any non-public route redirects to `/login`.
- [ ] **SEC-11/12:** `/auth/callback?code=x&next=//evil.com` and `next=/\evil.com` land on `/`. Forcing an R2 failure returns a generic message.
- [ ] Rotate the Supabase service-role key, DB password and R2 keys; confirm the old ones are revoked.
- [ ] `npm audit --omit=dev` shows no high or critical findings.

### Functional bugs
- [ ] **BUG-01:** `/admin/materials` loads with 0, 1 and 100+ materials; hide, restore and delete work and show tags.
- [ ] **BUG-02:** Visiting an unknown URL and an unknown `[id]`, and forcing a DB error, each show the Hebrew error or not-found page rather than a stack trace.
- [ ] **BUG-03:** Create events with an empty, invalid and out-of-range date or time. Expect field-level errors. A 10:00 Israel-time event displays as 10:00.
- [ ] **BUG-04:** Double-click Rate and Like and run two parallel requests. There is no 500 and the counts are correct. Duplicate reports are rejected.
- [ ] **BUG-05:** Comment on a hidden event and reply to a comment from another thread. Both are rejected. Reporting a nonexistent ID is rejected.
- [ ] **BUG-06:** Delete a reported forum question with nested replies. Either everything is removed or nothing is (verify with a forced mid-failure), and the R2 object is gone.

### Architecture & infrastructure
- [ ] ARC-01: only one implementation exists for each action name; the lint boundary rule passes.
- [ ] ARC-02: only the presigned flow remains and `/api/upload/*` returns 404.
- [ ] ARC-05: forum, materials and admin lists paginate and respond in under 300 ms with 10,000 seeded rows.
- [ ] INF-01: the authorization matrix and smoke suites pass in CI. Coverage on `lib/actions` and `lib/auth` is at least 80%.
- [ ] INF-02: a forced error appears in the monitoring tool with a request ID, and denied authorization attempts are logged.
- [ ] INF-03: starting the app with any required env var missing fails immediately with a clear message.
- [ ] INF-04/05: a clean clone passes `npm ci && npm run lint && npx tsc --noEmit && npm run build && npm test`, and `prisma migrate deploy` applies to an empty database.
- [ ] Lint and type-check output is clean (0 errors, 0 warnings).
- [ ] Manual regression walk-through of every page against the `.cursorrules` spec for each role (user, pending user, expert, admin), in RTL on mobile and desktop.
