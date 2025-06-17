
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
import { Package, Users, ShoppingBag, PlusCircle, Loader2, DatabaseZap } from 'lucide-react';
import AddProductForm from '@/components/admin/AddProductForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
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

  const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'rating'>) => {
    setIsSubmittingProduct(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProductData),
      });

      if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (jsonError) {
            const responseText = await response.text();
            throw new Error(`Server returned non-JSON error (Status: ${response.status}): ${responseText.substring(0,100)}...`);
        }
        throw new Error(errorData.error || `Failed to add product. Status: ${response.status}`);
      }

      const addedProduct: Product = await response.json();
      setProducts(prevProducts => [...prevProducts, addedProduct]);
      toast({
        title: "Product Added!",
        description: `${addedProduct.name} has been successfully added.`,
      });
      setIsAddProductDialogOpen(false); 
      fetchAdminProducts(); // Refresh product list
      return true; 
    } catch (e: any) {
      console.error('Failed to add product:', e);
      toast({
        title: "Error Adding Product",
        description: e.message || "Could not save the product to the server.",
        variant: "destructive",
      });
      return false; 
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/seed-database', {
        method: 'POST',
      });
      
      let result;
      try {
        result = await response.json();
      } catch (jsonError: any) {
        // If response is not JSON, try to get text for more context
        const responseText = await response.text();
        throw new Error(`Failed to parse seed response as JSON (Status: ${response.status}). Response body: ${responseText.substring(0, 200)}...`);
      }

      if (!response.ok) {
        // Use error and details from JSON response if available
        const errorMessage = result.error || `Failed to seed database. Status: ${response.status}`;
        const errorDetails = result.details ? `Details: ${result.details}` : '';
        throw new Error(`${errorMessage} ${errorDetails}`.trim());
      }

      toast({
        title: "Database Seeding Successful!",
        description: `Seeded ${result.categoriesSeeded} categories and ${result.productsSeeded} products.`,
      });
      fetchAdminProducts(); // Refresh product list
    } catch (e: any) {
      console.error('Database seeding failed:', e);
      toast({
        title: "Database Seeding Failed",
        description: e.message || "An unknown error occurred during seeding.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
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
          <Button 
            onClick={handleSeedDatabase} 
            disabled={isSeeding}
            variant="outline"
            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          >
            {isSeeding ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <DatabaseZap className="mr-2 h-5 w-5" />
            )}
            Seed Database from Mocks
          </Button>
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
            <p className="text-muted-foreground text-center py-10">No products found. Add some products or seed the database.</p>
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
