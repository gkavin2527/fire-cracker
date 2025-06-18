
// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { adminApp, adminAuth, adminDb } from '@/lib/firebaseAdmin'; // Ensure adminDb is exported and used
import { ADMIN_EMAIL } from '@/lib/constants';
import type { UserProfile } from '@/types';
import type { Timestamp } from 'firebase-admin/firestore'; // Use firebase-admin Timestamp

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!adminApp || !adminAuth || !adminDb) { 
    const errorMessage = 
      "[API /admin/users] CRITICAL ERROR: Firebase Admin SDK (adminApp, adminAuth, or adminDb) is NOT INITIALIZED. " +
      "This means the server cannot perform admin operations. This is usually due to an issue in 'src/lib/firebaseAdmin.ts' related to " +
      "Firebase service account credentials or environment variable setup (e.g., FIREBASE_SERVICE_ACCOUNT_JSON_PATH or FIREBASE_SERVICE_ACCOUNT_JSON). " +
      "The API route cannot function without a properly initialized Admin SDK. " +
      "PLEASE URGENTLY CHECK YOUR **SERVER STARTUP LOGS** (the terminal where `npm run dev` is running) for detailed error messages from 'firebaseAdmin.ts' " +
      "to diagnose the root cause of the Admin SDK initialization failure. These server logs will have specific details about why it failed (e.g., file not found, parsing error).";
    
    console.error("-----------------------------------------------------------------------------------------");
    console.error(errorMessage);
    console.error("-----------------------------------------------------------------------------------------");
    
    return NextResponse.json({ 
      error: 'Firebase Admin SDK not initialized. API unavailable. CRITICAL: Check SERVER logs for details on Admin SDK init failure from "src/lib/firebaseAdmin.ts".' 
    }, { status: 500 });
  }

  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized: No ID token provided.' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden: Authenticated user is not the designated admin.' }, { status: 403 });
    }

    // User is admin, proceed to fetch users
    const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    const usersList: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to a serializable format if needed, or handle on client.
      // For direct display, raw Timestamps from admin SDK might be okay if client handles them or just needs toDate().
      usersList.push({
        uid: doc.id,
        displayName: data.displayName,
        email: data.email,
        photoURL: data.photoURL,
        createdAt: data.createdAt, // This will be a Firestore Timestamp from firebase-admin
        lastLoginAt: data.lastLoginAt, // This will also be a Firestore Timestamp
        defaultShippingAddress: data.defaultShippingAddress,
      } as UserProfile); // Cast carefully, ensure fields match
    });

    return NextResponse.json(usersList);

  } catch (error: any) {
    console.error('[API /admin/users] Error processing request:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired ID token.' }, { status: 401 });
    }
    if (error.code === 'permission-denied' || error.code === 7) { // Firestore permission denied
      return NextResponse.json({ error: 'Firestore permission denied when fetching users. Check Firestore rules for admin access to users collection.', details: error.message }, { status: 500 });
    }
    // For other errors, return a generic message but log the specific one
    return NextResponse.json({ error: 'Internal Server Error while fetching users. Check server logs.', details: error.message }, { status: 500 });
  }
}
