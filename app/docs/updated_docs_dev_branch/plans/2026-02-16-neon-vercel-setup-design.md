# Neon & Vercel Infrastructure Setup + Auth Migration

**Date:** 2026-02-16
**Author:** Claude Code
**Status:** Approved

## Overview

Complete infrastructure audit and setup for PriceOS, including:
- Vercel deployment configuration (personal account)
- Neon database integration with branch mapping
- Migration from Supabase Auth to Neon Auth
- Environment variable management
- Documentation updates

## Goals

1. Clean up duplicate Vercel project configurations
2. Set up automated Vercel-Neon integration
3. Migrate authentication from Supabase to Neon Auth
4. Establish proper dual-environment deployment (production + preview)
5. Update documentation to reflect new setup

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     GitHub Repository                    │
│  ┌────────────┐              ┌────────────┐            │
│  │ main branch│──────────────│ dev branch │            │
│  └────────────┘              └────────────┘            │
└──────┬─────────────────────────────┬───────────────────┘
       │                              │
       │ (git push triggers)          │
       ▼                              ▼
┌─────────────────┐           ┌──────────────────┐
│ Vercel Project  │           │ Vercel Project   │
│  (Production)   │           │  (Preview)       │
└────────┬────────┘           └────────┬─────────┘
         │                             │
         │ (via Integration)           │
         ▼                             ▼
┌─────────────────┐           ┌──────────────────┐
│  Neon Database  │           │  Neon Database   │
│  main branch    │           │  dev branch      │
└─────────────────┘           └──────────────────┘
```

### Key Components

- **Vercel Project**: Single project under personal account `harshitlyzr`
- **Root Directory**: `/priceos/` (Vercel auto-detects `app/` as Next.js root)
- **Neon Integration**: Official Vercel marketplace integration
- **Branch Mapping**:
  - Production (`main` git branch) → Neon `main` branch
  - Preview (`dev` git branch) → Neon `dev` branch
- **Authentication**: Neon Auth (replacing Supabase)

## Current State Analysis

### Issues Found

1. **Duplicate Vercel Projects**:
   - Two `.vercel/` directories (root and `app/`)
   - Both linked to team account `team_rM087suW9dqH0Rr55VIKlAj5`
   - CLI shows different account `harshitlyzr`

2. **Extra Neon Branch**:
   - `vercel-dev` branch exists (created 2026-02-16)
   - Not documented in `docs/environments.md`
   - Should be deleted (integration will auto-create preview branches if needed)

3. **Auth Provider**:
   - Currently using Supabase for authentication
   - Want to consolidate with Neon Auth

### What's Working

- ✅ Vercel CLI installed (v50.1.6)
- ✅ Neon CLI installed (neonctl)
- ✅ Neon project exists: `summer-cake-85946943`
- ✅ Two main branches healthy: `main`, `dev`
- ✅ Drizzle ORM properly configured
- ✅ Documentation exists: `docs/environments.md`

## Design

### Phase 1: Cleanup

**Actions:**

1. **Remove Vercel Project Links**:
   ```bash
   rm -rf /priceos/.vercel/
   rm -rf /priceos/app/.vercel/
   ```

2. **Delete Extra Neon Branch**:
   ```bash
   neonctl branches delete vercel-dev \
     --project-id summer-cake-85946943 \
     --org-id org-orange-flower-61544110
   ```

3. **Backup Current Config**:
   ```bash
   cp app/.env.local app/.env.local.backup
   ```

4. **Git Cleanup**:
   - Verify `.vercel/` is in `.gitignore`
   - Confirm git status is clean

**Safety Checks:**
- ✅ Backup `.env.local` before cleanup
- ✅ Verify git status clean (no uncommitted work)
- ✅ Confirm Neon `main` and `dev` branches healthy

### Phase 2: Vercel Project Setup

**Initialize Project:**

```bash
cd /priceos/  # Root directory, not app/
vercel
```

**Configuration:**
- Project name: `priceos`
- Framework: Next.js (auto-detected)
- Root directory: `app/` (auto-detected)
- Build command: `npm run build` (default)
- Output directory: `.next` (default)
- Install command: `npm install` (default)

**Branch Configuration:**
- Production branch: `main` (auto-deploy enabled)
- Preview branch: `dev` (auto-deploy enabled)
- Matches existing `vercel.json` configuration

**Build Settings:**
- Node.js version: Latest LTS (auto-selected)
- Environment: Production uses `main`, Preview uses `dev`

**Result:**
- New `.vercel/` directory in root
- Project linked to `harshitlyzr` account
- Ready for Neon integration

### Phase 3: Neon Integration

**Install Integration:**

1. Navigate to Vercel Dashboard → Settings → Integrations
2. Search for "Neon" in marketplace
3. Click "Add Integration"
4. Authenticate with Neon (org: `org-orange-flower-61544110`)
5. Select project: `summer-cake-85946943`

**Configure Branch Mapping:**

```
Production Environment (main branch):
└─> Neon branch: main

