
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

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAdminProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: Product[] = await response.json();
        setProducts(data);
      } catch (e: any) {
        console.error("Failed to fetch products for admin page:", e);
        setError(e.message || "Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminProducts();
  }, []);

  const handleAddProduct = (newProduct: Omit<Product, 'id' | 'rating'>) => {
    // In a real app, this would send data to a backend to create the product.
    // For now, we'll just add to the local state and log. This part needs to be updated
    // in a future step to actually use a POST API endpoint to add products to Firestore.
    const mockId = `prod-${Date.now()}`;
    const productWithId: Product = { ...newProduct, id: mockId, rating: newProduct.rating || undefined, stock: newProduct.stock || 0 };
    setProducts(prevProducts => [...prevProducts, productWithId]);
    console.log('New Product Added (Mock):', productWithId);
    setIsAddProductDialogOpen(false); // Close dialog after adding
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
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
            <AddProductForm onSubmitProduct={handleAddProduct} />
          </DialogContent>
        </Dialog>
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
            <p className="text-muted-foreground text-center py-10">No products found. Add some products to get started!</p>
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
              This section will display user information once a backend and authentication are implemented.
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
              This section will display order information once a backend is integrated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
