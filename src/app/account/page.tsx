
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import type { Order, ShippingAddress, UserProfile } from '@/types';
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
import { Loader2, Package, User, AlertCircle, ShoppingBag, Eye, Home, Edit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import AddressForm from '@/components/account/AddressForm';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<Order['status'], string> = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Processing: 'bg-blue-100 text-blue-800 border-blue-300',
  Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Delivered: 'bg-green-100 text-green-800 border-green-300',
  Cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const AccountPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderErrorDetails, setOrderErrorDetails] = useState<string | null>(null);

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }
      setIsLoadingProfile(true);
      try {
        if (!db) throw new Error("Firestore database is not initialized.");
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // If no profile, create one with basic auth info
          const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          };
          await setDoc(userDocRef, newUserProfile);
          setUserProfile(newUserProfile);
        }
      } catch (e: any) {
        console.error("Failed to fetch user profile:", e);
        toast({ title: "Error", description: "Could not load profile information.", variant: "destructive" });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (!authLoading && user) {
      fetchUserProfile();
    } else if (!authLoading && !user) {
      setIsLoadingProfile(false);
    }
  }, [user, authLoading, toast]);


  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setIsLoadingOrders(false);
        return;
      }

      setIsLoadingOrders(true);
      setOrderError(null);
      setOrderErrorDetails(null);
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
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Ensure orderDate is a JS Date object
          const orderDate = data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(data.orderDate);
          fetchedOrders.push({ id: docSnap.id, ...data, orderDate } as Order);
        });
        setOrders(fetchedOrders);
      } catch (e: any) {
        console.error("Failed to fetch user orders:", e);
        if (e.code === 'failed-precondition' && e.message && e.message.toLowerCase().includes('index')) {
            setOrderError("A database index is required to display your orders.");
            setOrderErrorDetails("Please create the required Firestore index. The Firebase console typically provides a link to create this index in its error messages. The query involves filtering by 'userId' and ordering by 'orderDate' (descending) on the 'orders' collection.");
        } else if (e.code === 'permission-denied') {
            setOrderError("Permission Denied.");
            setOrderErrorDetails("You do not have permission to view these orders. Please check Firestore security rules for the 'orders' collection to ensure authenticated users can read their own orders.");
        } else {
            setOrderError(e.message || "Failed to load your orders.");
            setOrderErrorDetails("An unexpected error occurred. Please try again later.");
        }
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (!authLoading && user) {
      fetchOrders();
    } else if (!authLoading && !user) {
      setIsLoadingOrders(false);
    }
  }, [user, authLoading]);

  const handleSaveAddress = async (address: ShippingAddress) => {
    if (!user || !db) {
      toast({ title: "Error", description: "User not logged in or database not available.", variant: "destructive" });
      return false;
    }
    setIsSavingAddress(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { defaultShippingAddress: address });
      setUserProfile(prev => prev ? { ...prev, defaultShippingAddress: address } : null);
      toast({ title: "Success", description: "Default shipping address updated." });
      setIsAddressDialogOpen(false);
      return true;
    } catch (e: any) {
      console.error("Failed to save address:", e);
      toast({ title: "Error", description: e.message || "Could not save address.", variant: "destructive" });
      return false;
    } finally {
      setIsSavingAddress(false);
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading account details...</p>
      </div>
    );
  }

  if (!user) {
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
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {userProfile?.defaultShippingAddress ? 'Edit Default Shipping Address' : 'Add Default Shipping Address'}
            </DialogTitle>
            <DialogDescription>
              Set or update your preferred shipping address for faster checkouts.
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            initialData={userProfile?.defaultShippingAddress}
            onSubmitAddress={handleSaveAddress}
            isSubmitting={isSavingAddress}
            submitButtonText={userProfile?.defaultShippingAddress ? 'Update Address' : 'Save Address'}
          />
        </DialogContent>
      </Dialog>

      <h1 className="text-3xl font-bold font-headline">My Account</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <User className="mr-3 h-6 w-6 text-primary" /> Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong className="font-medium">Name:</strong> {userProfile?.displayName || user.displayName || 'N/A'}</p>
            <p><strong className="font-medium">Email:</strong> {userProfile?.email || user.email}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-xl font-headline">
              <Home className="mr-3 h-6 w-6 text-primary" /> Default Shipping Address
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsAddressDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> {userProfile?.defaultShippingAddress ? 'Edit' : 'Add'}
            </Button>
          </CardHeader>
          <CardContent className="text-sm">
            {isLoadingProfile ? (
              <p className="text-muted-foreground">Loading address...</p>
            ) : userProfile?.defaultShippingAddress ? (
              <div className="space-y-1">
                <p><strong>{userProfile.defaultShippingAddress.fullName}</strong></p>
                <p>{userProfile.defaultShippingAddress.email}</p>
                <p>{userProfile.defaultShippingAddress.addressLine1}</p>
                {userProfile.defaultShippingAddress.addressLine2 && <p>{userProfile.defaultShippingAddress.addressLine2}</p>}
                <p>{userProfile.defaultShippingAddress.city}, {userProfile.defaultShippingAddress.postalCode}</p>
                <p>{userProfile.defaultShippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No default shipping address set.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
          ) : orderError ? (
            <div className="text-destructive text-center py-10 space-y-2">
                <AlertCircle className="mx-auto h-10 w-10" />
                <p className="font-semibold">{orderError}</p>
                {orderErrorDetails && <p className="text-sm text-muted-foreground">{orderErrorDetails}</p>}
                <p className="text-xs text-muted-foreground mt-2">If this issue persists and involves an index, ensure the composite index for (userId ASC, orderDate DESC) on the 'orders' collection exists in Firestore.</p>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs hover:text-primary hover:underline">
                        <Link href={`/account/orders/${order.id}`}>
                          {order.id}
                        </Link>
                      </TableCell>
                      <TableCell>{format(order.orderDate, 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell className="text-right font-medium">₹{order.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${statusColors[order.status]} text-xs px-2 py-0.5 rounded-full`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild aria-label="View order details">
                          <Link href={`/account/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
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

