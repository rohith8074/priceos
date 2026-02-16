'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm, SignUpForm, authLocalization } from '@neondatabase/auth/react/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Listen for successful auth and redirect
  useEffect(() => {
    if (!open) return;

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/get-session');
        const data = await response.json();

        if (data && data.session) {
          // User is authenticated, close dialog and redirect
          setTimeout(() => {
            onOpenChange(false);
          }, 0);
          router.push('/dashboard');
          router.refresh();
        }
      } catch (error) {
        // Ignore errors, form will handle them
      }
    };

    // Poll for auth status after form submission
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, [open, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to PriceOS</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <SignInForm localization={authLocalization} />
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <SignUpForm localization={authLocalization} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
