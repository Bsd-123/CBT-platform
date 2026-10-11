# Interactive-Element, Design Consistency & Remaining-Work Report

**Project:** CBT Community Platform · **Branch audited:** `security-hardening` (HEAD `2253a46`) · **Date:** 2026-10-06
**Method:** static analysis only. I wrote two scanners (JSX tag parser for every `<button>`, `<form>`, `<a>`/`<Link>`, controlled input, `router.push`, `redirect`; and a CSS-class coverage mapper per route) and read the key pages by hand against `.cursorrules` (the spec). **Nothing was exercised in a browser**, so visual findings are inferred from markup and CSS, not from screenshots. Items marked *(inferred)* need a quick visual confirmation.

Security and architecture findings are already tracked in `ACTION_PLAN.md`; this report covers what that plan did not.

---

## 1. Executive Summary

**Wiring is in good shape; design consistency and feature depth are the weak spots.**

| Area | Verdict |
|---|---|
| Interactive wiring | 🟢 **Good.** 98 buttons scanned: all have a handler or are form submits except one cosmetic indicator. 0 dead (`#`/empty) links, 0 internal links to nonexistent routes (31 routes checked, plus every `router.push`/`redirect`). No empty handlers. |
| Navigation completeness | 🟡 `/admin/materials` is reachable only by typing the URL. 12 components are dead code, including the whole "cancel event" action component. |
| Design consistency | 🔴 **Two design systems.** Materials, Home, Profile, Recommendations, Auth and two Admin pages have bespoke, polished styling. Forum, Events (list + detail), Professional Requests and four Admin pages use only generic `card`/`stack` primitives and look like a different product. |
| Spec completeness | 🟡 Core spaces exist. Gaps: notifications don't link anywhere, comments and requests can't be reported, list pages omit author/date/tags/counts, and a few features go beyond the spec (monthly goal, expert referral table). |
| Data realism | 🟡 Mostly live data. Home page uses 4 external stock photos and decorative fake avatars; profile has a hardcoded monthly goal of 10. |
| Correctness bugs found | 🔴 Event times display shifted by the viewer's UTC offset (see F-01). |

Bottom line: there is no widespread "broken button" problem. The work remaining is (1) bring Forum, Events, Professional Requests and Admin pages up to the Materials design language, (2) close the notification and reporting gaps, and (3) fix the event-time bug.

---

## 2. Functional Audit

### 2.1 Scan results

| Check | Result |
|---|---|
| `<button>` elements | 98 — 97 wired (onClick or inside a form as submit), 1 non-interactive |
| `<form>` without `onSubmit`/`action` | 0 |
| `<a>`/`<Link>` without `href`, or `href="#"`/`""` | 0 |
| Literal and template hrefs that match no route | 0 |
| `router.push` / `redirect` targets that match no route | 0 |
| Empty handlers (`onClick={() => {}}`) | 0 |
| Controlled inputs missing `onChange` | 0 real (1 false positive: uncontrolled checkbox with `defaultChecked`) |
| Native `alert()` / `confirm()` | 3 uses in 2 files |

### 2.2 Issues by file

