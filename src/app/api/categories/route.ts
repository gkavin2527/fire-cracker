
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Category } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export async function GET() {
  if (!db) {
    console.error("Firestore database is not initialized in /api/categories.");
    return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }
  try {
    const categoriesCollection = collection(db, 'categories');
    // Order by displayOrder, then by name as a secondary sort
    const q = query(categoriesCollection, orderBy('displayOrder', 'asc'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    return NextResponse.json(categories);
  } catch (error: any) { // Use 'any' to access potential 'code' property
    console.error("Error fetching categories from Firestore API:", error);

    // Check for Firestore specific error codes for missing index
    // Firestore error code for missing index is typically 'failed-precondition'
    if (error.code === 'failed-precondition' && error.message && error.message.toLowerCase().includes('index')) {
        return NextResponse.json({
            error: 'Firestore query for categories requires a composite index. Please create it in the Firebase console.',
            details: error.message,
            firestoreErrorCode: error.code
        }, { status: 500 });
    }
    
    // Fallback for other errors
    return NextResponse.json({
        error: 'Failed to fetch categories from Firestore.',
        details: error.message || String(error), // Provide more details from the error object
        firestoreErrorCode: error.code || 'N/A' // Include Firestore error code if available
    }, { status: 500 });
  }
}
