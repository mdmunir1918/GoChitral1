# GoChitral

GoChitral is a Chitral travel discovery and planning app built with Next.js, Prisma, and PostgreSQL.

## Local development

1. Install Node.js and npm.
2. Copy `.env.example` to `.env.local` and configure a **local PostgreSQL database** plus the required development settings. Keep production secrets out of `.env.example` and source control.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`. This generates Prisma Client and restarts the development server when the Prisma schema changes. Keep only one development server running.
5. Open [http://localhost:3000](http://localhost:3000).

## Local demo records

Demo records are fictional and must not be added to the public production database. The seed script refuses non-local database hosts and production mode.

1. Point `.env.local` at a local PostgreSQL database and apply the Prisma migrations.
2. In PowerShell, set a local-only test password and seed the sample tourist, hotel owner, hotel, restaurant, place, and activity:

   ```powershell
   $env:DEMO_ACCOUNT_PASSWORD = "choose-a-local-test-password"
   npm run db:seed:demo
   Remove-Item Env:DEMO_ACCOUNT_PASSWORD
   ```

   Sign in locally with `demo.tourist@gochitral.test` or `demo.hotel-owner@gochitral.test` and the password you set. The generated listings are visibly marked `[DEMO]` and fictional.

## Checks

- `npm run typecheck`
- `npm run lint`
- `npx prisma validate`
- `npm run build`

Never commit `.env`, `.env.local`, or credentials.