| ID | File / component | Issue | Severity |
|---|---|---|---|
| F-01 | ✅ **Fixed** (formatters in `src/lib/utils/calendar.ts`, test `tests/event-datetime.test.ts`). `src/app/(main)/events/[id]/page.tsx:38` | Event time is stored as a UTC clock value (`setUTCHours`) and the calendar util reads it with `getUTCHours`, but the detail page uses `toLocaleTimeString("he-IL")` **without `timeZone: "UTC"`**. A 09:00 event displays as 12:00 for an Israeli viewer (the calendar utility reads the same value as UTC, so the detail page and calendar disagree). | **High** |
| F-02 | `components/notifications/NotificationsBell.tsx` | Notification rows show only a text label. `reference_type`/`reference_id` are stored but never used, so clicking a notification can't take you to the comment, answer or request. No click-outside or Escape to close the panel. Heavy inline styles. | **High** |
| F-03 | `NotificationsBell.tsx` + RLS | Realtime uses the browser Supabase client with the anon key. If RLS is enabled with deny-all (as `ACTION_PLAN.md` INF-05 recommends), live updates stop silently. Needs a `SELECT` policy `auth.uid() = user_id` on `notifications` and the table added to the Realtime publication. | **High** *(inferred)* |
| F-04 | `components/admin/AdminNav.tsx`, `admin/page.tsx` | `/admin/materials` has no link anywhere in the UI (nav lists reports/users/experts/tags/categories). The `/admin` overview page is also unreachable: the header "ניהול" link goes straight to `/admin/reports`. | Medium |
| F-05 | `components/shared/ReportForm.tsx` usage | Reports can target material, forum question/answer, recommendation, event and professional request only. The spec says "any content": recommendation comments, event comments, professional-request comments, material requests and responses can't be reported. Needs new `ReportTargetType` values (schema change) plus moderation hide/delete support. | Medium |
| F-06 | `components/admin/AdminMaterialsList.tsx:35,73` | `alert()` for errors and `confirm()` for delete; raw `<button className="button">` with inline pagination; `table` class has **no CSS definition**. | Medium |
| F-07 | `components/admin/AdminUsersTable.tsx:336` | Current-page `<button>` with no handler (indicator only). Should be a `<span aria-current="page">`. | Low |
| F-08 | 12 unused components | Dead code, several are near-duplicates that confuse maintenance: `EventDetailActions`, `CreateForumQuestionForm`, `MaterialDownloadButton`, `MaterialFilterForm`, `MaterialRequestForm`, `MaterialsActiveFilters`, `RateMaterialForm`, `ProfessionalCommentForm`, `RecommendationCommentList`, `RecommendationComments`, `RecommendationCommentsList`, `shared/DownloadFileButton`. `EventDetailActions` also contains a `confirm()` and a cancel flow that is not mounted (cancel currently works through `EditEventForm`, so no feature is lost). | Low |
| F-09 | `app/(main)/recommendations/[id]/page.tsx` | Only redirects to `/recommendations#rec-<id>`. Fine, but there's no not-found handling for an invalid id, and the anchor target depends on the chat feed rendering every item. | Low |
| F-10 | `components/layout/AppNav.tsx` + `globals.css` | 7+ header links with `flex-wrap` inside a fixed `height: 4rem` header and **no mobile menu**. On phones the links wrap past the header height (overlap/clipping) *(inferred)*. | Medium |
| F-11 | `NotificationsBell`, forms | Most error states are inline text; there is no toast/confirm component, so destructive actions use `confirm()` or none. | Low |

### 2.3 Unhandled states worth confirming in a browser *(inferred)*

- Forum, Professional Requests, Events and Recommendations lists have no pagination or loading skeleton (`(main)/loading.tsx` now provides a generic one).
- In production Next.js hides thrown server-action error messages, so forms may show a generic message instead of the Hebrew text (noted in the Phase 2 summary).
- Home page is inside the authenticated layout, so its marketing copy ("כניסה לקהילה", "גלו את ספריית החומרים") is only ever shown to people who are already logged in.

---

## 3. UI Consistency Report (benchmark: `/materials`)

### 3.1 What the benchmark defines

`materials.css` ("Clinical Clarity") provides: a hero header (H1 2rem/600 + subtitle + primary/secondary action buttons), a tab bar, a 16rem sidebar + main layout that collapses below 1024px, rich cards (type icon, badges, tag chips, rating, meta row), an empty-state component, a design-token set (`--cc-*`, radii 0.5/0.75/1rem, one shadow), and breakpoints at 640/768/1024/1280.

### 3.2 Coverage by route

