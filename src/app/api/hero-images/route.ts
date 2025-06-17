
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { HeroImage } from '@/types';

export const dynamic = 'force-dynamic'; 

export async function GET() {
  if (!db) {
    console.error("Firestore database is not initialized in /api/hero-images.");
    return NextResponse.json({ error: 'Firestore not initialized. Check Firebase config.' }, { status: 500 });
  }
  try {
    const heroImagesCollection = collection(db, 'heroImages');
    const q = query(heroImagesCollection, where('isActive', '==', true), orderBy('displayOrder', 'asc'));
    const querySnapshot = await getDocs(q);
    const heroImages: HeroImage[] = [];
    querySnapshot.forEach((doc) => {
      heroImages.push({ id: doc.id, ...doc.data() } as HeroImage);
    });
    return NextResponse.json(heroImages);
  } catch (error: any) { 
    console.error("Error fetching hero images from Firestore API:", error);

    if (error.code === 'permission-denied') {
        return NextResponse.json({
            error: 'Firestore permission denied when fetching hero images. Please check your Firestore security rules to allow public read access to active hero images in the "heroImages" collection.',
            details: error.message,
            firestoreErrorCode: error.code
        }, { status: 403 });
    }
    
    if (error.code === 'failed-precondition' && error.message && error.message.toLowerCase().includes('index')) {
        return NextResponse.json({
            error: 'Firestore query for hero images requires a composite index (isActive ASC, displayOrder ASC). Please create it in the Firebase console.',
            details: error.message, 
            firestoreErrorCode: error.code
        }, { status: 500 });
    }
    
    return NextResponse.json({
        error: 'Failed to fetch hero images from Firestore.',
        details: error.message || String(error), 
        firestoreErrorCode: error.code || 'N/A' 
    }, { status: 500 });
  }
}
