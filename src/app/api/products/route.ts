
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import type { Product } from '@/types';
import * as z from "zod";

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export async function GET() {
  if (!db) {
    console.error("Firestore database is not initialized in /api/products GET.");
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
  } catch (error: any) {
    console.error("Error fetching products from Firestore API:", error);

    if (error.code === 'permission-denied') {
        return NextResponse.json({
            error: 'Firestore permission denied. Please check your Firestore security rules.',
            details: error.message,
            firestoreErrorCode: error.code
        }, { status: 403 }); // 403 Forbidden for permission issues
    }
    
    // Check for Firestore specific error codes for missing index
    if (error.code === 'failed-precondition' && error.message && error.message.toLowerCase().includes('index')) {
        return NextResponse.json({
            error: 'Firestore query for products requires a composite index. Please create it in the Firebase console.',
            details: error.message,
            firestoreErrorCode: error.code
        }, { status: 500 });
    }
    
    // Fallback for other errors
    return NextResponse.json({
        error: 'Failed to fetch products from Firestore.',
        details: error.message || String(error),
        firestoreErrorCode: error.code || 'N/A'
    }, { status: 500 });
  }
}

// ProductFormSchema is no longer used here for POST as client handles validation for direct DB write
// Keeping the schema definition here if this API route is ever used for POST from other sources,
// or for reference.
const ProductFormSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  category: z.string().min(1, { message: "Please select a category." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(20, "Image hint too long").optional(), // Max 2 words generally
  stock: z.coerce.number().int().min(0, { message: "Stock must be a non-negative integer." }).optional(),
});

// The POST handler is now NOT USED by the admin page's "Add Product" form.
// It's kept here in case other parts of the system might use it, or for future use.
// If it were to be used, it would need a mechanism to authenticate requests
// if Firestore rules require authentication for writes via this server-side route.
export async function POST(request: Request) {
  if (!db) {
    console.error("Firestore database is not initialized in /api/products POST.");
    return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }
  console.warn("/api/products POST endpoint was called. Note: Admin page now writes products directly to Firestore.");
  try {
    const body = await request.json();
    const validation = ProductFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid product data", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const productData = validation.data;

    const newProduct: Omit<Product, 'id' | 'rating'> & { rating?: number } = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      imageUrl: productData.imageUrl || `https://placehold.co/400x300.png`,
      imageHint: productData.imageHint || productData.name.split(' ').slice(0,2).join(' ') || 'product image',
      stock: productData.stock ?? 0,
    };

    const productsCollection = collection(db, 'products');
    const docRef = await addDoc(productsCollection, newProduct);

    return NextResponse.json({ id: docRef.id, ...newProduct }, { status: 201 });

  } catch (error: any) {
    console.error("Error adding product to Firestore API:", error);
    if (error.code === 'permission-denied') {
        return NextResponse.json({ error: 'Firestore permission denied. Check your Firestore security rules.', details: error.message, firestoreErrorCode: error.code}, { status: 403});
    }
    return NextResponse.json({ error: 'Failed to add product to Firestore.', details: error.message || String(error), firestoreErrorCode: error.code || 'N/A' }, { status: 500 });
  }
}
