
// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { adminApp, adminAuth, adminDb } from '@/lib/firebaseAdmin'; // Ensure adminDb is exported and used
import { ADMIN_EMAIL } from '@/lib/constants';
import type { UserProfile } from '@/types';
import type { Timestamp } from 'firebase-admin/firestore'; // Use firebase-admin Timestamp

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!adminApp || !adminAuth || !adminDb) { 
    console.error("[API /admin/users] CRITICAL: Firebase Admin SDK (adminApp, adminAuth, or adminDb) is not initialized. This usually means there's an issue in 'src/lib/firebaseAdmin.ts', likely with service account credentials. Check server startup logs for detailed errors from 'firebaseAdmin.ts'.");
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. API unavailable. Please check server logs for details on the Admin SDK initialization failure.' }, { status: 500 });
  }

  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden: User is not an admin.' }, { status: 403 });
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
    console.error('Error in /api/admin/users:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    if (error.code === 'permission-denied' || error.code === 7) { // Firestore permission denied
      return NextResponse.json({ error: 'Firestore permission denied. Check Firestore rules for admin access to users collection.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

