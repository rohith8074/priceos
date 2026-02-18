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
