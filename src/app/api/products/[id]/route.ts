
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request, or consider 'auto' or revalidation strategies

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }
  try {
    const productId = params.id;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const productDocRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productDocRef);

    if (!productDoc.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productData = { id: productDoc.id, ...productDoc.data() } as Product;
    return NextResponse.json(productData);
  } catch (error) {
    console.error(`Error fetching product with ID ${params.id}:`, error);
    // Check if the error is related to missing Firestore indexes if ordering is used
    if (error instanceof Error && error.message.includes('indexes')) {
         return NextResponse.json({ error: 'Firestore query requires an index. Please create it in the Firebase console.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