Preview Environment (dev branch):
└─> Neon branch: dev

Pull Request Previews:
└─> Auto-create temporary Neon branches (optional)
```

**What Integration Provides:**
- ✅ Auto-configured `DATABASE_URL` per environment
- ✅ Connection pooling (`?pooled=true` suffix)
- ✅ SSL mode (`?sslmode=require`)
- ✅ Auto-rotation if Neon changes credentials
- ✅ Monitoring and connection insights

### Phase 4: Neon Auth Migration

**Environment Variables:**

| Variable | Value | Scope | Source |
|----------|-------|-------|--------|
| `DATABASE_URL` | Auto-set | All | Neon Integration |
| `NEON_AUTH_BASE_URL` | `https://auth.neon.tech` | All | Manual |
| `NEON_AUTH_COOKIE_SECRET` | Generated (32+ chars) | All | Manual (unique per env) |
| `HOSTAWAY_MODE` | `db` | All | Manual |

**Generate Cookie Secret:**
```bash
# For production
openssl rand -base64 32

# For preview (generate separately)
openssl rand -base64 32

# For development (.env.local)
openssl rand -base64 32
```

**Installation:**

```bash
cd app
npm install @neondatabase/auth
npm uninstall @supabase/supabase-js
```

**Auth Infrastructure Files:**

1. **Server Auth Instance** (`app/src/lib/auth/server.ts`):
   - Create unified auth instance
   - API route handling
   - Middleware functionality
   - Session management

2. **Client Auth Instance** (`app/src/lib/auth/client.ts`):
   - Browser operations
   - Client-side hooks
   - Used by UI provider

3. **API Routes** (`app/src/app/api/auth/[...path]/route.ts`):
   - Proxy all auth requests
   - Single handler for sign-in, sign-up, sign-out

4. **Auth Pages** (`app/src/app/auth/[path]/page.tsx`):
   - Sign-in page
   - Sign-up page
   - Sign-out confirmation

5. **Account Pages** (`app/src/app/account/[path]/page.tsx`):
   - User settings
   - Security management
   - Profile updates

6. **Middleware** (`middleware.ts`):
   - Route protection
   - Redirect unauthenticated users to `/auth/sign-in`
   - Protect dashboard routes

7. **UI Provider Wrapper**:
   - Wrap root layout with `NeonAuthUIProvider`
   - Provides hooks and auth methods

**Code Updates Required:**

1. Remove Supabase client initialization
2. Replace Supabase session hooks with `authClient.useSession()`
3. Update auth checks in protected routes (use `auth.getSession()`)
4. Update UI components using auth state
5. Add `suppressHydrationWarning` to root `<html>` tag
6. Import Neon Auth UI styles in `globals.css`:
   ```css
   @import "@neondatabase/auth/ui/tailwind";
   ```

### Phase 5: Environment Configuration

**Set in Vercel Dashboard** (Settings → Environment Variables):

1. `NEON_AUTH_BASE_URL`:
   - Value: `https://auth.neon.tech`
   - Environments: Production, Preview, Development

2. `NEON_AUTH_COOKIE_SECRET` (Production):
   - Value: [Generated secret]
   - Environments: Production only

3. `NEON_AUTH_COOKIE_SECRET` (Preview):
   - Value: [Different generated secret]
   - Environments: Preview only

4. `HOSTAWAY_MODE`:
   - Value: `db`
   - Environments: Production, Preview, Development

**Local Development** (`.env.local`):
```bash
DATABASE_URL=postgresql://...  # Points to Neon dev branch
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=[local-generated-secret]
HOSTAWAY_MODE=db
```

### Phase 6: Verification & Testing

**Infrastructure Checks:**

```bash
# Verify Vercel project
vercel project ls  # Should show: priceos under harshitlyzr

# Check environment variables
vercel env ls

# Verify Neon branches
neonctl branches list --project-id summer-cake-85946943
# Should show: main, dev (vercel-dev deleted)
```

**Local Auth Test:**

```bash
cd app
npm run build  # Should compile without errors
npm run dev

# Visit: http://localhost:3000/auth/sign-in
# Should see Neon Auth UI (not Supabase)
```

**Auth Flow Test (local):**
1. Sign up with test email
2. Verify email confirmation
3. Sign in successfully
4. Access protected dashboard route
5. Sign out → verify redirect to `/auth/sign-in`

**Deployment Test:**

