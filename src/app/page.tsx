
"use client"; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from '@/components/products/ProductCard';
import type { Product, Category, HeroImage } from '@/types';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';

// Using relative URLs for API calls is more robust for client-side fetching within the same app.
// const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [currentHeroImageIndex, setCurrentHeroImageIndex] = useState(0);
  
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [isLoadingHeroImages, setIsLoadingHeroImages] = useState(true);
  const [heroImagesError, setHeroImagesError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      const res = await fetch(`/api/products`, { cache: 'no-store' }); // Use relative URL
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to parse error from products API" }));
        throw new Error(errorData.error || `Failed to fetch products. Status: ${res.status}`);
      }
      const allProducts: Product[] = await res.json();
      setProducts(allProducts);
      setFeaturedProducts(allProducts.slice(0, 4));
    } catch (error: any) {
      console.error("Error fetching products for homepage:", error);
      setProductsError(error.message || "Could not load products.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoriesError(null);
    try {
      const res = await fetch(`/api/categories`, { cache: 'no-store' }); // Use relative URL
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to parse error from categories API" }));
        throw new Error(errorData.error || `Failed to fetch categories. Status: ${res.status}`);
      }
      const fetchedCategories: Category[] = await res.json();
      setCategories(fetchedCategories);
    } catch (error: any) {
      console.error("Error fetching categories for homepage:", error);
      setCategoriesError(error.message || "Could not load categories.");
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const fetchHeroImages = useCallback(async () => {
    setIsLoadingHeroImages(true);
    setHeroImagesError(null);
    try {
      const res = await fetch(`/api/hero-images`, { cache: 'no-store' }); // Use relative URL
       if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to parse error from hero images API" }));
        throw new Error(errorData.error || `Failed to fetch hero images. Status: ${res.status}`);
      }
      const fetchedHeroImages: HeroImage[] = await res.json();
      setHeroImages(fetchedHeroImages);
    } catch (error: any) {
      console.error("Error fetching hero images for homepage:", error);
      setHeroImagesError(error.message || "Could not load hero images.");
    } finally {
      setIsLoadingHeroImages(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchHeroImages();
  }, [fetchProducts, fetchCategories, fetchHeroImages]);

  useEffect(() => {
    if (heroImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentHeroImageIndex(prevIndex => (prevIndex + 1) % heroImages.length);
      }, 10000); // Change image every 10 seconds
      return () => clearInterval(timer); // Cleanup timer on component unmount
    }
  }, [heroImages]);

  const currentHeroImage = heroImages.length > 0 ? heroImages[currentHeroImageIndex] : null;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary via-red-500 to-yellow-400 text-primary-foreground py-10 sm:py-20 px-4 rounded-lg shadow-xl overflow-hidden min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
        {isLoadingHeroImages ? (
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        ) : heroImagesError ? (
          <div className="text-center text-white">
            <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
            <p>Could not load hero images: {heroImagesError.substring(0,100)}</p>
          </div>
        ) : currentHeroImage ? (
          <>
            <Image 
              src={currentHeroImage.imageUrl} 
              alt={currentHeroImage.altText} 
              layout="fill" 
              objectFit="cover" 
              className="absolute inset-0 opacity-30 z-0"
              data-ai-hint={currentHeroImage.dataAiHint}
              priority={currentHeroImageIndex === 0} // Prioritize first image
            />
            <div className="relative z-10 container mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-6 tracking-tight">
                {currentHeroImage.altText || "Light Up Your Celebrations!"}
              </h1>
              <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
                Discover the widest range of spectacular crackers at GK Crackers. Safe, vibrant, and delivered to your doorstep.
              </p>
              <Link href={currentHeroImage.linkUrl || "/products"} passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-3 rounded-md font-semibold transition-transform hover:scale-105">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
           <>
            <div className="absolute inset-0 opacity-20">
                <Image src="https://placehold.co/1200x400.png" alt="Fireworks background" layout="fill" objectFit="cover" data-ai-hint="fireworks celebration" />
            </div>
            <div className="relative container mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-6 tracking-tight">
                Light Up Your Celebrations!
              </h1>
              <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
                Discover the widest range of spectacular crackers at GK Crackers. Safe, vibrant, and delivered to your doorstep.
              </p>
              <Link href="/products" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-3 rounded-md font-semibold transition-transform hover:scale-105">
                  Shop All Crackers <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
           </>
        )}
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Browse by Category</h2>
        {isLoadingCategories ? (
          <div className="text-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
        ) : categoriesError ? (
          <p className="text-destructive text-center">Error: {categoriesError}</p>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {categories.map((category) => (
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
                      <h3 className="text-base sm:text-lg font-bold text-center font-headline text-primary-foreground group-hover:text-accent transition-colors mt-auto">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">No categories available.</p>
        )}
      </section>

      {/* Featured Products Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Featured Crackers</h2>
        {isLoadingProducts ? (
           <div className="text-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
        ) : productsError ? (
          <p className="text-destructive text-center col-span-full">Error: {productsError}</p>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center col-span-full">No featured products available.</p>
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

