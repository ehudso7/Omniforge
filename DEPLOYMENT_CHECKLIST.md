# Vercel Deployment Checklist

## Pre-Deployment

### 1. Environment Variables (Set in Vercel Dashboard)

Go to: **Project Settings → Environment Variables**

Required variables:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `OPENAI_API_KEY` - Your OpenAI API key (starts with `sk-`)
- [ ] `NODE_ENV` - Set to `production` (usually automatic)

### 2. Database Setup

- [ ] Create PostgreSQL database (Vercel Postgres, Supabase, Neon, etc.)
- [ ] Get connection string
- [ ] Add `DATABASE_URL` to Vercel environment variables
- [ ] Run migrations (Vercel will handle this during build, or run manually):
  ```bash
  npx prisma migrate deploy
  ```

### 3. Build Verification

- [ ] Test build locally:
  ```bash
  npm install
  npm run build
  ```
- [ ] Verify no build errors
- [ ] Check bundle sizes are reasonable

## Deployment

### 4. Deploy to Vercel

- [ ] Push code to repository
- [ ] Vercel will automatically detect and deploy
- [ ] Monitor build logs for errors

### 5. Post-Deployment Verification

- [ ] Health check: `https://your-app.vercel.app/api/health`
  - Should return `{"status":"healthy","database":"connected"}`
- [ ] Test authentication flow (signup → signin)
- [ ] Verify security headers:
  ```bash
  curl -I https://your-app.vercel.app
  ```
- [ ] Test core functionality:
  - [ ] Create project
  - [ ] Generate text
  - [ ] Generate image
  - [ ] View assets

## Monitoring

### 6. Set Up Monitoring

- [ ] Monitor Vercel logs for errors
- [ ] Set up error alerts (recommend Sentry integration)
- [ ] Monitor database connection pool
- [ ] Track API usage and costs (OpenAI)

## Security

### 7. Security Verification

- [ ] Verify all environment variables are set
- [ ] Check security headers are present
- [ ] Test rate limiting (if implemented)
- [ ] Verify HTTPS is enforced
- [ ] Review access logs for suspicious activity

## Quick Commands

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Test health endpoint
curl https://your-app.vercel.app/api/health

# Check security headers
curl -I https://your-app.vercel.app

# Run migrations manually (if needed)
npx prisma migrate deploy
```

## Troubleshooting

**Build fails:**
- Check all environment variables are set
- Verify `DATABASE_URL` format is correct
- Check build logs in Vercel dashboard

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel
- Ensure database is running

**Authentication not working:**
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check `NEXTAUTH_SECRET` is set and valid (32+ chars)
- Review NextAuth logs

**API errors:**
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI account has credits
- Review API rate limits

---

**Status:** ✅ Ready for deployment  
**Last Updated:** $(date)
