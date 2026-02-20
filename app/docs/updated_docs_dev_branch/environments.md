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

## Authentication

PriceOS uses Neon Auth for user authentication.

### Environment Variables

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `NEON_AUTH_BASE_URL` | Auth service endpoint | Use `https://auth.neon.tech` |
| `NEON_AUTH_COOKIE_SECRET` | Session cookie secret | Generate: `openssl rand -base64 32` |

**Important:** Use different `NEON_AUTH_COOKIE_SECRET` values for production, preview, and development environments.

## Password Reset

PriceOS uses Neon Auth for secure password reset via email.

### Prerequisites

- Email authentication must be enabled in Neon project Settings → Auth
- Environment variables configured (see Environment Variables section above)

### User Flow

1. Click "Forgot password?" on sign-in page
2. Enter email address
3. Receive reset link via email (expires in 15 minutes)
4. Click link to set new password
5. Sign in with new credentials

### Routes

- `/auth/sign-in` - Sign in with forgot password link
- `/auth/forgot-password` - Request reset link
- `/auth/reset-password` - Set new password (via email link)
- `/auth/sign-up` - Create new account

### Components Used

- `<AuthView>` - Main auth UI with forgot password option
- `<ForgotPasswordForm>` - Email submission form
- `<ResetPasswordForm>` - New password form

### Troubleshooting

**Reset link expired:**
- Links expire after 15 minutes
- Request new link from forgot password page

**Email not received:**
- Check spam folder
- Verify email authentication enabled in Neon settings
- Check environment variables are correct

**Password requirements:**
- Minimum length enforced by Neon Auth
- Must match confirmation field