| Route | Styling system | Matches benchmark? |
|---|---|---|
| `/materials` and subpages (`request`, `upload`, `[id]`, `requests/[id]`) | `materials-*` | ✅ Benchmark |
| `/` Home | `home-*` (own hero, cards, footer, FAB) | 🟡 Same palette and tokens; different layout language (full-bleed marketing sections) |
| `/profile` | `profile-*` | ✅ Close (same tokens, card style, tabs) |
| `/recommendations`, `/recommendations/new` | `rec-*` | ✅ Close |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/complete-profile`, `/pending-approval` | `auth-*` | ✅ Acceptable (focused single-card layout is appropriate) |
| `/admin/users`, `/admin/experts`, `/expert/referrals` | `admin-users-*`, `admin-experts-*` | ✅ Close (stat cards, toolbar, chips, pagination) |
| **`/forum`** | generic `card` / `stack` / `list-plain` only | ❌ |
| **`/forum/[id]`** | generic + `thread-form`, `thread-list`, `thread-item` (**classes not defined in any CSS file**) | ❌ |
| **`/events`**, **`/events/[id]`** | generic only | ❌ |
| **`/events/calendar`** | `calendar-*` in `globals.css` (own styling) | 🟡 Styled but with a different heading/toolbar pattern |
| **`/professional-requests`**, **`/professional-requests/[id]`** | generic only (+ undefined `thread-*`) | ❌ |
| **`/admin`**, **`/admin/reports`**, **`/admin/tags`**, **`/admin/categories`**, **`/admin/materials`** | generic only (`/admin/materials` uses an undefined `table` class) | ❌ (inconsistent with `/admin/users` and `/admin/experts`) |

### 3.3 Specific deviations

| ID | Deviation | Where | Fix direction |
|---|---|---|---|
| U-01 | **No hero header.** Pages start with a plain `<section className="card">` holding an H1 and muted line; benchmark uses the `materials-hero` pattern (H1 2rem/600, subtitle, action buttons right-aligned). | forum, events, professional-requests, admin index/reports/tags/categories/materials | Extract a shared `PageHero` and use it on every page |
| U-02 | **Posting forms are always expanded** in their own card above the list, pushing content down. Materials/Recommendations put the primary action in the hero and use a dedicated page or FAB. | forum, events, professional-requests | Hero "new" button → modal or `/new` page, as Materials/Recommendations do |
| U-03 | **Plain bullet lists instead of cards.** List rows are title link + muted text, no author, date, tags, counts or hover state. Benchmark cards show type, tags, rating, meta. | forum list, events list, professional-requests list | Shared `ContentCard` with author, relative date, tag chips, comment/answer/like counts |
| U-04 | **Tags not shown in lists** although the spec puts tags on questions (and the Materials cards show them). | forum list | Fetch entity tags for list view |
| U-05 | **Events list omits date and time** for the main list; date appears only in a second "calendar" section that duplicates the list. | events | One list with date badge; calendar stays on its tab |
| U-06 | **Tab/view switcher style differs.** Events uses plain `nav-links` underline links; Materials/Profile use styled tab bars. | events (`EventsViewNav`), calendar | Reuse `materials-library-tabs` / `profile-tab` pattern |
| U-07 | **Undefined CSS classes** render unstyled: `thread-form`, `thread-list`, `thread-item`, admin `table`. Nested threads therefore have no indentation, borders or reply affordance styling. | `ForumAnswerThread`, `ProfessionalRequestCommentThread`, `AdminMaterialsList` | Add real styles (or reuse recommendation comment styles) |
| U-08 | **Inline styles** for layout in several components (`style={{ display: "flex", justifyContent … }}`). | `events/page.tsx`, `NotificationsBell`, `EventsViewNav`, others | Move to classes |
| U-09 | **Two token systems.** `globals.css` defines `--primary`, `--surface`…; `materials.css` redefines the same palette as `--cc-*` scoped to `.materials-space`. Other pages' CSS use whichever was convenient. Any palette tweak must be made in two places. | all CSS | Single token file; alias `--cc-*` to it |
| U-10 | **Duplicate import:** `globals.css` has `@import "./home.css"` twice, and imports `materials.css` and `home.css` globally while other page CSS is imported per route. | `globals.css:1-3` | Import once; make per-route CSS consistent |
| U-11 | **Admin area is split in two styles.** Users/Experts have stat cards, toolbar, filter chips and pagination; Reports/Tags/Categories/Materials are bare lists and forms. | admin | Apply the `admin-users-*` pattern to the rest |
| U-12 | **Responsive gaps.** Materials has breakpoints at 640/768/1024/1280; Forum/Events/Professional pages rely only on the global 767px padding rule; header has no mobile menu (F-10). | forum, events, professional-requests, header | Mobile pass after U-01/U-03 |
| U-13 | **Empty states.** Benchmark has an icon + message empty-state block (`materials-empty`); other pages use a single muted line. | forum, events, professional-requests | Shared `EmptyState` |
| U-14 | **Native dialogs** (`confirm`, `alert`) clash with the design language. | AdminMaterialsList | In-app confirm dialog + toast |

---

## 4. Gap Analysis & Remaining Work

### 4.1 Spec compliance notes

| Spec item | Status |
|---|---|
| Materials: upload, request, respond, rate, filter by type, tags, no comments | ✅ present |
| Forum: nested answers, likes, in-space search, tags on questions | ✅ logic present; tags **not visible in list** (U-04) |
| Recommendations: flat + one reply level, tags | ✅ (depth enforced in repository) |
| Events: list + calendar, owner edit, cancel (owner/admin), "My Events" in profile | ✅ present; time display bug (F-01) |
| Professional requests: nested comments, no likes/ratings | ✅ |
| Profile: full history, no avatar picture | ✅ (initial-letter avatar only) |
| Notifications in-app + Realtime | 🟡 works, but no deep links (F-02) and RLS interplay (F-03) |
| Reports: any content, open/reviewing/resolved, hide/restore/delete | 🟡 only 6 target types (F-05) |
| Iron rule 2/3 (no scoring/XP) | ⚠️ Profile card "יעד חודשי: X% הושלם" with a hardcoded goal of 10 (`ProfilePageView.tsx:139`) is gamification the spec forbids. Recommend removing or confirming with the product owner. |
| Iron rules 6/7 (no expert dashboard or tracking) | ⚠️ `/expert/referrals` reuses the admin table pattern (filtering, pagination) plus a referral-code banner, and `/admin/experts` shows pending/approved/total referral counts per expert. Approving is required; the dashboard-like extras arguably aren't. Confirm intent. |
| Search per space only | ✅ (forum, materials); no global search |

### 4.2 Hardcoded / placeholder content

- `app/(main)/page.tsx`: hero image and three gallery images are **Unsplash stock photos** hot-linked from `images.unsplash.com` (availability, licensing/attribution, privacy and CSP `img-src https:` all depend on a third party); three empty "avatar" circles and the claim "קהילה פעילה של מטפלים" are decorative and not driven by data.
- `ProfilePageView.tsx:139`: `monthlyGoal = 10`.
- No `TODO`/`FIXME`/"not implemented" markers anywhere in `src/`, and no stubbed functions found.

### 4.3 Prioritized roadmap

**Critical** (blocks production use)
- [ ] Complete the remaining critical items from `ACTION_PLAN.md`: merge `security-hardening`, rotate secrets, decide SEC-05 referral policy.
- [x] **F-01** Fix event time display (render with `timeZone: "UTC"` or, better, store a real timestamp + timezone). Add a test.

**High**
- [ ] **F-02** Make notifications navigable: map `reference_type`/`reference_id` to routes (`forum` → `/forum/:id`, `recommendation` → `/recommendations#rec-:id`, `event`/`professional_request` → their pages, `material_request` → `/materials/requests/:id`); close on outside click/Escape; mark read on click.
- [ ] **F-03** Add RLS `SELECT` policy and Realtime publication for `notifications` *before* enabling deny-all RLS; verify live updates after.
- [ ] **U-01/U-03/U-13** Build shared `PageHero`, `ContentCard`, `EmptyState` components and rebuild **Forum list, Events list, Professional Requests list** on them (with author, date, tags, counts).
- [ ] **U-07** Define thread styles for Forum and Professional Requests comment trees (indent guides, reply button, report button placement).
- [ ] **F-05** Extend reports to comments, material requests and responses (enum + moderation support).
- [ ] Production error-message handling for server actions (return result objects instead of throwing).

