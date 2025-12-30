## Deployment checklist

1. Configure environment variables

   - Copy `.env.example` to `.env` (or set secrets in your platform)
   - Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `WEBHOOK_SECRET_KEY`

2. Database

   - Ensure database is accessible from your deployment target
   - Run Prisma migrations or `prisma db push` as appropriate
   - Optionally run `pnpm run db:seed` to create default accounts

3. Build & run (Docker)

   - Build image: `docker build -t easevote .`
   - Run container: `docker run -e DATABASE_URL='...' -e NEXTAUTH_SECRET='...' -p 3000:3000 easevote`

4. Vercel / Platform-as-a-Service

   - Vercel: just connect the repo; set environment variables in the dashboard
   - Ensure `NEXTAUTH_URL` uses the deployed domain

5. CI

   - GitHub Actions `CI` workflow will build on PRs and pushes to `main`

6. Secrets & rotation
   - Use your provider's secret manager
   - Rotate `NEXTAUTH_SECRET` periodically
