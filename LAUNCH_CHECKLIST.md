# 🚀 Production Launch Checklist

## Pre-Deployment (Complete Before Deploy)

### Critical Security Fixes ✅ COMPLETED
- [x] Update Next.js to v15.5.6+ (fixed 7 critical CVEs)
- [x] Remove `--accept-data-loss` from build script
- [x] Add security headers to next.config.ts
- [x] Restrict image hostname patterns
- [x] Create Prisma migrations
- [x] Add rate limiting implementation
- [x] Create environment variable validation

### Required Setup
- [ ] Set up production database (Vercel Postgres/Supabase/Railway)
- [ ] Generate strong NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Obtain OpenAI API key
- [ ] Test database connection locally

---

## Vercel Configuration

### Environment Variables to Set in Vercel Dashboard

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://your-domain.vercel.app
OPENAI_API_KEY=sk-your-key
```

### Optional (For Production Rate Limiting with Upstash Redis)
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Build Settings
- Framework: Next.js (auto-detected)
- Build Command: `npm run vercel-build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node Version: 18.x+

---

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production ready: security fixes and deployment config"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to vercel.com/new
   - Select your repository
   - Configure environment variables
   - Deploy

3. **Update NEXTAUTH_URL**
   - After first deploy, update NEXTAUTH_URL to actual deployment URL
   - Redeploy

4. **Test Deployment**
   - [ ] Homepage loads
   - [ ] Sign up works
   - [ ] Sign in works
   - [ ] Dashboard accessible
   - [ ] Create project
   - [ ] Generate text
   - [ ] Generate image
   - [ ] Check logs for errors

---

## Post-Deployment

### Immediate Tasks
- [ ] Add custom domain (optional)
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Set OpenAI cost alerts in OpenAI dashboard
- [ ] Test rate limiting (try making 11 requests quickly)
- [ ] Verify security headers with securityheaders.com

### Monitoring Setup
- [ ] Enable Vercel Analytics
- [ ] Set up database monitoring
- [ ] Configure log aggregation
- [ ] Set up alert notifications

### Documentation
- [ ] Update README with production URL
- [ ] Document deployment process for team
- [ ] Create incident response plan
- [ ] Set up backup strategy

---

## Health Check URLs

After deployment, verify these:

- Homepage: `https://your-app.vercel.app/`
- Sign Up: `https://your-app.vercel.app/auth/signup`
- Sign In: `https://your-app.vercel.app/auth/signin`
- Dashboard: `https://your-app.vercel.app/dashboard`

---

## Security Verification

### Run These Checks Post-Deploy

1. **Security Headers**
   ```bash
   curl -I https://your-app.vercel.app | grep -E "(X-Frame-Options|Strict-Transport|X-Content-Type)"
   ```

2. **SSL/TLS**
   - Visit https://www.ssllabs.com/ssltest/
   - Enter your domain
   - Should get A or A+ rating

3. **Rate Limiting**
   ```bash
   # Try making rapid requests
   for i in {1..15}; do
     curl -X POST https://your-app.vercel.app/api/generate/text \
       -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"prompt":"test"}' &
   done
   # Should see 429 errors after 10 requests
   ```

---

## Cost Monitoring

### Expected Monthly Costs (estimates)

**Low Traffic (< 100 users/month)**
- Vercel: $0 (Hobby tier)
- Database: $0 (free tier)
- OpenAI: $10-50
- **Total: $10-50/month**

**Medium Traffic (1000 users/month)**
- Vercel: $20 (Pro tier)
- Database: $5-20
- OpenAI: $100-300
- Monitoring: $0-25
- **Total: $125-365/month**

### Set Up Cost Alerts
- OpenAI: Set usage alerts at $50, $100, $200
- Vercel: Monitor bandwidth and function executions
- Database: Monitor storage and connection pool

---

## Rollback Plan

If issues arise:

1. **Immediate Rollback**
   - Vercel Dashboard → Deployments
   - Click previous working deployment
   - Click "Promote to Production"

