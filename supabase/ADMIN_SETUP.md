# Admin User Setup

Admin role is stored in the **`users`** table (`role = admin`), not in Supabase Auth.

## Step 1 — Register users (required first)

Each admin must:

1. Register at `/register`
2. Complete profile at `/complete-profile` (creates a row in `users`)

Without a `users` row, promotion will fail.

Find UUIDs in:

- Supabase Dashboard → **Authentication → Users** → User UID
- Or `npm run db:studio` → `users` table

## Step 2 — Bootstrap two (or more) admins

Pick **one** method:

### Method A — SQL (fastest for multiple admins)

1. Open Supabase Dashboard → **SQL Editor**
2. Edit and run [`promote-admins.sql`](promote-admins.sql):

```sql
UPDATE users
SET role = 'admin'
WHERE id IN (
  'uuid-user-1',
  'uuid-user-2'
);
```

### Method B — Seed env (multiple admins)

In `.env`:

```env
FIRST_ADMIN_USER_IDS=uuid-user-1,uuid-user-2
```

Legacy single-admin env still works:

```env
FIRST_ADMIN_USER_ID=uuid-user-1
```

Then run:

```bash
npm run db:seed
```

### Method C — Prisma Studio

```bash
npm run db:studio
```

Open `users` → set `role` = `admin` for each user → Save.

## Step 3 — Refresh session

Each promoted user should **log out and log back in** to see **ניהול** in the navigation.

## Future changes (add / remove admins)

Once at least one admin exists, use the app UI:

1. Log in as admin
2. Go to **ניהול → משתמשים** (`/admin/users`)
3. Click **`admin`** to promote, or **`user`** / **`expert`** to remove admin

| Action | How |
|--------|-----|
| Add admin | Set role to `admin` |
| Remove admin | Set role to `user` or `expert` |
| Add expert | Set role to `expert` |

## If all admins are lost

Run SQL or Prisma Studio again to set `role = 'admin'` on a trusted user UUID.
