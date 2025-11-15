# OmniForge Studio - Vercel Deployment Guide

## 🚀 Quick Deployment (15 minutes)

This guide will walk you through deploying OmniForge Studio to Vercel with a production database.

---

## Prerequisites

- [x] GitHub account with your repository
- [x] Vercel account (free tier works)
- [x] OpenAI API key
- [x] Database provider account (choose one):
  - Vercel Postgres (recommended, easiest)
  - Supabase
  - Railway
  - Neon
  - PlanetScale

---

## Step 1: Set Up Production Database

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Choose a name like "omniforge-db"
5. Select a region (choose closest to your users)
6. Click "Create"
7. Copy the `DATABASE_URL` connection string

### Option B: Supabase

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Set a secure database password
4. Go to Settings → Database
5. Copy the connection string (Transaction mode)
6. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Option C: Railway

1. Go to [Railway](https://railway.app)
2. New Project → Provision PostgreSQL
3. Go to PostgreSQL → Connect → Copy the DATABASE_URL

---

## Step 2: Prepare Your Repository

### 2.1 Ensure Latest Code

```bash
git pull origin main
```

### 2.2 Verify Files

Make sure these files exist:
- ✅ `prisma/migrations/` directory (with migration files)
- ✅ `package.json` with `vercel-build` script
- ✅ `next.config.ts` with security headers
- ✅ `.env.example` (but NOT `.env`)

### 2.3 Create Migrations (if not done)

```bash
# Use your production database URL temporarily
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
```

This creates migration files in `prisma/migrations/`. Commit them:

```bash
git add prisma/migrations
git commit -m "Add initial database migration"
git push
```

---

## Step 3: Deploy to Vercel

### 3.1 Import Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select "OmniForge Studio" repository

### 3.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify:

- **Framework Preset:** Next.js
- **Root Directory:** `./` (leave as default)
- **Build Command:** `npm run vercel-build` (or leave default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### 3.3 Add Environment Variables

Click "Environment Variables" and add:

#### Required Variables:

```bash
# Database
DATABASE_URL
postgresql://user:password@host:5432/dbname
```

```bash
# NextAuth (generate secret: openssl rand -base64 32)
NEXTAUTH_SECRET
your-generated-secret-key-here
```

```bash
# NextAuth URL (will update after deployment)
NEXTAUTH_URL
https://your-app.vercel.app
```

```bash
# OpenAI API Key
OPENAI_API_KEY
sk-your-openai-api-key
```

#### Optional Variables (for rate limiting with Upstash):

```bash
UPSTASH_REDIS_REST_URL
https://your-redis.upstash.io
```

```bash
UPSTASH_REDIS_REST_TOKEN
your-redis-token
```

**Important:** Select "Production", "Preview", and "Development" for all variables.

### 3.4 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Note your deployment URL (e.g., `https://omniforge-studio-xyz.vercel.app`)

---

## Step 4: Update NEXTAUTH_URL

After first deployment:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NEXTAUTH_URL`
3. Update to your actual domain: `https://your-app.vercel.app`
4. Redeploy: Deployments → Click "..." → Redeploy

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Domain

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `omniforge.com`)
3. Follow DNS configuration instructions

### 5.2 Update Environment Variables

Update `NEXTAUTH_URL` to your custom domain:

```bash
NEXTAUTH_URL=https://omniforge.com
```

Redeploy after changing.

---

## Step 6: Verify Deployment

### 6.1 Health Checks

Test these endpoints:

✅ Homepage loads: `https://your-app.vercel.app`  
✅ Sign up works: `https://your-app.vercel.app/auth/signup`  
✅ Sign in works: `https://your-app.vercel.app/auth/signin`  
✅ Dashboard loads after login  
✅ Create a project  
✅ Generate text, image (test AI features)

### 6.2 Check Logs

Vercel Dashboard → Your Project → Deployments → [Latest] → View Function Logs

Look for:
- ✅ No database connection errors
- ✅ No authentication errors
- ✅ Successful API requests

---

## Step 7: Post-Deployment Setup

### 7.1 Enable Analytics (Optional)

Vercel Dashboard → Your Project → Analytics → Enable

### 7.2 Set Up Monitoring

**Option 1: Vercel Monitoring**
- Enable in Vercel Dashboard

**Option 2: External (Sentry)**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 7.3 Set Up Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com) or [Checkly](https://www.checklyhq.com):
- Monitor your homepage
- Monitor API health endpoint
- Set up email/SMS alerts

---

## Troubleshooting

### Build Fails

**Error: `Prisma migrate deploy failed`**

**Solution:**
```bash
# Ensure migrations exist locally
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add migrations"
git push
```

**Error: `Missing environment variable`**

**Solution:**
- Verify all required env vars are set in Vercel
- Make sure they're enabled for "Production"

### Database Connection Errors

**Error: `Can't reach database server`**

**Solution:**
1. Check DATABASE_URL is correct
2. Verify database is running
3. Check firewall allows Vercel IPs
4. Supabase: Use "Transaction" mode connection string

### Authentication Errors

**Error: `NEXTAUTH_URL mismatch`**

**Solution:**
1. Update NEXTAUTH_URL to match your deployment URL
2. Redeploy after changing

**Error: `NEXTAUTH_SECRET is not set`**

**Solution:**
```bash
# Generate a secret
openssl rand -base64 32

# Add to Vercel env vars
```

### OpenAI API Errors

**Error: `Invalid API key`**

**Solution:**
1. Verify OPENAI_API_KEY is correct
2. Check OpenAI dashboard for key status
3. Ensure key has credits

**Error: `Rate limit exceeded`**

**Solution:**
- Implement rate limiting (see lib/rate-limit.ts)
- Upgrade OpenAI plan if needed

---

## Maintenance

### Update Dependencies

```bash
npm update
npm audit fix
git commit -am "Update dependencies"
git push
```

Vercel auto-deploys on push to main.

### Database Migrations

When you change the Prisma schema:

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Commit and push
git add prisma/migrations
git commit -m "Add migration: your_migration_name"
git push
```

Vercel runs `prisma migrate deploy` automatically.

### Rollback Deployment

Vercel Dashboard → Deployments → Click previous deployment → "Promote to Production"

### View Logs

Vercel Dashboard → Your Project → Deployments → [Latest] → View Function Logs

---

## Scaling Considerations

### When you start getting traffic:

1. **Enable Edge Caching**
   - Use `getStaticProps` for public pages
   - Enable ISR for semi-dynamic content

2. **Upgrade Database**
   - Monitor connection pool usage
   - Consider read replicas for heavy read workloads

3. **Implement Redis Rate Limiting**
   - Use Upstash Redis (see lib/rate-limit.ts comments)
   - Prevents API abuse and cost overruns

4. **Set Up CDN**
   - Vercel includes CDN by default
   - Configure edge caching in next.config.ts

5. **Monitor Costs**
   - Set up OpenAI API cost alerts
   - Monitor Vercel usage limits
   - Track database connection usage

---

## Cost Estimates

### Free Tier (Good for 100-500 users/month)

- **Vercel:** Free (Hobby plan)
- **Vercel Postgres:** $0 (generous free tier)
- **OpenAI:** Pay-as-you-go (~$0.01-0.10 per generation)

### Production Scale (1000+ users)

- **Vercel:** $20/month (Pro plan)
- **Database:** $5-20/month
- **OpenAI:** Variable ($50-500+/month depending on usage)
- **Monitoring:** $0-50/month (optional)

---

## Security Checklist

✅ All environment variables are set  
✅ NEXTAUTH_SECRET is strong and unique  
✅ Database uses SSL connection  
✅ Rate limiting is enabled  
✅ Security headers are configured  
✅ Image domains are restricted  
✅ No secrets in Git repository  
✅ Error monitoring is set up  
✅ Backups are enabled (database provider)

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://next-auth.js.org

---

## Emergency Contacts

- **Vercel Support:** support@vercel.com
- **OpenAI Support:** https://help.openai.com
- **Your Database Provider Support:** (check their website)

---

**Last Updated:** 2025-11-15  
**Version:** 1.0  
**Maintained by:** OmniForge Team

---

## Quick Reference

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### View Logs
```bash
vercel logs [deployment-url]
```

### Redeploy
```bash
vercel --prod
```

### Run Migrations
```bash
DATABASE_URL="..." npx prisma migrate deploy
```

---

Good luck with your deployment! 🚀
