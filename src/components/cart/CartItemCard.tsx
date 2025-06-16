"use client";

import Image from 'next/image';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { X, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

interface CartItemCardProps {
  item: CartItem;
}

const CartItemCard = ({ item }: CartItemCardProps) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center space-x-4 p-4 border-b border-border/60 bg-card rounded-md shadow-sm mb-4">
      <Link href={`/products/${item.product.id}`} passHref>
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-md overflow-hidden cursor-pointer">
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={item.product.imageHint}
          />
        </div>
      </Link>
      <div className="flex-grow">
        <Link href={`/products/${item.product.id}`} passHref>
           <h3 className="text-base sm:text-lg font-semibold font-headline hover:text-primary transition-colors">{item.product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">Price: ${item.product.price.toFixed(2)}</p>
        <div className="flex items-center mt-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input 
            type="number"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
            className="h-8 w-12 text-center mx-1 border-gray-300 focus-visible:ring-primary"
            aria-label="Item quantity"
          />
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="text-right">
        <p className="text-base sm:text-lg font-semibold text-primary">${(item.product.price * item.quantity).toFixed(2)}</p>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-destructive mt-1 h-8 w-8"
          onClick={() => removeFromCart(item.product.id)}
          aria-label="Remove item"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default CartItemCard;
