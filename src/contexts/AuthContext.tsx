
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
            email: currentUser.email, 
            displayName: currentUser.displayName, 
            photoURL: currentUser.photoURL 
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
    console.log("[AuthContext] Attempting signInWithGoogle. Auth object available:", auth);
    if (!auth || !auth.app) {
        console.error("[AuthContext] CRITICAL: Firebase Auth object or auth.app is not available or not correctly initialized. This indicates a problem with Firebase setup in 'src/lib/firebase.ts'. Check console for errors from that file.");
        toast({
            title: "Firebase Configuration Error",
            description: "Firebase is not properly configured. Please check console logs for details from 'src/lib/firebase.ts' and ensure your .env.local file is correct. Admin may need to restart the server.",
            variant: "destructive",
            duration: 9000,
        });
        setLoading(false);
        return;
    }
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
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn(
          "[AuthContext] Google Sign-In popup was closed by the user or cancelled.",
          "Common causes if unintentional:",
          "\n1. Firebase Client Config: Ensure '.env.local' has correct NEXT_PUBLIC_FIREBASE_... variables and server was restarted.",
          "\n2. Authorized Domains: Check Firebase Console > Authentication > Settings > Authorized domains. Your dev URL must be listed.",
          "\n3. Browser Popups/Cookies: Disable popup blockers for this site. Check third-party cookie settings, especially in incognito.",
          "\n4. Console Errors: Look for other Firebase errors in the browser console that might precede this one.",
          "\nError object:", error
        );
        toast({
          title: "Sign-in Cancelled",
          description: "The sign-in popup was closed before completing. Check browser console for more details if this was unexpected.",
          variant: "default", 
          duration: 7000,
        });
      } else {
        console.error("[AuthContext] Error signing in with Google: ", error);
        toast({ title: "Sign in failed", description: `Could not sign in with Google. Error: ${error.message || 'Unknown error'}. Please try again.`, variant: "destructive" });
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