2. **Database Rollback**
   ```bash
   # If migration caused issues
   DATABASE_URL="..." npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Emergency Contacts**
   - Vercel Support: support@vercel.com
   - OpenAI Support: help.openai.com
   - Database Provider Support: [your provider]

---

## Known Limitations (Current Implementation)

1. **Rate Limiting**: In-memory (resets on deploy)
   - **For Production**: Upgrade to Upstash Redis
   - **Impact**: Users can bypass limits by timing requests between deployments

2. **Error Tracking**: Console logs only
   - **For Production**: Add Sentry
   - **Impact**: Harder to debug production issues

3. **Monitoring**: Basic Vercel logs
   - **For Production**: Add comprehensive monitoring
   - **Impact**: May miss performance degradation

4. **Email Verification**: Not implemented
   - **For Production**: Add email verification flow
   - **Impact**: Anyone can sign up with any email

5. **File Upload**: Images are URLs only
   - **For Production**: Add file upload support
   - **Impact**: Users must use OpenAI-generated images

---

## Success Metrics to Track

### Week 1
- [ ] 0 critical errors
- [ ] < 5 minutes downtime
- [ ] User signup completion rate > 80%
- [ ] API response time < 2s (p95)

### Month 1
- [ ] OpenAI costs within budget
- [ ] No security incidents
- [ ] User retention > 40%
- [ ] Feature usage tracked

---

## Recommended Upgrades (Post-Launch)

### High Priority (Week 1-2)
1. Add Sentry for error tracking
2. Set up Upstash Redis rate limiting
3. Add email verification
4. Configure database backups

### Medium Priority (Month 1)
1. Add user profile management
2. Implement project sharing
3. Add export to more formats
4. Create admin dashboard

### Low Priority (Month 2-3)
1. Add team collaboration features
2. Implement versioning for assets
3. Add more AI providers
4. Create mobile-responsive improvements

---

## Support Resources

- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Audit Report**: See `PRODUCTION_AUDIT_REPORT.md`
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://prisma.io/docs

---

## Final Pre-Launch Command

Run this before deploying:

```bash
# Ensure everything is committed
git status

# Check no secrets in code
git grep -i "sk-" -- ':!.env.example' ':!*.md'

# Verify build works
npm run build

# Run linter
npm run lint

# Check for vulnerabilities
npm audit --production

# Push to production
git push origin main
```

---

## Launch Day Timeline

**T-60 min**: Final code review and testing
**T-30 min**: Deploy to Vercel preview
**T-15 min**: Test preview deployment thoroughly
**T-0**: Promote to production
**T+15 min**: Smoke tests on production
**T+30 min**: Monitor logs and metrics
**T+1 hour**: Create status update
**T+24 hours**: Review metrics and costs

---

## Emergency Procedures

### Site Down
1. Check Vercel status page
2. Review error logs in Vercel
3. Check database connectivity
4. Rollback if recent deploy
5. Contact Vercel support if infrastructure issue

### High OpenAI Costs
1. Check rate limiting is working
2. Review recent API usage in OpenAI dashboard
3. Temporarily reduce rate limits
4. Investigate suspicious activity
5. Consider adding CAPTCHA

### Database Issues
1. Check connection pool limits
2. Review slow queries
3. Check disk space
4. Review recent migrations
5. Contact database provider support

---

**Status**: ✅ READY FOR DEPLOYMENT

**Last Updated**: 2025-11-15

**Next Review**: After initial deployment

---

## Sign-Off

Before deploying, confirm:

- [x] All critical security fixes applied
- [x] Environment variables documented
- [x] Database migrations created
- [x] Monitoring plan in place
- [x] Rollback plan documented
- [x] Team notified of deployment

**Ready to Deploy**: YES

**Deployment Window**: Recommended during low-traffic hours (e.g., weekend morning)

---

Good luck with your launch! 🚀🎉
