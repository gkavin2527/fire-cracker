
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { ShippingAddress, OrderConfirmationEmailInput, Order, UserProfile, Product } from "@/types";
import { Send, Loader2 } from "lucide-react";
import { generateOrderConfirmationEmail } from "@/ai/flows/generate-order-confirmation-email-flow";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp, collection, getDoc, runTransaction } from 'firebase/firestore';

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  addressLine1: z.string().min(5, { message: "Address must be at least 5 characters." }),
  addressLine2: z.string().optional(),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  postalCode: z.string().min(4, { message: "Postal code must be at least 4 characters." }),
  country: z.string().min(2, { message: "Country must be at least 2 characters." }),
});

type CheckoutFormValues = z.infer<typeof formSchema>;

interface CheckoutFormProps {
  onOrderPlaced: (orderId: string, shippingDetails: ShippingAddress) => void;
}

const CheckoutForm = ({ onOrderPlaced }: CheckoutFormProps) => {
  const { getCartSubtotal, getShippingCost, getGrandTotal, cartItems, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth(); 
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });
  
  console.log('[CheckoutForm] Rendering. Auth loading:', authLoading, 'User present:', !!user, 'DB present:', !!db);

  useEffect(() => {
    console.log('[CheckoutForm] useEffect for default address triggered. Auth loading:', authLoading, 'User present:', !!user, 'DB present:', !!db);
    
    const fetchDefaultAddressAndPrefill = async () => {
      if (user && db) { // If user is logged in and DB is available
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userProfile = userDocSnap.data() as UserProfile;
            if (userProfile.defaultShippingAddress) {
              console.log('[CheckoutForm] Found default shipping address, resetting form:', userProfile.defaultShippingAddress);
              form.reset(userProfile.defaultShippingAddress); // This will set all fields including email
            } else if (user.email && !form.getValues().email) {
              // No default address, but user has an email and form email is not yet set
              console.log('[CheckoutForm] No default address, pre-filling email from auth:', user.email);
              form.setValue('email', user.email);
            }
          } else if (user.email && !form.getValues().email) {
            // No user profile document, but user has an email and form email is not yet set
            console.log('[CheckoutForm] No user profile doc, pre-filling email from auth:', user.email);
            form.setValue('email', user.email);
          }
        } catch (error: any) {
          console.error("[CheckoutForm] Failed to fetch default shipping address:", error);
          if (error.code === 'permission-denied') {
            toast({
              title: "Address Loading Issue",
              description: "Could not load your default address due to permissions. Firestore rules might need adjustment.",
              variant: "destructive",
              duration: 7000,
            });
          } else {
             toast({
              title: "Address Loading Error",
              description: "Could not load your default address. Please fill manually.",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      } else if (user && !db) { // User logged in, but DB not available
        console.error("[CheckoutForm] Firestore 'db' is not available. Cannot fetch default address.");
        toast({
            title: "Database Connection Error",
            description: "Cannot connect to the database to fetch your default address. Please try again later or fill manually.",
            variant: "destructive",
            duration: 7000,
        });
        if (user.email && !form.getValues().email) { // Still prefill email if possible
             console.log('[CheckoutForm] DB unavailable, but pre-filling email from auth:', user.email);
             form.setValue('email', user.email);
        }
      }
      // If user is not logged in (!user), the form will just use its default empty values after authLoading is false.
    };

    if (!authLoading) { // Only proceed if authentication check is complete
      fetchDefaultAddressAndPrefill();
    }
  }, [user, authLoading, form, toast, db]);


  async function onSubmit(values: CheckoutFormValues) {
    if (!db) {
      toast({ title: "Error", description: "Database not initialized. Please try again.", variant: "destructive" });
      setIsProcessingOrder(false);
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to place an order. Redirecting to login...",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    if (cartItems.length === 0) {
        toast({
            title: "Empty Cart",
            description: "Your cart is empty. Please add items before checking out.",
            variant: "destructive",
        });
        router.push('/products');
        return;
    }

    setIsProcessingOrder(true);

    const orderId = `GKC-${Date.now()}`; 
    const shippingDetails: ShippingAddress = { ...values };
    const subtotal = getCartSubtotal();
    const shippingCost = getShippingCost();
    const grandTotal = getGrandTotal();
    
    try {
      await runTransaction(db, async (transaction) => {
        const productUpdates = [];

        for (const cartItem of cartItems) {
          const productRef = doc(db, "products", cartItem.product.id);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            throw new Error(`Product ${cartItem.product.name} not found.`);
          }

          const productData = productDoc.data() as Product;
          if (typeof productData.stock !== 'number' || productData.stock < cartItem.quantity) {
            throw new Error(`Not enough stock for ${cartItem.product.name}. Available: ${productData.stock || 0}, Requested: ${cartItem.quantity}.`);
          }
          
          productUpdates.push({
            ref: productRef,
            newStock: productData.stock - cartItem.quantity,
          });
        }

        for (const update of productUpdates) {
          transaction.update(update.ref, { stock: update.newStock });
        }
      });

      const orderData: Order = {
        id: orderId,
        userId: user.uid,
        items: cartItems,
        shippingAddress: shippingDetails,
        subtotal: subtotal,
        shippingCost: shippingCost,
        grandTotal: grandTotal,
        orderDate: Timestamp.now(), 
        status: 'Pending',
      };
      
      const ordersCollectionRef = collection(db, 'orders');
      await setDoc(doc(ordersCollectionRef, orderId), orderData);
      
      toast({
        title: "Order Placed & Stock Updated!",
        description: `Your order ${orderId} is confirmed. Preparing confirmation email...`,
      });

    } catch (error: any) {
      console.error("Failed to process order (stock check or Firestore save):", error);
      let description = error.message || "Could not process your order. Please review your cart or try again.";
      if (error.code === 'permission-denied') {
        description = "Permission denied while trying to place your order. This could be related to reading product stock, updating stock, or saving the order. Please check your Firestore security rules.";
      }
      toast({
        title: "Order Processing Failed",
        description,
        variant: "destructive",
        duration: 9000,
      });
      setIsProcessingOrder(false);
      return; 
    }
    
    try {
      const emailInput: OrderConfirmationEmailInput = {
        customerName: shippingDetails.fullName,
        customerEmail: shippingDetails.email,
        orderId: orderId,
        items: cartItems.map(item => ({ 
          name: item.product.name, 
          quantity: item.quantity, 
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          imageHint: item.product.imageHint || 'product',
        })),
        subtotal: subtotal,
        shippingCost: shippingCost,
        grandTotal: grandTotal,
        shippingAddress: {
          fullName: shippingDetails.fullName,
          addressLine1: shippingDetails.addressLine1,
          addressLine2: shippingDetails.addressLine2,
          city: shippingDetails.city,
          postalCode: shippingDetails.postalCode,
          country: shippingDetails.country,
        },
        shopName: "GK Crackers",
        shopUrl: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'),
      };

      const emailContent = await generateOrderConfirmationEmail(emailInput);
      
      console.log(`[CheckoutForm] Generated email for order ${orderId}. Attempting to send via API.`);
      const emailApiResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: shippingDetails.email,
          subject: emailContent.subject,
          htmlBody: emailContent.htmlBody,
        }),
      });

      if (!emailApiResponse.ok) {
        const errorData = await emailApiResponse.json();
        const apiError = new Error(errorData.error || `Failed to send email via API (status: ${emailApiResponse.status})`);
        (apiError as any).details = errorData.details;
        (apiError as any).code = errorData.code; 
        throw apiError;
      }
        
      const emailResponseData = await emailApiResponse.json();
      console.log(`[CheckoutForm] Email API response for order ${orderId}:`, emailResponseData);
      toast({
        title: "Order Confirmation Sent",
        description: `Email sent to ${shippingDetails.email}. Message ID: ${emailResponseData.messageId}`,
      });

    } catch (emailError: any) {
      console.error("[CheckoutForm] Failed to generate or send order confirmation email:", emailError);
      const description = `Could not send order confirmation email for ${orderId}. Your order was saved. Details: ${emailError.message || 'Unknown email error.'}${emailError.code ? ` (Code: ${emailError.code})` : ''}`;
      toast({
        title: "Email Sending Issue",
        description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
        variant: "destructive",
        duration: 7000,
      });
    }

    onOrderPlaced(orderId, shippingDetails); 
    clearCart(); 
    
    setIsProcessingOrder(false);
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl rounded-lg border-border/60">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center">Shipping Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isProcessingOrder || authLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email for Shipping</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isProcessingOrder || authLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} disabled={isProcessingOrder || authLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apartment, studio, or floor" {...field} disabled={isProcessingOrder || authLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} disabled={isProcessingOrder || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} disabled={isProcessingOrder || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} disabled={isProcessingOrder || authLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isProcessingOrder || authLoading || !cartItems.length || !user}>
              {isProcessingOrder ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" /> Place Order
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground text-center">
        <p>This is a demo checkout. No real payment will be processed. Stock will be updated. Order confirmation email will be attempted via an API route (requires SMTP .env configuration). Orders will be saved to Firestore.</p>
      </CardFooter>
    </Card>
  );
};

export default CheckoutForm;

