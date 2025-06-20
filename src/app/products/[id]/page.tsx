
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddToCartButton from './AddToCartButton';
import { Star, ShieldCheck } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

async function getProduct(id: string): Promise<Product | null> {
  try {
    console.log("Ganesan: ",APP_URL)
    const res = await fetch(`${APP_URL}/api/products/${id}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return null; // Product not found
      console.error(`Failed to fetch product ${id}:`, res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

async function getRelatedProducts(category: string, currentProductId: string): Promise<Product[]> {
  try {
    const res = await fetch(`${APP_URL}/api/products`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("Failed to fetch all products for related products:", res.status, await res.text());
      return [];
    }
    const allProducts: Product[] = await res.json();
    return allProducts
      .filter(p => p.category === category && p.id !== currentProductId)
      .slice(0, 4);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${APP_URL}/api/products`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("Failed to fetch products for generateStaticParams:", res.status, await res.text());
      return [];
    }
    const products: Product[] = await res.json();
    return products.map(product => ({
      id: product.id,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams fetching products:", error);
    return [];
  }
}


export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.id);

  return (
    <div className="space-y-12">
      <Card className="overflow-hidden shadow-xl rounded-lg border border-border/60">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 p-4 md:p-8">
          <div className="aspect-square md:aspect-auto relative overflow-hidden rounded-md shadow-md">
            <Image
              src={product.imageUrl}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 ease-in-out hover:scale-105"
              data-ai-hint={product.imageHint}
              priority
            />
          </div>
          <div className="flex flex-col justify-center">
            <CardHeader className="p-0 mb-4">
              <Badge variant="outline" className="w-fit mb-2 text-primary border-primary">{product.category}</Badge>
              <CardTitle className="text-3xl lg:text-4xl font-bold font-headline text-primary">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <CardDescription className="text-base text-muted-foreground leading-relaxed">{product.description}</CardDescription>
              
              <div className="flex items-center space-x-4">
                <p className="text-4xl font-bold text-primary font-headline">₹{product.price.toFixed(2)}</p>
                {product.rating && (
                  <div className="flex items-center text-lg text-amber-500">
                    {[...Array(Math.floor(product.rating))].map((_, i) => (
                        <Star key={`full-${i}`} className="w-5 h-5 fill-current" />
                    ))}
                    {product.rating % 1 !== 0 && <Star key="half" className="w-5 h-5" style={{ clipPath: 'inset(0 50% 0 0)'}} />} 
                    {[...Array(5 - Math.ceil(product.rating))].map((_, i) => (
                        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">({product.rating.toFixed(1)})</span>
                  </div>
                )}
              </div>

              {typeof product.stock === 'number' && product.stock > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  {product.stock > 10 ? "In Stock" : `Only ${product.stock} left!`}
                </p>
              )}
              {typeof product.stock === 'number' && product.stock === 0 && (
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              )}
               {typeof product.stock === 'undefined' && (
                <p className="text-sm text-muted-foreground font-medium">Stock information unavailable</p>
              )}


              <AddToCartButton product={product} />

              <div className="flex items-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                <ShieldCheck className="w-5 h-5 mr-2 text-green-500" />
                <span>Safe & Secure Checkout | Quality Guaranteed</span>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 font-headline text-center">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

