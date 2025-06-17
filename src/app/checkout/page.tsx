
"use client";

import CheckoutForm from '@/components/checkout/CheckoutForm';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { ShippingAddress } from '@/types';

const CheckoutPage = () => {
  const { cartItems, getCartSubtotal, getShippingCost, getGrandTotal } = useCart();
  const router = useRouter();

  const subtotal = getCartSubtotal();
  const shippingCost = getShippingCost();
  const grandTotal = getGrandTotal();

  const handleOrderPlaced = (orderId: string, shippingDetails: ShippingAddress) => {
    // Store order details in session/local storage to display on confirmation page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastOrder', JSON.stringify({ 
        orderId, 
        shippingDetails, 
        items: cartItems, 
        subtotal,
        shippingCost,
        grandTotal 
      }));
    }
    router.push(`/order-confirmation/${orderId}`);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 font-headline">Checkout</h1>
        <CheckoutForm onOrderPlaced={handleOrderPlaced} />
      </div>
      <div className="md:sticky md:top-20">
        <Card className="shadow-lg rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Your Order</CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length > 0 ? (
              <ul className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2"> {/* Adjusted max-h */}
                {cartItems.map(item => (
                  <li key={item.product.id} className="flex items-center space-x-3 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden">
                      <Image src={item.product.imageUrl} alt={item.product.name} layout="fill" objectFit="cover" data-ai-hint={item.product.imageHint} />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-primary">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Your cart is empty.</p>
            )}
            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping:</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <hr className="my-1 border-border/40"/>
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total:</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
