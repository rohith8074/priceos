# PriceOS Deployment Checklist

**Version:** 1.0.0 (Phase 5 Complete)
**Date:** 2026-02-17

---

## Pre-Deployment Verification

### ✅ Code Quality
- [x] All TypeScript compilation errors resolved
- [x] ESLint passes with no warnings
- [x] Production build succeeds (`npm run build`)
- [x] All imports use absolute paths (`@/` prefix)
- [x] No console.log statements in production code

### ✅ Testing
- [x] End-to-end tests passing (5/5 tests)
- [x] Property chat generates proposals correctly
- [x] Proposal approval and execution works
- [x] Global chat responds accurately
- [x] Error handling validated

### ✅ Database
- [x] Schema migrations applied (`npm run db:push`)
- [x] Seed data loaded (5 Dubai properties)
- [x] All 7 tables created (listings, calendar_days, reservations, proposals, chat_messages, user_settings, event_signals)
- [x] Indexes created for performance
- [x] Foreign key constraints validated

---

## Environment Configuration

### Development (.env.local)
```bash
# Database
DATABASE_URL=postgresql://...  # Neon dev branch

# Authentication
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=<generated-secret>

# PMS Mode
HOSTAWAY_MODE=db  # db | mock | live
```

### Production (Vercel Environment Variables)
```bash
# Database (auto-configured via Vercel-Neon integration)
DATABASE_URL=postgresql://...  # Neon production branch

# Authentication
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=<production-secret>

# HostAway (when ready for live integration)
HOSTAWAY_MODE=live
HOSTAWAY_API_KEY=<client-api-key>

# Optional: Lyzr API
LYZR_API_KEY=<api-key>
```

**Security Notes:**
- ✅ Never commit `.env.local` or `.env.production` to git
- ✅ Use Vercel dashboard to set production environment variables
- ✅ Generate new `NEON_AUTH_COOKIE_SECRET` for production: `openssl rand -base64 32`

---

## Vercel Deployment Steps

### 1. Connect Repository
```bash
# Ensure latest changes are pushed to GitHub
git add .
git commit -m "feat: complete Phase 5 - testing and polish"
git push origin main
```

### 2. Configure Vercel Project
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import GitHub repository: `lyzr-agentpreneur/priceos`
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `app/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 3. Set Environment Variables
In Vercel project settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production |
| `NEON_AUTH_BASE_URL` | `https://auth.neon.tech` | All |
| `NEON_AUTH_COOKIE_SECRET` | `<generated-secret>` | Production |
| `HOSTAWAY_MODE` | `db` | Production |

**Note:** `DATABASE_URL` will be auto-configured if using Vercel-Neon integration.

### 4. Configure Build Settings
- **Node Version:** 18.x or higher
- **Package Manager:** npm
- **Install Command:** `npm install --legacy-peer-deps` (if needed)

### 5. Deploy
```bash
# Option A: Deploy via Vercel CLI
cd app
npx vercel --prod

# Option B: Deploy via Git Push
git push origin main  # Auto-deploys if connected to Vercel
```

### 6. Post-Deployment Verification
1. Visit deployment URL
2. Test authentication (sign in)
3. Navigate to `/properties`
4. Test property chat
5. Approve a proposal
6. Test global chat

---

## Database Migration (Production)

### First Deployment
```bash
# Migrations will run automatically on first build
# Vercel will execute: npm run build
# Which includes: drizzle-kit push (if configured)
```

### Manual Migration (if needed)
```bash
# From local machine with production DATABASE_URL
DATABASE_URL=<production-url> npm run db:push

# Then seed initial data
DATABASE_URL=<production-url> npm run db:seed
```

**⚠️ Warning:** Only run `db:seed` once on production to avoid duplicate data.

---

## Monitoring & Observability

### Vercel Analytics (Built-in)
- [x] Enabled by default
- Tracks page views, performance, Web Vitals

### Error Tracking (Optional - Sentry)
```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Configure in next.config.js and sentry.client.config.ts
```

### Logging
- [x] Server errors logged to Vercel function logs
- [x] Client errors visible in browser console (development)
- [ ] TODO: Add structured logging (Pino, Winston)

