
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn } from 'lucide-react'; // Using LogIn icon

const LoginPage = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/admin'); // Redirect to admin or dashboard if already logged in
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  // If user is already logged in (and not loading), they will be redirected by useEffect.
  // This prevents brief flash of login page.
  if (user) {
      return null; 
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm shadow-xl rounded-lg border-border/60">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">Admin Login</CardTitle>
          <CardDescription>Sign in to access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={signInWithGoogle} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            <LogIn className="mr-2 h-5 w-5" /> Sign In with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
