# Neon & Vercel Setup + Auth Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up production-ready Vercel deployment with Neon database integration and migrate from Supabase Auth to Neon Auth.

**Architecture:** Clean slate Vercel project setup under personal account with automated Neon integration for database connectivity. Dual-environment deployment (production on `main`, preview on `dev`) with branch-specific database connections. Complete auth migration from Supabase to Neon Auth SDK.

**Tech Stack:** Vercel CLI, Neon CLI, @neondatabase/auth, Next.js 16, Drizzle ORM

---

## Task 1: Cleanup Existing Configuration

**Files:**
- Delete: `.vercel/` (root directory)
- Delete: `app/.vercel/`
- Create: `app/.env.local.backup`

**Step 1: Backup current environment file**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app
cp .env.local .env.local.backup
```

Expected: Backup file created

**Step 2: Verify git status is clean**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos
git status
```

Expected: No uncommitted changes (or only tracked changes you're aware of)

**Step 3: Remove Vercel project directories**

```bash
rm -rf /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/.vercel
rm -rf /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app/.vercel
```

Expected: Directories removed

**Step 4: Verify .vercel is in .gitignore**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos
grep -q "^\.vercel" .gitignore && echo "Found" || echo "Not found"
```

Expected: "Found" (if not, add it)

**Step 5: Add .vercel to .gitignore if missing**

If previous step showed "Not found":

```bash
echo ".vercel" >> .gitignore
git add .gitignore
git commit -m "chore: ensure .vercel is ignored"
```

**Step 6: Delete extra Neon branch**

```bash
neonctl branches delete vercel-dev \
  --project-id summer-cake-85946943 \
  --org-id org-orange-flower-61544110 \
  --confirm
```

Expected: "Branch vercel-dev deleted successfully"

**Step 7: Verify only main and dev branches remain**

```bash
neonctl branches list \
  --project-id summer-cake-85946943 \
  --org-id org-orange-flower-61544110
```

Expected: Only `main` and `dev` branches listed

**Step 8: Commit cleanup if .gitignore changed**

Only if Step 5 was executed:

```bash
git status
```

If .gitignore was modified, it's already committed in Step 5. Otherwise, no commit needed.

---

## Task 2: Create New Vercel Project

**Files:**
- Create: `.vercel/project.json` (auto-generated)
- Create: `.vercel/README.txt` (auto-generated)

**Step 1: Navigate to project root**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos
```

**Step 2: Initialize Vercel project**

```bash
vercel
```

Interactive prompts - respond:
- Set up and deploy? **Y**
- Which scope? **harshitlyzr** (personal account)
- Link to existing project? **N**
- What's your project's name? **priceos**
- In which directory is your code located? **app/**
- Want to modify settings? **N**

Expected: "Deployed to production" with URL

**Step 3: Verify project creation**

```bash
vercel project ls | grep priceos
```

Expected: Shows `priceos` project under harshitlyzr

**Step 4: Check .vercel directory created**

```bash
ls -la .vercel/
```

Expected: `project.json` and `README.txt` exist

**Step 5: Configure production branch**

```bash
vercel git connect
```

Follow prompts to connect to GitHub repository

**Step 6: Verify vercel.json configuration**

```bash
cat vercel.json
```

Expected: Shows main and dev deployment enabled

---

## Task 3: Install Neon Integration

**Files:**
- None (configuration in Vercel dashboard)

**Step 1: Open Vercel dashboard**

Navigate to: https://vercel.com/harshitlyzr/priceos

**Step 2: Access integrations**

Dashboard → Settings → Integrations

**Step 3: Add Neon integration**

- Search for "Neon"
- Click "Add Integration"
- Click "Add" on Neon Postgres card

**Step 4: Authenticate with Neon**

- Log in to Neon account
- Select organization: **org-orange-flower-61544110** (Harshit)

**Step 5: Configure integration**

- Select Neon project: **summer-cake-85946943**
- Select Vercel project: **priceos**
- Click "Connect"

**Step 6: Configure branch mappings**

In integration settings:
- Production (main branch) → Neon branch: **main**
- Preview (dev branch) → Neon branch: **dev**
- Auto-create preview branches for PRs: **Disabled** (we'll use manual branches only)

**Step 7: Verify integration status**

Dashboard → Integrations → Neon
Expected: Status shows "Connected" with green indicator

**Step 8: Check environment variables auto-created**

Dashboard → Settings → Environment Variables
Expected: `DATABASE_URL` variable exists for Production and Preview

---

## Task 4: Install Neon Auth Package

**Files:**
- Modify: `app/package.json`
- Modify: `app/package-lock.json`

**Step 1: Navigate to app directory**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app
```

**Step 2: Install Neon Auth SDK**

```bash
npm install @neondatabase/auth
```

Expected: Package installed successfully

**Step 3: Uninstall Supabase packages**

```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

Expected: Packages removed

**Step 4: Verify package.json**

```bash
grep "@neondatabase/auth" package.json
```

Expected: Shows auth package in dependencies

**Step 5: Verify Supabase removed**

```bash
grep "@supabase" package.json || echo "Supabase removed"
```

Expected: "Supabase removed"

**Step 6: Commit package changes**

```bash
git add package.json package-lock.json
git commit -m "feat: install Neon Auth SDK, remove Supabase"
```

---

## Task 5: Create Server Auth Instance

**Files:**
- Create: `app/src/lib/auth/server.ts`
- Create: `app/src/lib/auth/index.ts`

**Step 1: Create auth directory**

```bash
mkdir -p /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app/src/lib/auth
```

**Step 2: Create server auth instance**

Create `app/src/lib/auth/server.ts`:

```typescript
import { createServerAuth } from '@neondatabase/auth';

export const auth = createServerAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET!,
});
```

**Step 3: Create index export**

Create `app/src/lib/auth/index.ts`:

```typescript
export { auth } from './server';
```

**Step 4: Verify files created**

```bash
ls -la src/lib/auth/
```

Expected: Shows `server.ts` and `index.ts`

**Step 5: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors (may show warnings about missing env vars, that's OK)

**Step 6: Commit**

```bash
git add src/lib/auth/
git commit -m "feat: create server auth instance"
```

---

## Task 6: Create Client Auth Instance

**Files:**
- Create: `app/src/lib/auth/client.ts`
- Modify: `app/src/lib/auth/index.ts`

**Step 1: Create client auth instance**

Create `app/src/lib/auth/client.ts`:

```typescript
'use client';

import { createClientAuth } from '@neondatabase/auth';

export const authClient = createClientAuth({
  baseUrl: process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL || '/api/auth',
});
```

**Step 2: Update index exports**

Modify `app/src/lib/auth/index.ts`:

```typescript
export { auth } from './server';
export { authClient } from './client';
```

**Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/auth/
git commit -m "feat: create client auth instance"
```

---

## Task 7: Create Auth API Routes

**Files:**
- Create: `app/src/app/api/auth/[...path]/route.ts`

**Step 1: Create API route directory**

```bash
mkdir -p /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app/src/app/api/auth/[...path]
```

**Step 2: Create catch-all auth route**

Create `app/src/app/api/auth/[...path]/route.ts`:

```typescript
import { auth } from '@/lib/auth/server';

export const GET = auth.handlers.GET;
export const POST = auth.handlers.POST;
```

**Step 3: Verify route created**

```bash
cat src/app/api/auth/[...path]/route.ts
```

Expected: Shows handler exports

**Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: create auth API routes"
```

---

## Task 8: Create Auth UI Pages

**Files:**
- Create: `app/src/app/auth/[path]/page.tsx`

**Step 1: Create auth pages directory**

```bash
mkdir -p /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app/src/app/auth/[path]
```

**Step 2: Create dynamic auth page**

Create `app/src/app/auth/[path]/page.tsx`:

```typescript
import { NeonAuthUI } from '@neondatabase/auth/ui';

export default function AuthPage({ params }: { params: { path: string } }) {
  return <NeonAuthUI path={params.path} />;
}
```

**Step 3: Verify page created**

```bash
cat src/app/auth/[path]/page.tsx
```

Expected: Shows component export

**Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors (may show UI component type warnings, acceptable for now)

**Step 5: Commit**

```bash
git add src/app/auth/
git commit -m "feat: create auth UI pages"
```

---

## Task 9: Create Account Settings Pages

**Files:**
- Create: `app/src/app/account/[path]/page.tsx`

**Step 1: Create account pages directory**

```bash
mkdir -p /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app/src/app/account/[path]
```

**Step 2: Create dynamic account page**

Create `app/src/app/account/[path]/page.tsx`:

```typescript
import { NeonAccountUI } from '@neondatabase/auth/ui';

export default function AccountPage({ params }: { params: { path: string } }) {
  return <NeonAccountUI path={params.path} />;
}
```

**Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: No critical errors

**Step 4: Commit**

```bash
git add src/app/account/
git commit -m "feat: create account settings pages"
```

---

## Task 10: Update Root Layout with Auth Provider

**Files:**
- Modify: `app/src/app/layout.tsx`

**Step 1: Read current layout**

```bash
cat src/app/layout.tsx | head -30
```

Note the current structure

**Step 2: Import Neon Auth UI Provider and styles**

Add to top of `app/src/app/layout.tsx`:

```typescript
import { NeonAuthUIProvider } from '@neondatabase/auth/ui';
import { authClient } from '@/lib/auth/client';
import '@neondatabase/auth/ui/tailwind';
```

**Step 3: Wrap children with provider**

Modify the return statement to wrap children:

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NeonAuthUIProvider client={authClient}>
          {children}
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
```

**Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap layout with Neon Auth provider"
```

---

## Task 11: Create Authentication Middleware

**Files:**
- Create: `app/middleware.ts` (if doesn't exist)
- Modify: `app/middleware.ts` (if exists)

**Step 1: Check if middleware exists**

```bash
test -f /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app/middleware.ts && echo "exists" || echo "not found"
```

**Step 2: Create or update middleware**

Create `app/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function middleware(request: NextRequest) {
  // Public paths that don't require auth
  const publicPaths = ['/auth', '/api/auth'];
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check authentication
  const session = await auth.getSession();

  if (!session) {
    // Redirect to sign-in
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: No critical errors

**Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat: add authentication middleware"
```

---

## Task 12: Remove Supabase Client Code

**Files:**
- Search and modify all files using Supabase

**Step 1: Find Supabase imports**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app
grep -r "from '@supabase" src/ || echo "No Supabase imports found"
```

**Step 2: Find Supabase usage**

```bash
grep -r "supabase\|createClient" src/ --include="*.ts" --include="*.tsx" || echo "No usage found"
```

**Step 3: List files to update**

Make note of files found in Steps 1-2. Common locations:
- `src/lib/supabase/` (if exists)
- Dashboard components using auth
- API routes checking sessions

**Step 4: Remove Supabase client files**

```bash
rm -rf src/lib/supabase/ 2>/dev/null || echo "Directory doesn't exist"
```

**Step 5: Update components using auth**

For each file found in Step 2, replace Supabase auth calls with Neon Auth:

Before:
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);
const { data: { session } } = await supabase.auth.getSession();
```

After:
```typescript
import { authClient } from '@/lib/auth/client';
const session = authClient.useSession();
```

**Step 6: Verify no Supabase references remain**

```bash
grep -r "@supabase" src/ && echo "Still has Supabase refs" || echo "Clean"
```

Expected: "Clean"

**Step 7: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 8: Commit**

```bash
git add src/
git commit -m "refactor: remove Supabase client code"
```

---

## Task 13: Update Environment Variables

**Files:**
- Modify: `app/.env.local`
- Modify: `app/.env.example`

**Step 1: Generate cookie secrets**

```bash
# Production secret
openssl rand -base64 32

# Preview secret
openssl rand -base64 32

# Development secret
openssl rand -base64 32
```

Save these values for next steps

**Step 2: Update .env.local**

Edit `app/.env.local`:

```bash
# Neon Postgres (auto-set by Vercel integration in deployed environments)
DATABASE_URL=postgresql://[your-existing-connection]

# Neon Auth
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=[paste-development-secret-from-step-1]

# PMS Mode
HOSTAWAY_MODE=db
```

Remove these lines if present:
```bash
# DELETE THESE:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Step 3: Update .env.example**

Edit `app/.env.example`:

```bash
# Neon Postgres (auto-configured by Vercel-Neon integration in deployed environments)
DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require

# Neon Auth (get from Neon Console)
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=<generate-via-openssl-rand-base64-32>

# PMS mode: db (Neon), mock (in-memory), live (Hostaway API)
HOSTAWAY_MODE=db
```

**Step 4: Set Vercel environment variables (Production)**

```bash
vercel env add NEON_AUTH_BASE_URL production
# Enter: https://auth.neon.tech

vercel env add NEON_AUTH_COOKIE_SECRET production
# Paste production secret from Step 1

vercel env add HOSTAWAY_MODE production
# Enter: db
```

**Step 5: Set Vercel environment variables (Preview)**

```bash
vercel env add NEON_AUTH_BASE_URL preview
# Enter: https://auth.neon.tech

vercel env add NEON_AUTH_COOKIE_SECRET preview
# Paste preview secret from Step 1

vercel env add HOSTAWAY_MODE preview
# Enter: db
```

**Step 6: Verify environment variables**

```bash
vercel env ls
```

Expected: Shows all 4 variables (DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET, HOSTAWAY_MODE) for production and preview

**Step 7: Commit env changes**

```bash
git add .env.example
git commit -m "chore: update environment variables for Neon Auth"
```

Note: `.env.local` should already be gitignored

---

## Task 14: Local Build and Test

**Files:**
- None (verification step)

**Step 1: Clean build**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos/app
rm -rf .next
```

**Step 2: Build application**

```bash
npm run build
```

Expected: Build completes successfully without errors

**Step 3: Start development server**

```bash
npm run dev
```

Expected: Server starts on port 3000

**Step 4: Test auth sign-in page**

Open browser: http://localhost:3000/auth/sign-in

Expected: Neon Auth UI renders (not Supabase)

**Step 5: Test auth flow**

1. Click "Sign up"
2. Enter test email
3. Verify email confirmation works
4. Sign in with credentials
5. Check dashboard loads
6. Sign out
7. Verify redirect to /auth/sign-in

**Step 6: Check for errors in console**

Expected: No auth-related errors, no Supabase errors

**Step 7: Stop dev server**

Press Ctrl+C

---

## Task 15: Deploy to Preview Environment

**Files:**
- None (deployment step)

**Step 1: Ensure on dev branch**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos
git checkout dev
```

**Step 2: Merge changes from main**

```bash
git merge main
```

Expected: Fast-forward or clean merge

**Step 3: Push to dev branch**

```bash
git push origin dev
```

Expected: Triggers Vercel preview deployment

**Step 4: Monitor deployment**

```bash
vercel deploy --prod=false
```

Or watch in Vercel dashboard

**Step 5: Check deployment logs**

In Vercel Dashboard → Deployments → Latest preview
Check logs for:
- ✅ Build success
- ✅ No DATABASE_URL errors
- ✅ No auth initialization errors

**Step 6: Test deployed preview**

Visit preview URL (from Vercel dashboard)
Test:
1. /auth/sign-in loads
2. Sign-up flow works
3. Sign-in works
4. Dashboard accessible after auth
5. Sign-out redirects correctly

**Step 7: Verify database connection**

Check Vercel logs for successful database queries
Expected: No connection errors

---

## Task 16: Update Documentation - environments.md

**Files:**
- Modify: `docs/environments.md`

**Step 1: Update account reference**

Change:
```markdown
| Environment | Git Branch | Vercel | Neon Branch | URL |
|-------------|-----------|--------|-------------|-----|
| Production  | main      | Production deploy | main | priceos.vercel.app |
| Development | dev       | Preview deploy    | dev  | priceos-git-dev-*.vercel.app |
```

**Step 2: Remove vercel-dev branch reference**

Delete any mentions of `vercel-dev` branch

**Step 3: Add Neon Auth section**

Add after "Neon Project Details":

```markdown
## Authentication

PriceOS uses Neon Auth for user authentication.

### Environment Variables

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `NEON_AUTH_BASE_URL` | Auth service endpoint | Use `https://auth.neon.tech` |
| `NEON_AUTH_COOKIE_SECRET` | Session cookie secret | Generate: `openssl rand -base64 32` |

**Important:** Use different `NEON_AUTH_COOKIE_SECRET` values for production, preview, and development environments.
```

**Step 4: Update database operations section**

Ensure commands still reference correct project ID and org ID

**Step 5: Commit**

```bash
git add docs/environments.md
git commit -m "docs: update environments.md for Neon Auth"
```

---

## Task 17: Update Documentation - CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update environment setup section**

Replace Supabase variables with:

```markdown
### Environment Setup

Required environment variables in `app/.env.local`:

```bash
# Database (Neon Postgres)
DATABASE_URL=postgresql://...

# Neon Auth
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=<generate-via-openssl-rand-base64-32>

# PMS Mode
HOSTAWAY_MODE=db  # db | mock | live
```

**First-time setup:**
1. Copy `app/.env.example` to `app/.env.local`
2. Set `DATABASE_URL` to your Neon Postgres connection string
3. Generate `NEON_AUTH_COOKIE_SECRET`: `openssl rand -base64 32`
4. Run `npm run db:push` to create schema
5. Run `npm run db:seed` to populate initial data
```

**Step 2: Update Tech Stack table**

Change this line:
```markdown
| Backend | Supabase (shared project) |
```

To:
```markdown
| Authentication | Neon Auth |
```

**Step 3: Update Deployment section**

Add note about environment variables:

```markdown
**Database:**
- Production uses separate Neon branch
- Dev branch for local development
- Environment variables auto-configured via Vercel-Neon integration
- Neon Auth credentials manually configured per environment
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Neon Auth"
```

---

## Task 18: Create Neon Auth Setup Guide

**Files:**
- Create: `docs/neon-auth-setup.md`

**Step 1: Create setup guide**

Create `docs/neon-auth-setup.md`:

```markdown
# Neon Auth Setup Guide

## Overview

PriceOS uses Neon Auth for user authentication. This guide covers setup for local development and deployment.

## Prerequisites

- Neon database project created
- Vercel project configured
- Node.js and npm installed

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEON_AUTH_BASE_URL` | Auth service endpoint | `https://auth.neon.tech` |
| `NEON_AUTH_COOKIE_SECRET` | Session encryption key | Generated 32+ char string |

### Obtaining Values

**NEON_AUTH_BASE_URL:**
- Use `https://auth.neon.tech` for all environments
- This is the standard Neon Auth endpoint

**NEON_AUTH_COOKIE_SECRET:**
Generate unique secrets for each environment:

```bash
# For production
openssl rand -base64 32

# For preview/staging
openssl rand -base64 32

# For local development
openssl rand -base64 32
```

**Important:** Never share secrets between environments.

## Local Development Setup

### Step 1: Install Dependencies

```bash
cd app
npm install
```

### Step 2: Configure Environment

Create `app/.env.local`:

```bash
DATABASE_URL=postgresql://[your-neon-dev-branch-url]
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=[your-generated-secret]
HOSTAWAY_MODE=db
```

### Step 3: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000/auth/sign-in

## Vercel Deployment Setup

### Production Environment

```bash
vercel env add NEON_AUTH_BASE_URL production
# Enter: https://auth.neon.tech

vercel env add NEON_AUTH_COOKIE_SECRET production
# Paste your production secret
```

### Preview Environment

```bash
vercel env add NEON_AUTH_BASE_URL preview
# Enter: https://auth.neon.tech

vercel env add NEON_AUTH_COOKIE_SECRET preview
# Paste your preview secret (different from production!)
```

## Authentication Flow

1. **Sign Up**: Users create account at `/auth/sign-up`
2. **Email Verification**: Neon sends verification email
3. **Sign In**: Users authenticate at `/auth/sign-in`
4. **Session**: JWT stored in secure HTTP-only cookie
5. **Protected Routes**: Middleware checks session, redirects if unauthenticated
6. **Sign Out**: Session cleared, redirect to sign-in

## Troubleshooting

### "Invalid cookie secret" Error

**Cause:** `NEON_AUTH_COOKIE_SECRET` not set or too short

**Solution:** Generate new secret with `openssl rand -base64 32` and set in environment

### Redirect Loop on Sign In

**Cause:** Middleware configuration issue

**Solution:** Check `middleware.ts` public paths include `/auth` and `/api/auth`

### "Cannot find module '@neondatabase/auth'" Error

**Cause:** Package not installed

**Solution:** Run `npm install @neondatabase/auth`

### Session Not Persisting

**Cause:** Cookie secret mismatch between environments

**Solution:** Verify each environment has unique `NEON_AUTH_COOKIE_SECRET`

## API Reference

### Server-Side Session Check

```typescript
import { auth } from '@/lib/auth/server';

const session = await auth.getSession();
if (!session) {
  // User not authenticated
}
```

### Client-Side Hook

```typescript
'use client';
import { authClient } from '@/lib/auth/client';

export function MyComponent() {
  const session = authClient.useSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session.user.email}</div>;
}
```

## Resources

- [Neon Auth Documentation](https://neon.com/docs/auth)
- [Next.js Quick Start](https://neon.com/docs/auth/quick-start/nextjs)
- [API Reference](https://neon.com/docs/auth/api-reference)
```

**Step 2: Commit**

```bash
git add docs/neon-auth-setup.md
git commit -m "docs: add Neon Auth setup guide"
```

---

## Task 19: Update README.md

**Files:**
- Modify: `README.md`

**Step 1: Update Tech Stack section**

Find the "Tech Stack" section and update:

Change:
```markdown
| Backend | Supabase (shared project) |
```

To:
```markdown
| Authentication | Neon Auth |
| Database | Neon Postgres (serverless) |
```

**Step 2: Update Getting Started**

Add Neon Auth setup to getting started section:

```markdown
## Getting Started

```bash
cd app
npm install
```

Configure environment variables in `app/.env.local`:

```bash
DATABASE_URL=postgresql://...  # Neon Postgres connection
NEON_AUTH_BASE_URL=https://auth.neon.tech
NEON_AUTH_COOKIE_SECRET=$(openssl rand -base64 32)
HOSTAWAY_MODE=db
```

Initialize database:

```bash
npm run db:push
npm run db:seed
```

Start development server:

```bash
npm run dev
```

Visit http://localhost:3000/auth/sign-in to access the application.
```

**Step 3: Add Authentication section**

Add new section after "Getting Started":

```markdown
## Authentication

PriceOS uses Neon Auth for secure user authentication:

- **Sign Up/Sign In**: Email-based authentication
- **Session Management**: JWT tokens in HTTP-only cookies
- **Protected Routes**: Automatic redirect for unauthenticated users
- **Account Settings**: User profile and security management

See [Neon Auth Setup Guide](docs/neon-auth-setup.md) for detailed configuration.
```

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README for Neon Auth"
```

---

## Task 20: Production Deployment

**Files:**
- None (deployment step)

**Step 1: Verify preview deployment success**

Check Vercel dashboard for successful preview deployment
Verify all tests passed in Task 15

**Step 2: Switch to main branch**

```bash
cd /Users/harshitchoudhary/Documents/lyzr/initiative/lyzr-agentpreneur/priceos
git checkout main
```

**Step 3: Merge dev branch**

```bash
git merge dev
```

Expected: Fast-forward or clean merge with all commits from dev

**Step 4: Review changes**

```bash
git log --oneline -20
```

Verify all commits related to Neon Auth migration are present

**Step 5: Push to production**

```bash
git push origin main
```

Expected: Triggers Vercel production deployment

**Step 6: Monitor deployment**

Watch Vercel Dashboard → Deployments → Production

Check for:
- ✅ Build success
- ✅ No errors in build logs
- ✅ Deployment status: Ready

**Step 7: Verify production environment**

Visit production URL (from Vercel dashboard)

Test:
1. Home page loads
2. /auth/sign-in accessible
3. Sign-up creates account
4. Email verification works
5. Sign-in successful
6. Dashboard loads after auth
7. Sign-out works

**Step 8: Check production logs**

Vercel Dashboard → Logs

Verify:
- ✅ No DATABASE_URL errors
- ✅ No auth errors
- ✅ Successful database connections
- ✅ No 500 errors

**Step 9: Verify Neon integration health**

Vercel Dashboard → Integrations → Neon
Expected: Status "Connected", both environments active

---

## Task 21: Cleanup and Final Verification

**Files:**
- Delete: `app/.env.local.backup` (after confirming everything works)

**Step 1: Test all critical flows in production**

- User registration
- User login
- Protected route access
- User logout
- Password reset (if implemented)

**Step 2: Check database connectivity**

Production logs should show successful queries to Neon main branch

**Step 3: Verify environment variables**

```bash
vercel env ls
```

Confirm all 4 variables present for both production and preview

**Step 4: Verify branch cleanup**

```bash
neonctl branches list --project-id summer-cake-85946943
```

Expected: Only `main` and `dev` branches

**Step 5: Remove backup file**

Only after confirming production works:

```bash
rm app/.env.local.backup
```

**Step 6: Final commit**

If any final tweaks were made:

```bash
git add .
git commit -m "chore: final cleanup after Neon migration"
git push origin main
```

**Step 7: Update project status**

Mark migration as complete in project tracking (if applicable)

---

## Success Criteria Checklist

### Infrastructure
- [ ] Single Vercel project under personal account
- [ ] Vercel-Neon integration active and connected
- [ ] Only two Neon branches: `main` and `dev`
- [ ] All environment variables properly configured
- [ ] Auto-deployment working for both branches

### Authentication
- [ ] No Supabase code remaining in codebase
- [ ] Neon Auth SDK installed and configured
- [ ] Sign-up flow functional
- [ ] Sign-in flow functional
- [ ] Sign-out flow functional
- [ ] Protected routes properly secured
- [ ] Session management working
- [ ] Auth UI renders without errors

### Deployment
- [ ] Preview deployment (dev) succeeds
- [ ] Production deployment (main) succeeds
- [ ] No build errors
- [ ] No runtime errors in logs
- [ ] Database connections successful in both environments

### Documentation
- [ ] `docs/environments.md` updated
- [ ] `CLAUDE.md` updated
- [ ] `README.md` updated
- [ ] `app/.env.example` updated
- [ ] `docs/neon-auth-setup.md` created
- [ ] No references to Supabase in documentation

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] No Supabase imports remaining
- [ ] Proper error handling for auth failures
- [ ] Clean git history with descriptive commits

---

## Rollback Plan

If critical issues arise:

1. **Revert Git Commits:**
   ```bash
   git log --oneline  # Find commit before migration
   git revert <commit-hash>
   git push origin main
   ```

2. **Restore Supabase:**
   ```bash
   npm install @supabase/supabase-js
   # Restore Supabase client code from git history
   # Re-add Supabase env vars to Vercel
   ```

3. **Delete Vercel Project:**
   - Vercel Dashboard → Settings → Delete Project
   - Re-link to team account if needed

4. **Recreate Neon Branch:**
   ```bash
   neonctl branches create vercel-dev --parent main
   ```

---

## Notes

- All tasks should be executed in order
- Each task is designed to be completed in 2-5 minutes
- Commit after each major step for easy rollback
- Test locally before deploying to preview
- Test preview before deploying to production
- Keep `.env.local.backup` until production is confirmed working
- Monitor logs for 24 hours after production deployment

## Estimated Timeline

- **Tasks 1-3**: Infrastructure cleanup and setup (~20 min)
- **Tasks 4-13**: Neon Auth migration (~60 min)
- **Tasks 14-15**: Local testing and preview deployment (~30 min)
- **Tasks 16-19**: Documentation updates (~30 min)
- **Tasks 20-21**: Production deployment and verification (~20 min)

**Total**: ~2.5 hours
