# Password Reset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement complete forgot password / password reset functionality using Neon Auth UI components

**Architecture:** Replace custom sign-in form with Neon Auth's `<AuthView>` component configured with `credentials={{ forgotPassword: true }}`, create dedicated password reset flow pages using `<ForgotPasswordForm>` and `<ResetPasswordForm>` components

**Tech Stack:** Neon Auth (Beta), Next.js 16, React, TypeScript

**Reference:** https://neon.com/docs/auth/guides/password-reset

---

## Prerequisites

Before starting, ensure:
1. Email authentication is enabled in Neon project Settings → Auth page
2. `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` are configured in `.env.local`
3. Neon Auth provider is set up in `app/src/app/layout.tsx`

---

## Task 1: Replace Custom Sign-In with Neon Auth Component

**Files:**
- Modify: `app/src/app/auth/sign-in/page.tsx`

**Step 1.1: Replace entire sign-in page with AuthView**

Replace the entire contents of `app/src/app/auth/sign-in/page.tsx`:

```typescript
import { AuthView } from '@neondatabase/auth/react/ui';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <AuthView
          pathname="sign-in"
          credentials={{ forgotPassword: true }}
        />
      </div>
    </div>
  );
}
```

**Why this change:**
- Removes custom form with TODO comment
- Uses official Neon Auth UI component
- Automatically includes "Forgot password?" link
- Handles all auth logic (validation, errors, redirects)

**Step 1.2: Test sign-in page**

Run: `npm run dev` and navigate to http://localhost:3000/auth/sign-in

Expected:
- Sign-in form displays with email/password fields
- "Forgot password?" link appears below password field
- "Sign up" link appears at bottom
- Form has proper styling and validation

**Step 1.3: Commit**

```bash
git add app/src/app/auth/sign-in/page.tsx
git commit -m "feat: replace custom sign-in with Neon Auth component

- Use AuthView with forgotPassword enabled
- Remove custom form implementation
- Add automatic forgot password link"
```

---

## Task 2: Implement Forgot Password Page

**Files:**
- Modify: `app/src/app/auth/forgot-password/page.tsx`

**Step 2.1: Update forgot password page to use ForgotPasswordForm**

Replace the entire contents of `app/src/app/auth/forgot-password/page.tsx`:

```typescript
"use client";

import { ForgotPasswordForm } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <ForgotPasswordForm
          authClient={authClient}
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`}
          onSuccess={(data) => {
            // Show success message and redirect
            console.log('Password reset email sent to:', data.email);
            router.push('/auth/reset-password?email=' + encodeURIComponent(data.email));
          }}
        />

        <div className="mt-4 text-center">
          <a
            href="/auth/sign-in"
            className="text-sm text-primary hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Why these changes:**
- Uses dedicated `<ForgotPasswordForm>` component
- Includes heading and instructions for UX
- Configures `redirectTo` for reset link destination
- Handles `onSuccess` to redirect to reset page
- Adds back link to sign-in page

**Step 2.2: Test forgot password page**

Run: Navigate to http://localhost:3000/auth/forgot-password

Expected:
- Page displays with "Reset your password" heading
- Email input field with proper validation
- "Send reset link" button
- "Back to sign in" link at bottom

Test flow:
1. Enter invalid email → Should show validation error
2. Enter valid email → Should show success message
3. Check email for reset link (if email is configured)

**Step 2.3: Commit**

```bash
git add app/src/app/auth/forgot-password/page.tsx
git commit -m "feat: implement forgot password page with form

- Use ForgotPasswordForm from Neon Auth
- Add heading and instructions
- Configure redirect URL for reset link
- Add back link to sign-in"
```

---

## Task 3: Implement Password Reset Page

**Files:**
- Modify: `app/src/app/auth/reset-password/page.tsx`

**Step 3.1: Update reset password page with form and email handling**

Replace the entire contents of `app/src/app/auth/reset-password/page.tsx`:

