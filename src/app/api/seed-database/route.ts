
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { products as mockProducts, categories as mockCategories } from '@/lib/mockData';
import type { Product, Category } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!db) {
    console.error("Firestore database is not initialized in /api/seed-database.");
    return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });
  }

  try {
    const batch = writeBatch(db);
    let categoryCount = 0;
    let productCount = 0;

    // Seed Categories
    for (const category of mockCategories) {
      const categoryRef = doc(db, 'categories', category.id);
      // Ensure all fields are correctly mapped, especially iconName and displayOrder
      const categoryData: Category = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        imageHint: category.imageHint,
        iconName: category.iconName || 'DefaultIcon',
        displayOrder: category.displayOrder || 99,
      };
      batch.set(categoryRef, categoryData);
      categoryCount++;
    }

    // Seed Products
    for (const product of mockProducts) {
      const productRef = doc(db, 'products', product.id);
       // Ensure all fields are correctly mapped
      const productData: Product = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category, // This should be the string name of the category
        imageUrl: product.imageUrl,
        imageHint: product.imageHint,
        rating: product.rating || 0,
        stock: product.stock || 0,
      };
      batch.set(productRef, productData);
      productCount++;
    }

    await batch.commit();

    return NextResponse.json({
      message: 'Database seeded successfully!',
      categoriesAdded: categoryCount,
      productsAdded: productCount,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json({
      error: 'Failed to seed database.',
      details: error.message || String(error),
    }, { status: 500 });
  }
}
