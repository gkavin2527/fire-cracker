
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle, Package, HomeIcon, MailIcon } from 'lucide-react';
import type { CartItem, ShippingAddress } from '@/types';
import Image from 'next/image';

interface OrderDetails {
  orderId: string;
  shippingDetails: ShippingAddress; // This now includes email
  items: CartItem[];
  total: number;
}

const OrderConfirmationPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOrder = sessionStorage.getItem('lastOrder');
      if (storedOrder) {
        const parsedOrder: OrderDetails = JSON.parse(storedOrder);
        if (parsedOrder.orderId === orderId) {
          setOrderDetails(parsedOrder);
        } else {
          router.replace('/'); 
        }
      } else {
        router.replace('/');
      }
    }
  }, [orderId, router]);

  if (!orderDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Package className="w-16 h-16 text-primary animate-bounce mb-4" />
        <p className="text-xl text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className="shadow-xl rounded-lg border-border/60">
        <CardHeader className="text-center bg-primary/5 rounded-t-lg p-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold font-headline text-primary">Thank You For Your Order!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Your order <span className="font-semibold text-primary">{orderDetails.orderId}</span> has been placed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline">Shipping To:</h3>
            <div className="text-muted-foreground text-sm p-4 bg-muted/50 rounded-md space-y-1">
              <p className="font-medium">{orderDetails.shippingDetails.fullName}</p>
              <p>{orderDetails.shippingDetails.addressLine1}</p>
              {orderDetails.shippingDetails.addressLine2 && <p>{orderDetails.shippingDetails.addressLine2}</p>}
              <p>{orderDetails.shippingDetails.city}, {orderDetails.shippingDetails.postalCode}</p>
              <p>{orderDetails.shippingDetails.country}</p>
              <div className="flex items-center pt-1">
                <MailIcon className="w-4 h-4 mr-2 text-primary/80" />
                <p>{orderDetails.shippingDetails.email}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline">Order Summary:</h3>
            <ul className="space-y-3">
              {orderDetails.items.map(item => (
                <li key={item.product.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center">
                     <div className="relative h-10 w-10 rounded-md overflow-hidden mr-3">
                      <Image src={item.product.imageUrl} alt={item.product.name} layout="fill" objectFit="cover" data-ai-hint={item.product.imageHint} />
                    </div>
                    <span>{item.product.name} (x{item.quantity})</span>
                  </div>
                  <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${orderDetails.total.toFixed(2)}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            You will receive an email confirmation shortly (content logged to console for this demo) with your order details.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/products" passHref>
              <Button variant="outline" className="w-full sm:w-auto">
                <Package className="mr-2 h-4 w-4" /> Continue Shopping
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
               <HomeIcon className="mr-2 h-4 w-4" /> Go to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderConfirmationPage;
