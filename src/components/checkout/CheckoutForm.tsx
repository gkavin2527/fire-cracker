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
import type { ShippingAddress } from "@/types";
import { Send } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
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

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });

  function onSubmit(values: CheckoutFormValues) {
    if (cartItems.length === 0) {
        toast({
            title: "Empty Cart",
            description: "Your cart is empty. Please add items before checking out.",
            variant: "destructive",
        });
        router.push('/products');
        return;
    }

    // Mock order creation
    const orderId = `CM-${Date.now()}`;
    const shippingDetails: ShippingAddress = { ...values };
    
    console.log("Order Placed:", {
      orderId,
      shippingDetails,
      items: cartItems,
      total: getCartTotal(),
    });
    
    onOrderPlaced(orderId, shippingDetails);
    clearCart();
    
    toast({
      title: "Order Placed!",
      description: `Your order ${orderId} has been successfully placed.`,
    });
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
                    <Input placeholder="John Doe" {...field} />
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
                    <Input placeholder="123 Main St" {...field} />
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
                    <Input placeholder="Apartment, studio, or floor" {...field} />
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
                      <Input placeholder="New York" {...field} />
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
                      <Input placeholder="10001" {...field} />
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
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="mr-2 h-5 w-5" /> Place Order
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground text-center">
        <p>This is a demo checkout. No real payment will be processed.</p>
      </CardFooter>
    </Card>
  );
};

export default CheckoutForm;
