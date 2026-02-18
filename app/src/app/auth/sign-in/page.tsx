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
