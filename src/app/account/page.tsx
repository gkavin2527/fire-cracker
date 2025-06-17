
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Package, User, AlertCircle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const statusColors: Record<Order['status'], string> = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Processing: 'bg-blue-100 text-blue-800 border-blue-300',
  Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Delivered: 'bg-green-100 text-green-800 border-green-300',
  Cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const AccountPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setIsLoadingOrders(false);
        return;
      }

      setIsLoadingOrders(true);
      setError(null);
      try {
        if (!db) throw new Error("Firestore database is not initialized.");
        const ordersCollectionRef = collection(db, 'orders');
        const q = query(
          ordersCollectionRef,
          where('userId', '==', user.uid),
          orderBy('orderDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const orderDate = data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(data.orderDate);
          fetchedOrders.push({ id: doc.id, ...data, orderDate } as Order);
        });
        setOrders(fetchedOrders);
      } catch (e: any) {
        console.error("Failed to fetch user orders:", e);
        setError(e.message || "Failed to load your orders. Please ensure you have permissions to view them or try again later.");
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (!authLoading && user) {
      fetchOrders();
    } else if (!authLoading && !user) {
      // Should be caught by ProtectedPage, but good to handle
      setIsLoadingOrders(false);
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading account details...</p>
      </div>
    );
  }

  if (!user) {
    // This case should be handled by ProtectedPage redirecting to /login
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your account details.</p>
            <Link href="/login" passHref>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Go to Login
                </Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">My Account</h1>

      <Card className="shadow-md rounded-lg border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <User className="mr-3 h-6 w-6 text-primary" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong className="font-medium">Name:</strong> {user.displayName || 'N/A'}</p>
          <p><strong className="font-medium">Email:</strong> {user.email}</p>
          {/* Add more profile details or edit functionality later if needed */}
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-lg border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <Package className="mr-3 h-6 w-6 text-primary" /> Order History
          </CardTitle>
           <CardDescription>
            Here are the orders you&apos;ve placed with us.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="text-destructive text-center py-10 space-y-2">
                <AlertCircle className="mx-auto h-10 w-10" />
                <p className="font-semibold">Error Loading Orders</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs text-muted-foreground">Please check your internet connection or Firestore permissions for the 'orders' collection.</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] sm:w-[200px]">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    {/* <TableHead className="text-right">Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{format(order.orderDate, 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell className="text-right font-medium">${order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${statusColors[order.status]} text-xs px-2 py-0.5 rounded-full`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      {/*
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/account/orders/${order.id}`}>View</Link>
                        </Button>
                      </TableCell>
                      */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
                <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-2">No orders found.</p>
                <p className="text-sm text-muted-foreground mb-6">You haven&apos;t placed any orders yet. Time to shop!</p>
                <Link href="/products" passHref>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Shopping
                  </Button>
                </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;