**Medium**
- [ ] **U-02** Move post forms behind hero buttons / dedicated pages.
- [ ] **U-11/F-04/F-06/U-14** Restyle Admin Reports, Tags, Categories, Materials with the `admin-users-*` pattern; link `/admin/materials` and `/admin` in `AdminNav`; replace `alert`/`confirm` with a dialog + toast.
- [ ] **U-05/U-06** Events: single list with date badges; tab bar matching Materials/Profile.
- [ ] **F-10/U-12** Mobile header menu and a responsive pass on all non-benchmark pages.
- [ ] **U-09/U-10** Consolidate design tokens; remove the duplicate import; decide on global vs per-route CSS.
- [ ] Pagination for all list pages (see `ACTION_PLAN.md` ARC-05).
- [ ] Resolve the two spec questions in 4.1 (monthly goal; expert referral dashboard).

**Low**
- [ ] **F-08** Delete the 12 unused components (or wire them in if intentionally spare).
- [ ] **F-07** Turn the page indicator into a non-button element with `aria-current`.
- [ ] **U-08** Replace inline styles with classes.
- [ ] Self-host or replace Home page stock photos; drop the fake avatar circles.
- [ ] **F-09** Not-found handling for recommendation ids.
- [ ] Accessibility sweep (focus states, `aria-live` for form errors, contrast check of the muted/primary colors, RTL review).
- [ ] Remaining `ACTION_PLAN.md` Phase 3 items (logging, migrations, extended tests, Playwright smoke tests for the flows above).

### 4.4 Suggested order of work

1. F-01 (small, user-visible bug) → 2. shared UI primitives (`PageHero`, `ContentCard`, `EmptyState`, tabs) → 3. rebuild Forum / Events / Professional Requests on them (fixes U-01–U-07, U-13 together) → 4. notifications deep-links + RLS policy → 5. Admin restyle → 6. mobile pass → 7. cleanup.

---

*Limitations: no browser run, so spacing, contrast and responsive behaviour are inferred from CSS. The scanners can't see handlers passed through spread props or conditional rendering logic. Pages built dynamically (`href` from variables) were verified by reading the arrays (`SPACE_LINKS`, `SPACES`, admin nav).*
