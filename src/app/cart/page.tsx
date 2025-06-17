
"use client";

import { useCart } from '@/contexts/CartContext';
import CartItemCard from '@/components/cart/CartItemCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react';

const CartPage = () => {
  const { cartItems, getCartSubtotal, getShippingCost, getGrandTotal, clearCart, getItemCount } = useCart();
  const subtotal = getCartSubtotal();
  const shippingCost = getShippingCost();
  const grandTotal = getGrandTotal();
  const itemCount = getItemCount();

  if (itemCount === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4 font-headline">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added any crackers yet. Time to explore!</p>
        <Link href="/products" passHref>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 font-headline text-center">Your Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItemCard key={item.product.id} item={item} />
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20 shadow-lg rounded-lg border-border/60">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({itemCount} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <hr className="my-2 border-border/60"/>
              <div className="flex justify-between text-xl font-bold">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Link href="/checkout" passHref className="w-full">
                <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" onClick={clearCart} className="w-full text-destructive border-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