```bash
# Preview deployment (dev branch)
git checkout dev
git add .
git commit -m "feat: migrate to Neon Auth and Vercel integration"
git push origin dev

# Monitor deployment in Vercel Dashboard
# Check build logs for errors
# Test deployed preview URL
```

**Health Checks:**
- ✅ Build logs: No `DATABASE_URL` errors
- ✅ Runtime logs: No auth initialization errors
- ✅ Database connection: Successful queries
- ✅ Auth UI renders correctly
- ✅ Sign-up/sign-in/sign-out flows work
- ✅ Protected routes redirect properly

**Production Deployment** (after preview success):

```bash
git checkout main
git merge dev
git push origin main
```

### Phase 7: Documentation Updates

**Update `docs/environments.md`:**
- Change Vercel account reference to personal account
- Remove `vercel-dev` branch documentation
- Add Neon Auth environment variables section
- Update environment variable table

**Update `CLAUDE.md`:**

1. **Environment Setup Section**:
   - Remove Supabase variables
   - Add Neon Auth variables:
     ```bash
     NEON_AUTH_BASE_URL=https://auth.neon.tech
     NEON_AUTH_COOKIE_SECRET=<generated-secret>
     ```

2. **Tech Stack Table**:
   - Change "Supabase (shared project)" → "Neon Auth"
   - Update deployment row to mention Vercel-Neon integration

3. **Database Schema**:
   - Verify if Neon Auth adds tables
   - Update count if needed

4. **First-time Setup**:
   - Add Neon Auth setup steps
   - Include cookie secret generation

**Update `app/.env.example`:**
```bash
# Neon Postgres (auto-configured by Vercel-Neon integration in deployed environments)
DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require

# Neon Auth (get NEON_AUTH_BASE_URL from Neon Console)
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=<generate-via-openssl-rand-base64-32>

# PMS mode: db (Neon), mock (in-memory), live (Hostaway API)
HOSTAWAY_MODE=db
```

**Update `README.md`:**
- Tech Stack section: Replace Supabase with Neon Auth
- Getting Started: Add Neon Auth setup instructions
- Add "Authentication" section explaining the auth flow

**Create `docs/neon-auth-setup.md`:**
- How to obtain `NEON_AUTH_BASE_URL` from Neon Console
- How to generate `NEON_AUTH_COOKIE_SECRET`
- Setting up auth in local development
- Troubleshooting common auth issues
- Links to Neon Auth documentation

**Commit Strategy:**
```bash
# Separate commits for clarity
git add docs/
git commit -m "docs: update for Neon Auth migration"

git add app/.env.example
git commit -m "chore: update env example for Neon Auth"
```

## Success Criteria

### Infrastructure
- ✅ Single Vercel project under personal account
- ✅ Vercel-Neon integration active and connected
- ✅ Only two Neon branches: `main` and `dev`
- ✅ All environment variables properly configured
- ✅ Auto-deployment working for both branches

### Authentication
- ✅ No Supabase code remaining in codebase
- ✅ Neon Auth fully functional (sign-up, sign-in, sign-out)
- ✅ Protected routes properly secured
- ✅ Auth UI renders without errors
- ✅ Session management working correctly

### Deployment
- ✅ Preview deployment (dev) succeeds
- ✅ Production deployment (main) succeeds
- ✅ No build errors
- ✅ No runtime errors in logs
- ✅ Database connections successful

### Documentation
- ✅ All docs updated to reflect new setup
- ✅ Environment variable documentation accurate
- ✅ Setup guide complete and tested
- ✅ No references to old Supabase setup

## Rollback Plan

If issues arise during migration:

1. **Revert Vercel Project**:
   - Delete new project from dashboard
   - Restore `.vercel/` from backup

2. **Restore Neon Branch**:
   - `vercel-dev` branch can be recreated if needed

3. **Revert Auth Changes**:
   - Git revert auth migration commits
   - Reinstall `@supabase/supabase-js`
   - Restore Supabase environment variables

4. **Database**:
   - No database schema changes in this migration
   - Data remains intact

## Timeline Estimate

- **Phase 1 (Cleanup)**: 5 minutes
- **Phase 2 (Vercel Setup)**: 10 minutes
- **Phase 3 (Neon Integration)**: 5 minutes
- **Phase 4 (Auth Migration)**: 45-60 minutes
- **Phase 5 (Environment Config)**: 10 minutes
- **Phase 6 (Verification)**: 20 minutes
- **Phase 7 (Documentation)**: 30 minutes

**Total**: ~2-2.5 hours

## Notes

- Keep `.env.local.backup` until production deployment succeeds
- Test auth flow thoroughly in preview before merging to main
- Monitor Vercel logs for first 24 hours after production deployment
- Document any issues encountered for future reference