---

## Performance Optimization

### ✅ Enabled
- [x] Next.js Image Optimization
- [x] Static page generation where possible
- [x] Turbopack for faster builds
- [x] React Server Components
- [x] Database connection pooling (Neon serverless)

### 🔜 Future Optimizations
- [ ] Add Redis caching for proposal data
- [ ] Implement edge middleware for auth
- [ ] Enable Incremental Static Regeneration (ISR)
- [ ] Add CDN caching headers

---

## Security Checklist

### ✅ Current Security Measures
- [x] Environment variables not committed to git
- [x] Neon Auth for user authentication
- [x] Database credentials secured
- [x] HTTPS enforced (Vercel default)
- [x] CORS headers configured
- [x] SQL injection protection (Drizzle ORM)

### 🔜 Additional Security (Phase 6)
- [ ] Add rate limiting middleware
- [ ] Implement CSRF protection
- [ ] Add API key rotation
- [ ] Enable audit logging
- [ ] Add permission-based access control

---

## Rollback Plan

### If Deployment Fails
1. **Revert to previous deployment:**
   ```bash
   # Via Vercel Dashboard
   # Go to Deployments → Select previous working deployment → Promote to Production
   ```

2. **Or redeploy previous Git commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

### If Database Migration Fails
1. **Check Vercel function logs** for error details
2. **Connect to production database** and verify schema:
   ```bash
   psql $DATABASE_URL -c "\dt"  # List tables
   ```
3. **Manually fix schema** if needed:
   ```bash
   DATABASE_URL=<production-url> npm run db:push
   ```

---

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Test property chat generates proposals
- [ ] Test proposal approval executes correctly
- [ ] Monitor Vercel logs for errors
- [ ] Check database connection pool status

### Week 1
- [ ] Conduct UAT session with founder (Ijas)
- [ ] Gather user feedback
- [ ] Monitor error rates
- [ ] Review performance metrics
- [ ] Optimize slow queries (if any)

### Week 2
- [ ] Plan HostAway API integration (Phase 6)
- [ ] Add user-specific API key management
- [ ] Implement real authentication (remove placeholder userId)
- [ ] Add monitoring dashboards

---

## Domain Configuration (Optional)

### Custom Domain Setup
1. **Add domain in Vercel:**
   - Go to Project Settings → Domains
   - Add custom domain (e.g., `app.priceos.ai`)

2. **Configure DNS:**
   - Add `CNAME` record pointing to Vercel:
     ```
     CNAME   app     cname.vercel-dns.com
     ```

3. **SSL Certificate:**
   - Vercel auto-generates SSL certificate
   - Wait 24-48 hours for propagation

---

## Success Criteria

### ✅ Deployment Successful If:
1. Production URL loads without errors
2. Users can sign in via Neon Auth
3. Properties list displays with metrics
4. Property chat generates proposals
5. Proposal approval executes in <5s
6. Global chat responds accurately
7. No critical errors in Vercel logs
8. Build time <60s
9. Page load time <2s

---

## Support & Maintenance

### Monitoring Dashboards
- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **Neon Console:** [console.neon.tech](https://console.neon.tech)
- **GitHub Repo:** [github.com/lyzr-agentpreneur/priceos](https://github.com/lyzr-agentpreneur/priceos)

### Emergency Contacts
- **Platform Owner:** Ijas Abdulla
- **Technical Support:** [Your contact info]
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Neon Support:** [neon.tech/docs/introduction/support](https://neon.tech/docs/introduction/support)

---

## Changelog

### v1.0.0 (2026-02-17) - Phase 5 Complete
- ✅ Architectural redesign (13 tables → 7 tables)
- ✅ Agent system (Data Sync, Event Intelligence, Pricing Analyst, Channel Sync)
- ✅ Chat-based interface (property + global)
- ✅ Proposal generation and execution
- ✅ DB-only mode for development
- ✅ 100% test pass rate (5/5 tests)

---

**Last Updated:** 2026-02-17
**Status:** ✅ Ready for Deployment
**Next Phase:** Phase 6 - HostAway API Integration
