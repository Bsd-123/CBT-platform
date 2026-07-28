# Supabase Auth Email Branding

Password reset emails are sent by **Supabase Auth**, not by the Next.js app. Customize them in the Supabase Dashboard using the template in [`email-templates/reset-password.html`](email-templates/reset-password.html).

## 1. Host the logo (public HTTPS URL)

Email clients require a **public HTTPS URL** for images. Choose one option:

### Option A — Supabase Storage (recommended before production domain)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Storage**
2. Create a bucket named `brand-assets` and set it to **Public**
3. Upload your logo (PNG ~200px wide is best for email; replace [`public/brand/logo.svg`](../../public/brand/logo.svg) with your own file)
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

The repo includes a default SVG at [`public/brand/logo.svg`](../../public/brand/logo.svg). Replace it with your brand logo and upload the same file to Supabase Storage (or use `logo.png` after deploy).
