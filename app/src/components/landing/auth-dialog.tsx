'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm, SignUpForm } from '@neondatabase/auth/react/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authClient } from '@/lib/auth/client';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Debug: Log authClient
  console.log('AuthDialog - authClient:', authClient);
  console.log('AuthDialog - authClient type:', typeof authClient);

  const handleSuccess = () => {
    // Defer state updates to avoid updating unmounted component
    setTimeout(() => {
      onOpenChange(false);
    }, 0);
    router.push('/dashboard');
    router.refresh();
  };

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
            <SignInForm authClient={authClient} onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <SignUpForm authClient={authClient} onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
