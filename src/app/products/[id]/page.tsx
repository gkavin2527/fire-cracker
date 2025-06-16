import { getProductById } from '@/lib/mockData';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddToCartButton from './AddToCartButton';
import { Star, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { products as allProducts } from '@/lib/mockData';


export async function generateStaticParams() {
  // In a real app, fetch all product IDs
  return allProducts.map(product => ({
    id: product.id,
  }));
}


export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

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
                <p className="text-4xl font-bold text-primary font-headline">${product.price.toFixed(2)}</p>
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

              {product.stock && product.stock > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  {product.stock > 10 ? "In Stock" : `Only ${product.stock} left!`}
                </p>
              )}
              {product.stock === 0 && (
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
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
