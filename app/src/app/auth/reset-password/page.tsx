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