```typescript
"use client";

import { useState, useEffect } from 'react';
import { ResetPasswordForm } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from URL params (from forgot password page)
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Set new password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
          {email && (
            <p className="text-xs text-muted-foreground mt-2">
              For: {email}
            </p>
          )}
        </div>

        <ResetPasswordForm
          authClient={authClient}
          email={email}
          onSuccess={() => {
            // Redirect to sign-in after successful reset
            console.log('Password reset successful');
            router.push('/auth/sign-in?reset=success');
          }}
        />

        <div className="mt-4 text-center">
          <a
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Request new reset link
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Why these changes:**
- Uses dedicated `<ResetPasswordForm>` component
- Reads email from URL params (passed from forgot password page)
- Displays email address to user for confirmation
- Handles `onSuccess` to redirect to sign-in with success param
- Adds link to request new reset link if expired

**Step 3.2: Test reset password page**

Run: Navigate to http://localhost:3000/auth/reset-password?email=test@example.com

Expected:
- Page displays with "Set new password" heading
- Email address displayed below heading
- New password input field
- Confirm password input field
- "Reset password" button
- "Request new reset link" link at bottom

Test validations:
1. Passwords must match → Should show error if different
2. Password strength requirements → Should show validation
3. Successful reset → Should redirect to sign-in

**Step 3.3: Commit**

```bash
git add app/src/app/auth/reset-password/page.tsx
git commit -m "feat: implement password reset page with form

- Use ResetPasswordForm from Neon Auth
- Read email from URL params
- Display email for user confirmation
- Add success redirect to sign-in
- Add link to request new reset link"
```

---

## Task 4: Add Success Message to Sign-In Page

**Files:**
- Modify: `app/src/app/auth/sign-in/page.tsx`

**Step 4.1: Add success banner for password reset**

Update `app/src/app/auth/sign-in/page.tsx` to show success message:

```typescript
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthView } from '@neondatabase/auth/react/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setShowSuccess(true);
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">
        {showSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Password reset successful! You can now sign in with your new password.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <AuthView
            pathname="sign-in"
            credentials={{ forgotPassword: true }}
          />
        </div>
      </div>
    </div>
  );
}
```

**Why this change:**
- Detects `?reset=success` URL param
- Shows green success banner
- Auto-dismisses after 5 seconds
- Improves UX by confirming successful reset

**Step 4.2: Test success message**

Run: Navigate to http://localhost:3000/auth/sign-in?reset=success

Expected:
- Green success alert appears at top
- Message: "Password reset successful! You can now sign in with your new password."
- Alert disappears after 5 seconds
- Sign-in form displays normally below

**Step 4.3: Commit**

```bash
git add app/src/app/auth/sign-in/page.tsx
git commit -m "feat: add success message after password reset

- Detect reset=success URL param
- Show green alert banner
- Auto-dismiss after 5 seconds
- Improve UX with confirmation message"
```

---

## Task 5: Update Sign-Up Page (Optional Enhancement)

**Files:**
- Create: `app/src/app/auth/sign-up/page.tsx` (if doesn't exist)

**Step 5.1: Create sign-up page with AuthView**

Create `app/src/app/auth/sign-up/page.tsx`:

```typescript
import { AuthView } from '@neondatabase/auth/react/ui';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <AuthView pathname="sign-up" />
      </div>
    </div>
  );
}
```

**Why this addition:**
- Provides dedicated sign-up route
- Uses consistent AuthView styling
- Allows direct navigation to sign-up

**Step 5.2: Test sign-up page**

Run: Navigate to http://localhost:3000/auth/sign-up

Expected:
- Sign-up form displays with email/password fields
- Password confirmation field
- "Sign up" button
- "Already have an account?" link to sign-in

**Step 5.3: Commit**

```bash
git add app/src/app/auth/sign-up/page.tsx
git commit -m "feat: add dedicated sign-up page

