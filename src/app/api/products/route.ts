
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export async function GET() {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy('name')); // Order by name by default
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    // Check if the error is related to missing Firestore indexes if ordering is used
    if (error instanceof Error && error.message.includes('indexes')) {
         return NextResponse.json({ error: 'Firestore query requires an index. Please create it in the Firebase console.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
