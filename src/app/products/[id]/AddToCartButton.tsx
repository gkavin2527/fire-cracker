
"use client";

import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation'; // Import useRouter
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface AddToCartButtonProps {
  product: Product;
}

const AddToCartButton = ({ product }: AddToCartButtonProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth(); // Get user from AuthContext
  const router = useRouter(); // Get router instance
  const [quantity, setQuantity] = useState(1);

  const handleAddToCartClick = () => {
    if (!user) {
      router.push('/login'); // Redirect to login if not authenticated
    } else {
      addToCart(product, quantity);
      setQuantity(1); // Reset quantity after adding
    }
  };

  return (
    <div className="flex items-center space-x-3 mt-6">
      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
          className="h-10 w-10 rounded-r-none"
          disabled={!user} // Disable quantity controls if not logged in
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="h-10 w-16 text-center border-l-0 border-r-0 rounded-none focus-visible:ring-0"
          aria-label="Product quantity"
          disabled={!user} // Disable quantity input if not logged in
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuantity(q => q + 1)}
          aria-label="Increase quantity"
          className="h-10 w-10 rounded-l-none"
          disabled={!user} // Disable quantity controls if not logged in
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={handleAddToCartClick}
        size="lg"
        className="flex-grow bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={product.stock === 0 && !!user} // Keep disabled if out of stock and user is logged in
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {product.stock === 0 && !!user ? 'Out of Stock' : 'Add to Cart'}
      </Button>
    </div>
  );
};

export default AddToCartButton;
