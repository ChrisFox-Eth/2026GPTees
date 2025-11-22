# Prisma / Supabase setup

## Connection
- Set `DATABASE_URL` in `backend/.env` to your Supabase Postgres connection string (Settings ➜ Database ➜ Connection string, use the pooled URL for production).
- Example: `DATABASE_URL=postgresql://user:password@host:5432/postgres?schema=public`

## Migrations
- Initial migration is checked in at `prisma/migrations/202511220001_init/migration.sql`.
- Apply to Supabase:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```
- For local dev without Supabase, you can use `npx prisma db push` against a local Postgres instance.

## Seeding
```bash
cd backend
DATABASE_URL=... npx prisma db seed
```

## Generating client
```bash
npx prisma generate
```

## Notes
- Models include users, addresses, products, orders, designs, payments, refunds, and settings.
- Order addresses are required for Printful submission; the Stripe checkout flow now creates the address record before payment.
