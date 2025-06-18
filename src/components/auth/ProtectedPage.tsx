
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_EMAIL } from '@/lib/constants'; // Import ADMIN_EMAIL

interface ProtectedPageProps {
  children: ReactNode;
  adminOnly?: boolean; // New prop to specify if this page is admin-only
}

const ProtectedPage = ({ children, adminOnly = false }: ProtectedPageProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for authentication state to load
    }

    if (!user) {
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }

    if (adminOnly && user.email !== ADMIN_EMAIL) {
      // If adminOnly is true and user is not the admin, prevent access
      // No explicit redirect here, the component will render an access denied message
      return;
    }
  }, [user, loading, router, adminOnly]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be caught by useEffect redirecting to /login,
    // but as a fallback or during brief state transitions:
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  if (adminOnly && user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Go to Homepage
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
