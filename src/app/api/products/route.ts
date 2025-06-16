
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import type { Product } from '@/types';
import * as z from "zod";

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
    if (error instanceof Error && error.message.includes('indexes')) {
         return NextResponse.json({ error: 'Firestore query requires an index. Please create it in the Firebase console.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

const ProductFormSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  category: z.string().min(1, { message: "Please select a category." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(20, "Image hint too long").optional(), // Max 2 words generally
  stock: z.coerce.number().int().min(0, { message: "Stock must be a non-negative integer." }).optional(),
});

export async function POST(request: Request) {
  if (!db) {
    console.error("Firestore database is not initialized.");
    return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }
  try {
    const body = await request.json();
    const validation = ProductFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid product data", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const productData = validation.data;

    // Prepare data for Firestore, ensuring all fields are present or have defaults
    const newProduct: Omit<Product, 'id' | 'rating'> & { rating?: number } = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      imageUrl: productData.imageUrl || `https://placehold.co/400x300.png`,
      imageHint: productData.imageHint || productData.name.split(' ').slice(0,2).join(' ') || 'product image',
      stock: productData.stock ?? 0,
      // rating is not part of the form, will be undefined or could be set to a default like 0 or null
    };

    const productsCollection = collection(db, 'products');
    const docRef = await addDoc(productsCollection, newProduct);

    return NextResponse.json({ id: docRef.id, ...newProduct }, { status: 201 });

  } catch (error) {
    console.error("Error adding product:", error);
    if (error instanceof Error && error.message.includes('permission-denied')) {
        return NextResponse.json({ error: 'Firestore permission denied. Check your Firestore security rules.'}, { status: 403});
    }
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}
