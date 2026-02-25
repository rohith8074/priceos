'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm, SignUpForm, authLocalization } from '@neondatabase/auth/react/ui';
import { authClient } from '@/lib/auth/client';
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
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Listen for successful auth and redirect
  useEffect(() => {
    if (session) {
      onOpenChange(false);
      router.push('/dashboard');
      router.refresh();
    }
  }, [session, onOpenChange, router]);

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
