
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
import type { ShippingAddress, OrderConfirmationEmailInput, Order } from "@/types";
import { Send, Loader2 } from "lucide-react";
import { generateOrderConfirmationEmail } from "@/ai/flows/generate-order-confirmation-email-flow";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from '@/lib/firebase';
import { doc, setDoc, Timestamp, collection } from 'firebase/firestore';

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
  const { getCartTotal, cartItems, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth(); // Get the authenticated user
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

  async function onSubmit(values: CheckoutFormValues) {
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

    const orderId = `CM-${Date.now()}`;
    const shippingDetails: ShippingAddress = { ...values };
    
    const orderData: Order = {
      id: orderId,
      userId: user.uid,
      items: cartItems,
      shippingAddress: shippingDetails,
      totalAmount: getCartTotal(),
      orderDate: Timestamp.now(), // Use Firestore Timestamp for server-side consistency
      status: 'Pending',
    };

    try {
      if (!db) {
        throw new Error("Firestore database is not initialized. Check Firebase configuration.");
      }
      // Save order to Firestore
      const ordersCollectionRef = collection(db, 'orders');
      await setDoc(doc(ordersCollectionRef, orderId), orderData);
      
      toast({
        title: "Order Saved!",
        description: `Your order ${orderId} has been saved to the database.`,
      });

    } catch (dbError: any) {
      console.error("Failed to save order to Firestore:", dbError);
      toast({
        title: "Database Error",
        description: `Could not save your order: ${dbError.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
      setIsProcessingOrder(false);
      return; // Stop processing if database save fails
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
          imageHint: item.product.imageHint,
        })),
        totalAmount: getCartTotal(),
        shippingAddress: {
          fullName: shippingDetails.fullName,
          addressLine1: shippingDetails.addressLine1,
          addressLine2: shippingDetails.addressLine2,
          city: shippingDetails.city,
          postalCode: shippingDetails.postalCode,
          country: shippingDetails.country,
        },
        shopName: "CrackleMart",
        shopUrl: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'),
      };

      const emailContent = await generateOrderConfirmationEmail(emailInput);
      console.log("Generated Order Confirmation Email Content:");
      console.log("Subject:", emailContent.subject);
      console.log("HTML Body:", emailContent.htmlBody);
      toast({
        title: "Email Generated (Logged)",
        description: "Order confirmation email content generated and logged to console.",
      });

    } catch (emailError) {
      console.error("Failed to generate order confirmation email:", emailError);
      toast({
        title: "Email Generation Failed",
        description: "Could not generate the order confirmation email. Order was still placed and saved.",
        variant: "destructive",
      });
    }

    onOrderPlaced(orderId, shippingDetails); 
    clearCart(); 
    
    // This toast might be redundant if the "Order Saved!" toast is sufficient
    // toast({
    //   title: "Order Placed!",
    //   description: `Your order ${orderId} has been successfully processed.`,
    // });

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
                    <Input placeholder="John Doe" {...field} disabled={isProcessingOrder} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isProcessingOrder} />
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
                    <Input placeholder="123 Main St" {...field} disabled={isProcessingOrder} />
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
                    <Input placeholder="Apartment, studio, or floor" {...field} disabled={isProcessingOrder} />
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
                      <Input placeholder="New York" {...field} disabled={isProcessingOrder} />
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
                      <Input placeholder="10001" {...field} disabled={isProcessingOrder} />
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
                    <Input placeholder="United States" {...field} disabled={isProcessingOrder} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isProcessingOrder || !cartItems.length || !user}>
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
        <p>This is a demo checkout. No real payment will be processed. Email content will be logged to the console. Orders will be saved to Firestore.</p>
      </CardFooter>
    </Card>
  );
};

export default CheckoutForm;
