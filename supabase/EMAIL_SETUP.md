# Supabase Auth Email Branding

Password reset emails are sent by **Supabase Auth**, not by the Next.js app. Customize them in the Supabase Dashboard using the template in [`email-templates/reset-password.html`](email-templates/reset-password.html).

## 1. Host the logo (public HTTPS URL)

Email clients require a **public HTTPS URL** for images. Choose one option:

### Option A — Supabase Storage (recommended before production domain)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Storage**
2. Create a bucket named `brand-assets` and set it to **Public**
3. Upload your logo (PNG ~200px wide is best for email; the repo ships [`public/brand/logo.png`](../../public/brand/logo.png))
4. Copy the public object URL, e.g.  
   `https://<project-ref>.supabase.co/storage/v1/object/public/brand-assets/logo.png`

### Option B — App static file (after deploy)

1. Add your logo as [`public/brand/logo.png`](../../public/brand/logo.png) (PNG preferred for email)
2. Set `NEXT_PUBLIC_SITE_URL` in `.env` to your production URL
3. Logo URL: `https://YOUR-DOMAIN/brand/logo.png`

## 2. Customize the Reset Password email template

1. Supabase Dashboard → **Authentication** → **Email Templates** → **Reset Password**
2. **Subject:**
   ```
   איפוס סיסמה — קהילת מטפלי CBT
   ```
3. **Body:** Copy from [`email-templates/reset-password.html`](email-templates/reset-password.html)
4. Replace `LOGO_URL` with your public logo URL from step 1
5. Keep `{{ .ConfirmationURL }}` unchanged — it links to your app’s [`/auth/callback`](../../src/app/auth/callback/route.ts) flow

## 3. URL configuration

Authentication → **URL Configuration**:

| Setting | Dev | Production |
|--------|-----|------------|
| Site URL | `http://localhost:3000` | `https://YOUR-DOMAIN` |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://YOUR-DOMAIN/auth/callback` |

Redirect URLs must include the callback used by password reset:

```
http://localhost:3000/auth/callback?next=/reset-password
```

(Add the production equivalent when you deploy.)

## 4. Optional — Custom SMTP (sender name)

Authentication → **Email** → enable **Custom SMTP** to send from e.g.  
`קהילת מטפלי CBT <noreply@yourdomain.com>`

Without custom SMTP, the sender may still show as Supabase; the HTML template still adds your site name and logo.

## Replace the placeholder logo

The repo includes the CBTeam logo at [`public/brand/logo.png`](../../public/brand/logo.png). Upload the same file to Supabase Storage, or use its deployed URL.

---

# Notification emails (Resend)

Separate from the Supabase Auth emails above, the app sends its own notification emails through
[Resend](https://resend.com). They are sent from the server after the response, so they never slow
down a request, and the feature is **off until configured**.

## What gets emailed

| Event | Recipient | Content |
|---|---|---|
| Answer posted on a forum question | the question's author | preview of the answer + link to it |
| Comment on a professional request | the request's author | preview + link |
| Response to a material request (text and/or an uploaded file) | the requester | preview + link |
| Organizer edits an event (date, time, title, description, cancellation) | everyone who starred the event, except the editor | before/after of each change + current details + link |
| Content hidden or deleted by an admin, or a material rejected by a reviewer | the content's author | what happened, the reason, and a request to follow the community guidelines |

Nobody is emailed about their own actions. Templates live in `src/lib/email/` (`layout.ts` is the
shared branded shell, `templates.ts` the individual emails).

## Setup

1. Create a Resend account and an API key, and verify your sending domain (Resend → Domains).
2. Set these server environment variables (Vercel → Settings → Environment Variables):

   | Variable | Value |
   |---|---|
   | `RESEND_API_KEY` | your Resend key |
   | `EMAIL_FROM` | `קהילת מטפלי CBT <no-reply@your-domain.com>` (must be on the verified domain) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (server only) |
   | `NEXT_PUBLIC_SITE_URL` | your production URL, used for links in emails |

   Until all of `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SITE_URL` are set, no
   email is sent and nothing else changes. Without `EMAIL_FROM`, Resend's test sender is used, which
   only delivers to the address of your own Resend account.
3. Apply the migration `supabase/migrations/20261011214437_event_favorites.sql` (adds the
   `event_favorites` table used by the star button).

The service-role key is used only in `src/lib/email/lookup.ts` to read members' addresses and the
list of people who starred an event. Row Level Security keeps every member's favorites private
from other members.

## Not covered

There is no per-user opt-out yet, and events have no location field, so updates cover the
fields that exist: date, time, title, description and cancellation.
