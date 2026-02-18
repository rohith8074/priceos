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
