# PriceOS Environments

## Overview

| Environment | Git Branch | Vercel | Neon Branch | URL |
|-------------|-----------|--------|-------------|-----|
| Production  | main      | Production deploy | main | priceos.vercel.app |
| Development | dev       | Preview deploy    | dev  | priceos-git-dev-*.vercel.app |

## Local Development

Your `.env.local` should point to the Neon **dev** branch.
Run `npm run dev` from `app/`.

## Promoting to Production

1. Ensure `dev` branch is stable and tested
2. Create PR: `dev` → `main`
3. CI runs typecheck + build
4. Merge PR
5. Vercel auto-deploys to production using Neon main branch

## Database Operations

### Push schema changes
```bash
cd app
# Dev DB (uses .env.local pointing to dev branch)
npm run db:push

# Prod DB (temporarily switch DATABASE_URL)
DATABASE_URL=<prod-url> npm run db:push
```

### Reset dev DB from production
```bash
neonctl branches reset dev --project-id summer-cake-85946943 --org-id org-orange-flower-61544110 --parent
```

### Re-seed dev DB
```bash
cd app && npm run db:seed
```

## Neon Project Details

- **Project ID:** `summer-cake-85946943`
- **Org ID:** `org-orange-flower-61544110`
- **Region:** `aws-us-east-1`
