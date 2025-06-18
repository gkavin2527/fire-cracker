
"use client";

import type { User } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase'; // Import db
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore'; // Import Firestore functions
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(userDocRef, { 
            lastLoginAt: Timestamp.now(),
            email: currentUser.email, // ensure email is saved/updated
            displayName: currentUser.displayName, // ensure name is saved/updated
            photoURL: currentUser.photoURL // ensure photo is saved/updated
           }, { merge: true });
        } catch (error) {
          console.error("AuthContext: Error updating lastLoginAt on auth state change: ", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;
      if (signedInUser && db) {
        const userDocRef = doc(db, 'users', signedInUser.uid);
        try {
          await setDoc(userDocRef, { 
            uid: signedInUser.uid,
            email: signedInUser.email,
            displayName: signedInUser.displayName,
            photoURL: signedInUser.photoURL,
            lastLoginAt: Timestamp.now() 
          }, { merge: true });
        } catch (error) {
          console.error("AuthContext: Error updating user data on signInWithGoogle Firestore write: ", error);
        }
      }
      toast({ title: "Signed in successfully!" });
      // onAuthStateChanged will handle setUser and setLoading(false)
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn(
          "AuthContext: Google Sign-In popup was closed by the user or cancelled.",
          "This is often due to the user intentionally closing the popup. However, if this happens unexpectedly, check:",
          "\n1. Browser popup blockers (disable for this site).",
          "\n2. Correct Firebase client configuration in .env.local (API Key, Auth Domain, Project ID).",
          "\n3. 'Authorized domains' in your Firebase project settings (ensure your dev URL is listed).",
          "\n4. Browser console for other errors (network issues, CSP, third-party cookie blocking in incognito)."
        );
        toast({
          title: "Sign-in Cancelled",
          description: "The sign-in popup was closed before completing.",
          variant: "default", 
        });
      } else {
        console.error("AuthContext: Error signing in with Google:", error);
        toast({ title: "Sign in failed", description: "Could not sign in with Google. Please try again.", variant: "destructive" });
      }
      setLoading(false); 
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: "Signed out." });
    } catch (error) {
      console.error("AuthContext: Error signing out: ", error);
      toast({ title: "Sign out failed", variant: "destructive" });
    }
    // onAuthStateChanged will set user to null and setLoading to false
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
