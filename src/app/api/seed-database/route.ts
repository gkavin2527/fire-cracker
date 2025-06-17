
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { products as mockProducts, categories as mockCategories } from '@/lib/mockData'; // Using the mock data
import type { Product, Category } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!db) {
    console.error("Firestore database is not initialized for seeding.");
    return NextResponse.json({ error: 'Firestore not initialized', details: 'The database connection (db) is null in /api/seed-database.' }, { status: 500 });
  }

  let categoriesSeeded = 0;
  let productsSeeded = 0;

  try {
    // Seed Categories
    const categoriesBatch = writeBatch(db);
    for (const category of mockCategories) {
      // Ensure required fields for Category are present, provide defaults if not in mock
      const categoryData: Category = {
        id: category.id, // Using mock id as Firestore document ID
        name: category.name,
        slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
        imageUrl: category.imageUrl || 'https://placehold.co/200x150.png',
        imageHint: category.imageHint || category.name.split(' ').slice(0,2).join(' ') || 'category image',
        iconName: category.iconName || 'DefaultIcon',
        displayOrder: category.displayOrder || 99,
      };
      const categoryRef = doc(db, 'categories', categoryData.id);
      categoriesBatch.set(categoryRef, categoryData);
      categoriesSeeded++;
    }
    await categoriesBatch.commit();
    console.log(`Successfully seeded ${categoriesSeeded} categories.`);

    // Seed Products
    const productsBatch = writeBatch(db);
    for (const product of mockProducts) {
      // Ensure required fields for Product are present, provide defaults if not in mock
      const productData: Product = {
        id: product.id, // Using mock id as Firestore document ID
        name: product.name,
        description: product.description || 'No description available.',
        price: typeof product.price === 'number' ? product.price : 0,
        category: product.category || 'Uncategorized', // Ensure this matches a seeded category name for consistency
        imageUrl: product.imageUrl || 'https://placehold.co/400x300.png',
        imageHint: product.imageHint || product.name.split(' ').slice(0,2).join(' ') || 'product image',
        stock: typeof product.stock === 'number' ? product.stock : 0,
        rating: typeof product.rating === 'number' ? product.rating : 0,
      };
      const productRef = doc(db, 'products', productData.id);
      productsBatch.set(productRef, productData);
      productsSeeded++;
    }
    await productsBatch.commit();
    console.log(`Successfully seeded ${productsSeeded} products.`);

    return NextResponse.json({ 
      message: 'Database seeded successfully!', 
      categoriesSeeded, 
      productsSeeded 
    });

  } catch (error: any) {
    console.error("Error seeding database:", error);
    // Try to provide a more specific error message if possible
    let detailMessage = error.message || String(error);
    if (error.code === 'permission-denied') {
      detailMessage = 'Firestore permission denied. Please check your Firestore security rules to allow writes to "categories" and "products" collections.';
    } else if (error.code === 'unavailable') {
      detailMessage = 'Firestore service is unavailable. This might be a temporary issue with Google Cloud services or network connectivity.';
    } else if (error.code === 'invalid-argument') {
      detailMessage = `Firestore invalid argument: ${error.message}. This could be due to an issue with the data format being written.`;
    }
    
    return NextResponse.json({ 
      error: 'Failed to seed database.', 
      details: detailMessage,
      firestoreErrorCode: error.code || 'N/A'
    }, { status: 500 });
  }
}
