
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
          console.error("Error updating lastLoginAt on auth state change: ", error);
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
          // Set initial data or update last login
          // Check if user document exists to set createdAt only once
          // For simplicity here, we just ensure lastLoginAt is set/updated.
          // Account page handles full profile creation if it doesn't exist.
          await setDoc(userDocRef, { 
            uid: signedInUser.uid,
            email: signedInUser.email,
            displayName: signedInUser.displayName,
            photoURL: signedInUser.photoURL,
            lastLoginAt: Timestamp.now() 
          }, { merge: true });
        } catch (error) {
          console.error("Error updating user data on signInWithGoogle: ", error);
        }
      }
      toast({ title: "Signed in successfully!" });
      // onAuthStateChanged will handle setUser and setLoading(false)
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      toast({ title: "Sign in failed", description: "Could not sign in with Google.", variant: "destructive" });
      setLoading(false); 
    }
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
