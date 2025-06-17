
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Order, CartItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Loader2, AlertTriangle, ArrowLeft, Package, User, Mail, MapPin, CalendarDays, DollarSign, ListOrdered, ShoppingBag } from 'lucide-react';

const statusColors: Record<Order['status'], string> = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Processing: 'bg-blue-100 text-blue-800 border-blue-300',
  Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Delivered: 'bg-green-100 text-green-800 border-green-300',
  Cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const UserOrderDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !orderId) {
        setIsLoading(false);
        if (!user && !authLoading) router.push('/login'); // Redirect if not logged in
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (!db) throw new Error("Firestore database is not initialized.");
        const orderDocRef = doc(db, 'orders', orderId);
        const orderDocSnap = await getDoc(orderDocRef);

        if (orderDocSnap.exists()) {
          const orderData = orderDocSnap.data() as Omit<Order, 'id' | 'orderDate'> & { orderDate: Timestamp };
          // Security check: ensure the order belongs to the current user
          if (orderData.userId !== user.uid) {
            setError("Access denied. You do not have permission to view this order.");
            setOrder(null);
          } else {
            setOrder({ 
              id: orderDocSnap.id, 
              ...orderData, 
              orderDate: orderData.orderDate.toDate() 
            } as Order);
          }
        } else {
          setError("Order not found.");
          setOrder(null);
        }
      } catch (e: any) {
        console.error("Failed to fetch order details:", e);
        setError(e.message || "Failed to load order details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
        fetchOrderDetails();
    }
  }, [orderId, user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/account')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Account
        </Button>
      </div>
    );
  }

  if (!order) {
    // This case should ideally be covered by error state, but as a fallback
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">The order you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => router.push('/account')} variant="outline">
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Account
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button onClick={() => router.push('/account')} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Order History
      </Button>

      <Card className="shadow-lg rounded-lg border-border/60">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl font-headline text-primary">Order Details</CardTitle>
              <CardDescription className="font-mono text-xs pt-1">ID: {order.id}</CardDescription>
            </div>
            <Badge variant="outline" className={`${statusColors[order.status]} text-sm px-3 py-1`}>
              Status: {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <CalendarDays className="mr-3 h-5 w-5 text-primary/80" />
                <div>
                  <p className="text-xs text-muted-foreground">Order Date</p>
                  <p className="font-medium">{format(order.orderDate, 'MMMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="mr-3 h-5 w-5 text-primary/80" />
                <div>
                  <p className="text-xs text-muted-foreground">Order Total</p>
                  <p className="font-medium text-lg text-primary">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
                <h3 className="text-md font-semibold mb-1 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary/80" />Shipping Address</h3>
                <div className="text-sm text-muted-foreground p-3 bg-muted/5 rounded-md border space-y-0.5">
                    <p><strong className="text-foreground">{order.shippingAddress.fullName}</strong></p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                    <div className="flex items-center pt-1">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-primary/70" />
                        <p>{order.shippingAddress.email}</p>
                    </div>
                </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-semibold mb-2 flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-primary/80" />Items Ordered</h3>
            <div className="border rounded-md">
              {order.items.map((item: CartItem) => (
                <div key={item.product.id} className="flex items-center space-x-4 p-3 border-b last:border-b-0">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden">
                    <Image 
                        src={item.product.imageUrl || 'https://placehold.co/80x80.png'} 
                        alt={item.product.name} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint={item.product.imageHint || 'product'}
                    />
                  </div>
                  <div className="flex-grow">
                    <Link href={`/products/${item.product.id}`} passHref>
                        <p className="font-medium hover:text-primary hover:underline">{item.product.name}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} &times; ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium text-primary">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/products" passHref>
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" /> Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOrderDetailsPage;
