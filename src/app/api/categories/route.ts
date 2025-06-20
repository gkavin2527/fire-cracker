
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Category } from '@/types';

export const dynamic = 'force-dynamic'; 

export async function GET() {
  if (!db) {
    console.error("Firestore database is not initialized in /api/categories.");
    return NextResponse.json({ error: 'Firestore not initialized. Check Firebase config and .env.local variables.' }, { status: 500 });
  }
  try {
    const categoriesCollection = collection(db, 'categories');
    const q = query(categoriesCollection, orderBy('displayOrder', 'asc'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    return NextResponse.json(categories);
  } catch (error: any) { 
    console.error("Error fetching categories from Firestore API:", error);

    if (error.code === 'permission-denied') {
        return NextResponse.json({
            error: 'Firestore permission denied when fetching categories. Please check your Firestore security rules to allow public read access to the "categories" collection.',
            details: error.message,
            firestoreErrorCode: error.code
        }, { status: 403 });
    }
    
    if (error.code === 'failed-precondition' && error.message && error.message.toLowerCase().includes('index')) {
        return NextResponse.json({
            error: 'Firestore query for categories requires a composite index. Please create it in the Firebase console.',
            details: error.message, 
            firestoreErrorCode: error.code
        }, { status: 500 });
    }
    
    return NextResponse.json({
        error: 'Failed to fetch categories from Firestore.',
        details: error.message || String(error), 
        firestoreErrorCode: error.code || 'N/A' 
    }, { status: 500 });
  }
}