- Use AuthView with sign-up pathname
- Consistent styling with sign-in page
- Enable direct sign-up navigation"
```

---

## Task 6: End-to-End Testing

**No files modified** - Testing only

**Step 6.1: Test complete password reset flow**

**Test Scenario 1: Full Reset Flow**

1. Navigate to http://localhost:3000/auth/sign-in
2. Click "Forgot password?" link
3. Should redirect to `/auth/forgot-password`
4. Enter valid email: `test@example.com`
5. Click "Send reset link"
6. Should redirect to `/auth/reset-password?email=test@example.com`
7. Check email for reset link (if email configured)
8. Click reset link in email
9. Should show reset password form
10. Enter new password twice
11. Click "Reset password"
12. Should redirect to `/auth/sign-in?reset=success`
13. Should see green success banner
14. Sign in with new password
15. Should redirect to `/dashboard`

**Test Scenario 2: Error Handling**

1. Navigate to `/auth/forgot-password`
2. Enter invalid email → Should show validation error
3. Navigate to `/auth/reset-password` without email param → Should still show form
4. Enter mismatched passwords → Should show error
5. Enter weak password → Should show strength requirements

**Test Scenario 3: Link Expiration**

1. Request password reset
2. Wait 16+ minutes (links expire after 15 minutes)
3. Click reset link
4. Should show expiration error
5. Click "Request new reset link"
6. Should return to forgot password page

**Step 6.2: Document test results**

Run: Create test log

Expected: All scenarios pass, document any failures

**Step 6.3: Commit test documentation**

```bash
git add docs/testing/password-reset-tests.md  # If you created test log
git commit -m "docs: add password reset test scenarios"
```

---

## Task 7: Update Documentation

**Files:**
- Modify: `docs/environments.md` or `README.md`

**Step 7.1: Add password reset documentation**

Add section to relevant docs file:

```markdown
## Password Reset

PriceOS uses Neon Auth for secure password reset via email.

### Prerequisites
- Email authentication must be enabled in Neon project Settings → Auth
- Environment variables configured (see Setup section)

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
```

**Step 7.2: Commit documentation**

```bash
git add docs/environments.md  # Or whichever file you updated
git commit -m "docs: add password reset user guide

- Document user flow
- List auth routes
- Add troubleshooting section
- Include component references"
```

---

## Task 8: Deploy to Vercel

**No files modified** - Deployment only

**Step 8.1: Verify environment variables**

Check Vercel project settings for:
- `NEON_AUTH_BASE_URL` - Should be set
- `NEON_AUTH_COOKIE_SECRET` - Should be set
- Email provider config (if applicable)

**Step 8.2: Push to dev branch**

```bash
git status
git push origin dev
```

Expected: Automatic deployment to Vercel dev environment

**Step 8.3: Test on deployed site**

Navigate to https://app-harshitlyzr.vercel.app/auth/sign-in

Test complete flow:
1. Click "Forgot password?"
2. Request reset link
3. Receive email (check Neon email provider)
4. Complete password reset
5. Sign in successfully

**Step 8.4: Monitor deployment**

```bash
vercel logs
```

Expected: No errors, successful auth operations logged

---

## Task 9: Enable Email in Neon Console (If Not Already Done)

**External action** - Neon Console configuration

**Step 9.1: Navigate to Neon Console**

1. Go to https://console.neon.tech
2. Select your project
3. Navigate to Settings → Auth

**Step 9.2: Enable email authentication**

1. Find "Sign-up with Email" option
2. Toggle to enabled
3. Configure email provider (if prompted)
4. Save settings

**Step 9.3: Verify configuration**

Navigate to deployed app and test forgot password:
- Should receive actual email
- Email should contain reset link
- Link should be valid for 15 minutes

**Step 9.4: Document completion**

Note: This step may already be complete based on prior Neon Auth setup.

---

## Success Criteria

✅ Sign-in page uses Neon Auth component with forgot password link
✅ Forgot password page accepts email and sends reset link
✅ Reset password page accepts new password and confirms
✅ Success message displays after password reset
✅ All pages have consistent styling and UX
✅ Error handling works for invalid inputs
✅ Link expiration (15 min) is handled gracefully
✅ Complete flow tested locally
✅ Complete flow tested on Vercel deployment
✅ Documentation updated
✅ Email delivery works (if email provider configured)

---

## Known Limitations

1. **Reset links expire after 15 minutes** - Users must request new link if expired
2. **Neon Auth is Beta** - May have breaking changes in future releases
3. **SDK methods limited** - Must use UI components (direct API methods not fully supported)
4. **Email provider required** - Must configure email in Neon settings for production use

---

## Future Enhancements

- [ ] Add email verification on sign-up
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Implement account security page (change password when logged in)
- [ ] Add rate limiting for password reset requests
- [ ] Customize email templates in Neon settings
- [ ] Add password strength indicator
- [ ] Add CAPTCHA for forgot password form

---

## References

- [Neon Auth Password Reset Guide](https://neon.com/docs/auth/guides/password-reset)
- [Neon Auth Quick Start](https://neon.com/docs/auth/quick-start/nextjs)
- [Next.js Server SDK Reference](https://neon.com/docs/auth/reference/nextjs-server)
