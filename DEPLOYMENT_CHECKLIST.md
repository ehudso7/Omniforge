# Vercel Deployment Checklist

## Pre-Deployment

### 1. Environment Variables Setup
Add these in Vercel Dashboard → Project → Settings → Environment Variables:

- [ ] `DATABASE_URL` - PostgreSQL connection string
  - Example: `postgresql://user:password@host:5432/dbname?sslmode=require`
  - Use Vercel Postgres, Supabase, Neon, or Railway

- [ ] `NEXTAUTH_URL` - Your production URL
  - Example: `https://yourdomain.com` or `https://your-project.vercel.app`
  - Must start with `https://` in production

- [ ] `NEXTAUTH_SECRET` - Strong secret key
  - Generate with: `openssl rand -base64 32`
  - Must be at least 32 characters long
  - Keep this secret!

- [ ] `OPENAI_API_KEY` - OpenAI API key
  - Format: `sk-...`
  - Get from: https://platform.openai.com/api-keys

### 2. Database Setup

- [ ] Create production PostgreSQL database
  - Vercel Postgres (recommended): https://vercel.com/docs/storage/vercel-postgres
  - Supabase: https://supabase.com
  - Neon: https://neon.tech
  - Railway: https://railway.app

- [ ] Run database migrations
  ```bash
  # Set DATABASE_URL environment variable first
  export DATABASE_URL="your-production-database-url"
  
  # Run migrations
  npx prisma migrate deploy
  ```

- [ ] Verify database connection
  ```bash
  npx prisma db pull
  ```

### 3. Code Verification

- [ ] Code is pushed to repository
- [ ] All environment variables are set in Vercel
- [ ] No sensitive data in code (check for hardcoded secrets)
- [ ] `.env` file is in `.gitignore` (should not be committed)

## Deployment

### 4. Vercel Project Setup

- [ ] Create new project in Vercel (or connect existing)
- [ ] Connect GitHub/GitLab repository
- [ ] Configure build settings:
  - Framework Preset: Next.js
  - Build Command: `npm run build` (default)
  - Output Directory: `.next` (default)
  - Install Command: `npm install` (default)

- [ ] Add all environment variables from step 1
- [ ] Set production environment for all variables

### 5. Deploy

- [ ] Trigger deployment (push to main branch or manual deploy)
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete

## Post-Deployment Verification

### 6. Application Testing

- [ ] Application loads at production URL
- [ ] No console errors in browser
- [ ] Signup page works
- [ ] Signin page works
- [ ] Can create account
- [ ] Can sign in with created account
- [ ] Dashboard loads
- [ ] Can create project
- [ ] Can generate text
- [ ] Can generate image
- [ ] Can generate audio (if implemented)
- [ ] Can generate video storyboard

### 7. Security Verification

- [ ] Check security headers: https://securityheaders.com
  - Should see: HSTS, X-Frame-Options, CSP, etc.
- [ ] Test rate limiting (make 61 requests quickly)
- [ ] Verify authentication required for protected routes
- [ ] Test input validation (try XSS attempts)
- [ ] Verify HTTPS is enforced

### 8. Performance Check

- [ ] Page load time < 3 seconds
- [ ] API response times < 1 second
- [ ] No memory leaks (monitor over time)
- [ ] Database queries are optimized

### 9. Monitoring Setup (Recommended)

- [ ] Set up Vercel Analytics
- [ ] Set up error tracking (Sentry recommended)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure alerts for errors and downtime

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure `DATABASE_URL` is correct
4. Check for TypeScript errors locally: `npm run build`

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check database is accessible from Vercel IPs
3. Ensure SSL is enabled: `?sslmode=require`
4. Verify database exists and migrations are run

### Authentication Not Working

1. Verify `NEXTAUTH_URL` matches your production URL exactly
2. Check `NEXTAUTH_SECRET` is set and valid
3. Ensure cookies are enabled in browser
4. Check browser console for errors

### API Errors

1. Check Vercel function logs
2. Verify `OPENAI_API_KEY` is valid
3. Check rate limiting isn't blocking legitimate requests
4. Verify request format matches API expectations

## Rollback Plan

If deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Investigate issues in staging/preview environment

## Success Criteria

✅ Application is live and accessible  
✅ All features work correctly  
✅ Security headers are present  
✅ No critical errors in logs  
✅ Performance is acceptable  
✅ Monitoring is set up  

---

**Ready to deploy!** Follow this checklist step by step for a smooth production launch.
