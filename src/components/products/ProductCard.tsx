
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full rounded-lg border border-border/60">
      <CardHeader className="p-0">
        <Link href={`/products/${product.id}`} passHref>
          <div className="aspect-[4/3] relative overflow-hidden group">
            <Image
              src={product.imageUrl}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="group-hover:scale-105 transition-transform duration-300 ease-in-out"
              data-ai-hint={product.imageHint}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/products/${product.id}`} passHref>
          <CardTitle className="text-lg font-headline mb-1 hover:text-primary transition-colors">{product.name}</CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden">{product.description.substring(0,60)}...</CardDescription>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xl font-bold text-primary font-headline">₹{product.price.toFixed(2)}</p>
          {product.rating && (
            <div className="flex items-center text-sm text-amber-500">
              <Star className="w-4 h-4 mr-1 fill-current" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => addToCart(product)} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

