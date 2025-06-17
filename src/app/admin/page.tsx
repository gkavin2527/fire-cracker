
"use client";

import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Package, Users, ShoppingBag, PlusCircle, Loader2 } from 'lucide-react';
import AddProductForm from '@/components/admin/AddProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore db instance
import { collection, addDoc } from 'firebase/firestore'; // Import Firestore functions
import * as z from "zod";

// ProductFormSchema moved here from API route for client-side validation before direct DB write
const ProductFormSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  category: z.string().min(1, { message: "Please select a category." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(50, "Image hint should be brief, max 50 chars.").optional(),
  stock: z.coerce.number().int().min(0, { message: "Stock must be a non-negative integer." }).optional(),
});


export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchAdminProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
            const responseText = await response.text();
            throw new Error(`Server returned non-JSON error (Status: ${response.status}): ${responseText.substring(0,100)}...`);
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (e: any) {
      console.error("Failed to fetch products for admin page:", e);
      setError(e.message || "Failed to load products.");
      toast({
        title: "Error Loading Products",
        description: e.message || "Could not fetch products from the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProducts();
  }, []);

  const handleAddProduct = async (productDataFromForm: Omit<Product, 'id' | 'rating'>) => {
    setIsSubmittingProduct(true);
    try {
      // Validate data using Zod schema (same as API route had)
      const validation = ProductFormSchema.safeParse(productDataFromForm);
      if (!validation.success) {
        // Construct an error message from Zod errors
        const errorMessages = Object.values(validation.error.flatten().fieldErrors)
                                  .map(errArray => errArray?.join(', '))
                                  .filter(Boolean)
                                  .join('; ');
        throw new Error(`Invalid product data: ${errorMessages}`);
      }
      
      const validatedData = validation.data;

      const newProductData: Omit<Product, 'id' | 'rating'> & { rating?: number } = {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        category: validatedData.category,
        imageUrl: validatedData.imageUrl || `https://placehold.co/400x300.png`,
        imageHint: validatedData.imageHint || validatedData.name.split(' ').slice(0,2).join(' ') || 'product image',
        stock: validatedData.stock ?? 0,
        // rating can be omitted or set to a default like 0 or null if desired
        // rating: 0, 
      };

      if (!db) {
        throw new Error("Firestore database is not initialized. Check Firebase configuration.");
      }
      
      const productsCollectionRef = collection(db, 'products');
      const docRef = await addDoc(productsCollectionRef, newProductData);

      const addedProduct: Product = { id: docRef.id, ...newProductData, rating: newProductData.rating ?? 0 }; // Add rating default if not present
      
      setProducts(prevProducts => [...prevProducts, addedProduct]);
      toast({
        title: "Product Added!",
        description: `${addedProduct.name} has been successfully added.`,
      });
      setIsAddProductDialogOpen(false);
      fetchAdminProducts(); // Refresh product list
      return true;

    } catch (e: any) {
      console.error('Failed to add product directly to Firestore:', e);
      let errorMessage = e.message || "Could not save the product.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules.";
      } else if (e.message && e.message.includes('Invalid product data')) {
          errorMessage = e.message; // Use the Zod validation error message
      }
      
      toast({
        title: "Error Adding Product",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmittingProduct(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Add New Product</DialogTitle>
              </DialogHeader>
              <AddProductForm
                onSubmitProduct={handleAddProduct}
                isSubmitting={isSubmittingProduct}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-md rounded-lg border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <Package className="mr-3 h-6 w-6 text-primary" /> Product Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading products...</p>
            </div>
          ) : error ? (
            <p className="text-destructive text-center py-10">Error loading products: {error}</p>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs">{product.id}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.stock ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No products found. Add some products.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <Users className="mr-3 h-6 w-6 text-primary" /> User Management (Placeholder)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will display user information once user roles and management features are implemented.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <ShoppingBag className="mr-3 h-6 w-6 text-primary" /> Order Management (Placeholder)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will display order information once a backend order processing system is integrated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
