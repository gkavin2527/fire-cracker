
"use client";

import { useState, useEffect } from 'react';
import type { Product, Category, CategoryFormData } from '@/types'; // Added CategoryFormData
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
import { Package, Users, ShoppingBag, PlusCircle, Loader2, LayoutGrid } from 'lucide-react'; // Added LayoutGrid for category icon
import AddProductForm from '@/components/admin/AddProductForm';
import AddCategoryForm from '@/components/admin/AddCategoryForm'; // Import AddCategoryForm
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; 
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'; // Added getDocs, query, orderBy for categories
import * as z from "zod";

const ProductFormSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  category: z.string().min(1, { message: "Please select a category." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(50, "Image hint should be brief, max 50 chars.").optional(),
  stock: z.coerce.number().int().min(0, { message: "Stock must be a non-negative integer." }).optional(),
});

const CategoryFormSchema = z.object({
  name: z.string().min(3, { message: "Category name must be at least 3 characters." }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with dashes, e.g., 'sky-shots'."),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }),
  imageHint: z.string().min(1, "Image hint is required.").max(50, "Image hint should be brief, max 50 chars."),
  iconName: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0, "Display order must be a non-negative integer.").optional(),
});


export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // State for categories
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true); // State for loading categories
  const [isSubmittingProduct, setIsSubmittingProduct] = useState<boolean>(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState<boolean>(false); // State for submitting category
  const [productError, setProductError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null); // State for category errors
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false); // State for category dialog
  const { toast } = useToast();

  const fetchAdminProducts = async () => {
    setIsLoadingProducts(true);
    setProductError(null);
    try {
      // Fetch products directly from Firestore
      if (!db) throw new Error("Firestore database is not initialized.");
      const productsCollectionRef = collection(db, 'products');
      const q = query(productsCollectionRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const fetchedProducts: Product[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(fetchedProducts);
    } catch (e: any) {
      console.error("Failed to fetch products for admin page:", e);
      setProductError(e.message || "Failed to load products.");
      toast({
        title: "Error Loading Products",
        description: e.message || "Could not fetch products from Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };
  
  const fetchAdminCategories = async () => {
    setIsLoadingCategories(true);
    setCategoryError(null);
    try {
       if (!db) throw new Error("Firestore database is not initialized.");
      const categoriesCollectionRef = collection(db, 'categories');
      const q = query(categoriesCollectionRef, orderBy('displayOrder', 'asc'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedCategories: Category[] = [];
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(fetchedCategories);
    } catch (e: any) {
      console.error("Failed to fetch categories for admin page:", e);
      setCategoryError(e.message || "Failed to load categories.");
      toast({
        title: "Error Loading Categories",
        description: e.message || "Could not fetch categories from Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };


  useEffect(() => {
    fetchAdminProducts();
    fetchAdminCategories();
  }, []);

  const handleAddProduct = async (productDataFromForm: Omit<Product, 'id' | 'rating'>) => {
    setIsSubmittingProduct(true);
    try {
      const validation = ProductFormSchema.safeParse(productDataFromForm);
      if (!validation.success) {
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
      };

      if (!db) {
        throw new Error("Firestore database is not initialized. Check Firebase configuration.");
      }
      
      const productsCollectionRef = collection(db, 'products');
      const docRef = await addDoc(productsCollectionRef, newProductData);
      
      toast({
        title: "Product Added!",
        description: `${newProductData.name} has been successfully added.`,
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
          errorMessage = e.message; 
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

  const handleAddCategory = async (categoryDataFromForm: CategoryFormData) => {
    setIsSubmittingCategory(true);
    try {
      const validation = CategoryFormSchema.safeParse(categoryDataFromForm);
      if (!validation.success) {
        const errorMessages = Object.values(validation.error.flatten().fieldErrors)
                                  .map(errArray => errArray?.join(', '))
                                  .filter(Boolean)
                                  .join('; ');
        throw new Error(`Invalid category data: ${errorMessages}`);
      }
      const validatedData = validation.data;

      if (!db) {
        throw new Error("Firestore database is not initialized. Check Firebase configuration.");
      }

      const categoriesCollectionRef = collection(db, 'categories');
      await addDoc(categoriesCollectionRef, validatedData);

      toast({
        title: "Category Added!",
        description: `${validatedData.name} has been successfully added.`,
      });
      setIsAddCategoryDialogOpen(false);
      fetchAdminCategories(); // Refresh category list (and potentially product form dependencies)
      return true;

    } catch (e: any)
     {
      console.error('Failed to add category directly to Firestore:', e);
      let errorMessage = e.message || "Could not save the category.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules.";
      } else if (e.message && e.message.includes('Invalid category data')) {
          errorMessage = e.message;
      }
      
      toast({
        title: "Error Adding Category",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmittingCategory(false);
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <LayoutGrid className="mr-2 h-5 w-5" /> Add New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Add New Category</DialogTitle>
              </DialogHeader>
              <AddCategoryForm
                onSubmitCategory={handleAddCategory}
                isSubmitting={isSubmittingCategory}
              />
            </DialogContent>
          </Dialog>

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

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <Package className="mr-3 h-6 w-6 text-primary" /> Product Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading products...</p>
              </div>
            ) : productError ? (
              <p className="text-destructive text-center py-10">Error loading products: {productError}</p>
            ) : products.length > 0 ? (
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] hidden sm:table-cell">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-xs hidden sm:table-cell">{product.id.substring(0,8)}...</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{product.stock ?? 'N/A'}</TableCell>
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

        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <LayoutGrid className="mr-3 h-6 w-6 text-primary" /> Category Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCategories ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading categories...</p>
              </div>
            ) : categoryError ? (
              <p className="text-destructive text-center py-10">Error loading categories: {categoryError}</p>
            ) : categories.length > 0 ? (
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="hidden sm:table-cell">Icon</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell className="hidden sm:table-cell">{category.iconName || 'N/A'}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{category.displayOrder ?? 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No categories found. Add some categories.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
