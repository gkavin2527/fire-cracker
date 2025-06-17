
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Category } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export async function GET() {
  if (!db) {
    console.error("Firestore database is not initialized.");
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
  } catch (error) {
    console.error("Error fetching categories:", error);
    if (error instanceof Error && error.message.includes('indexes')) {
         return NextResponse.json({ error: 'Firestore query requires an index. Please create it in the Firebase console.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
