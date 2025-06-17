
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from '@/components/products/ProductCard';
import type { Product, Category } from '@/types';
import { getIcon } from '@/lib/iconMap';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${APP_URL}/api/products`, { cache: 'no-store' });
    if (!res.ok) {
      let errorBody = "No additional error body from API or failed to parse error body.";
      try {
        // Attempt to parse as JSON, which our API routes should return on error
        const errorJson = await res.json();
        errorBody = JSON.stringify(errorJson);
      } catch (e) {
        // If not JSON, try to parse as text (fallback)
        try {
          errorBody = await res.text();
          if (!errorBody.trim()) errorBody = "Empty error body from API."
        } catch (textError) {
          // If text parsing also fails
           errorBody = "Could not parse error body as JSON or text."
        }
      }
      console.error(`Failed to fetch products for homepage. Status: ${res.status}. API Response: ${errorBody}`);
      return [];
    }
    const products: Product[] = await res.json();
    return products;
  } catch (error) { // This catches network errors or issues with fetch itself
    console.error("Network or other error fetching products for homepage:", error);
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${APP_URL}/api/categories`, { cache: 'no-store' });
    if (!res.ok) {
      let errorBody = "No additional error body from API or failed to parse error body.";
       try {
        const errorJson = await res.json();
        errorBody = JSON.stringify(errorJson);
      } catch (e) {
        try {
          errorBody = await res.text();
          if (!errorBody.trim()) errorBody = "Empty error body from API."
        } catch (textError) {
           errorBody = "Could not parse error body as JSON or text."
        }
      }
      console.error(`Failed to fetch categories for homepage. Status: ${res.status}. API Response: ${errorBody}`);
      return [];
    }
    const categories: Category[] = await res.json();
    return categories;
  } catch (error) {
    console.error("Network or other error fetching categories for homepage:", error);
    return [];
  }
}

export default async function HomePage() {
  const allProducts = await getProducts();
  const featuredProducts = allProducts.slice(0, 4);
  const categories = await getCategories();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary via-red-500 to-yellow-400 text-primary-foreground py-20 px-4 rounded-lg shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <Image src="https://placehold.co/1200x400.png" alt="Fireworks background" layout="fill" objectFit="cover" data-ai-hint="fireworks celebration" />
        </div>
        <div className="relative container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-6 tracking-tight">
            Light Up Your Celebrations!
          </h1>
          <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Discover the widest range of spectacular crackers at CrackleMart. Safe, vibrant, and delivered to your doorstep.
          </p>
          <Link href="/products" passHref>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-3 rounded-md font-semibold transition-transform hover:scale-105">
              Shop All Crackers <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Browse by Category</h2>
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((category) => {
              const Icon = getIcon(category.iconName);
              return (
                <Link key={category.id} href={`/products?category=${category.slug}`} passHref>
                  <Card className="relative text-center hover:shadow-xl transition-all duration-300 cursor-pointer rounded-lg border-border/60 overflow-hidden group h-40">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-500 group-hover:scale-110 z-0"
                      data-ai-hint={category.imageHint}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300 z-1" />
                    <CardContent className="relative z-2 p-4 sm:p-6 flex flex-col items-center justify-center h-full">
                      <Icon className="h-10 w-10 sm:h-12 sm:w-12 mb-3 text-white group-hover:text-accent group-hover:scale-110 transition-all" />
                      <h3 className="text-sm sm:text-base font-semibold font-headline text-primary-foreground group-hover:text-accent transition-colors">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">Could not load categories or no categories available.</p>
        )}
      </section>

      {/* Featured Products Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Featured Crackers</h2>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center col-span-full">Could not load featured products or no products available.</p>
        )}
        <div className="text-center mt-8">
          <Link href="/products" passHref>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View All Products
            </Button>
          </Link>
        </div>
      </section>

       {/* Safety Section */}
      <section className="bg-secondary p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-4 font-headline text-secondary-foreground">Safety First!</h2>
        <p className="text-center text-muted-foreground max-w-xl mx-auto">
          Always handle fireworks responsibly. Read all instructions, maintain a safe distance, and never allow children to play with fireworks unsupervised. Your safety is our priority.
        </p>
      </section>
    </div>
  );
}
