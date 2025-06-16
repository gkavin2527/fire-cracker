
"use client";

import type { User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: "Signed in successfully!" });
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({ title: "Sign in failed", description: "Could not sign in with Google.", variant: "destructive" });
      setLoading(false); // Ensure loading is false on error
    }
    // Auth state change will set user and setLoading to false
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Signed out." });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Sign out failed", variant: "destructive" });
    }
    // Auth state change will set user to null and setLoading to false
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
