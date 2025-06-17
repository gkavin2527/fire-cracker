
"use client";

import { useState, useEffect } from 'react';
import type { Product, Category, CategoryFormData, ProductFormData, Order, HeroImage, HeroImageFormData } from '@/types';
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
import { Package, Users, ShoppingBag, PlusCircle, Loader2, LayoutGrid, Trash2, Edit3, ListOrdered, Image as ImageIcon, Check, X } from 'lucide-react';
import AddProductForm from '@/components/admin/AddProductForm';
import AddCategoryForm from '@/components/admin/AddCategoryForm';
import AddHeroImageForm from '@/components/admin/AddHeroImageForm';
import OrderDetailsDialog from '@/components/admin/OrderDetailsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; 
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore'; 
import * as z from "zod";
import { format } from 'date-fns';
import Image from 'next/image'; // For displaying hero image previews

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
  displayOrder: z.coerce.number().int().min(0, "Display order must be a non-negative integer.").optional(),
});

const HeroImageFormSchema = z.object({
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }),
  altText: z.string().min(3, { message: "Alt text must be at least 3 characters." }),
  dataAiHint: z.string().min(1, "AI hint is required.").max(50, "AI hint should be brief, max 50 chars."),
  displayOrder: z.coerce.number().int().min(0, { message: "Display order must be a non-negative integer." }),
  isActive: z.boolean().default(true),
  linkUrl: z.string().url({ message: "Please enter a valid URL or leave empty." }).optional().or(z.literal('')),
});


export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true); 
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isLoadingHeroImages, setIsLoadingHeroImages] = useState<boolean>(true);

  const [isSubmittingProduct, setIsSubmittingProduct] = useState<boolean>(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState<boolean>(false); 
  const [isSubmittingHeroImage, setIsSubmittingHeroImage] = useState<boolean>(false);
  
  const [productError, setProductError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null); 
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [heroImageError, setHeroImageError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [heroImageToDelete, setHeroImageToDelete] = useState<HeroImage | null>(null);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const [editingHeroImage, setEditingHeroImage] = useState<HeroImage | null>(null);
  const [isHeroImageFormOpen, setIsHeroImageFormOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsDialogOpen, setIsOrderDetailsDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);


  const fetchAdminProducts = async () => {
    setIsLoadingProducts(true);
    setProductError(null);
    try {
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
      let errorMessage = e.message || "Failed to load products.";
      if (e.code === 'permission-denied') {
        errorMessage = "Permission denied. Check Firestore security rules for 'products' collection (admin read access).";
      }
      setProductError(errorMessage);
      toast({
        title: "Error Loading Products",
        description: errorMessage,
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
      let errorMessage = e.message || "Failed to load categories.";
       if (e.code === 'permission-denied') {
        errorMessage = "Permission denied. Check Firestore security rules for 'categories' collection (admin read access).";
      }
      setCategoryError(errorMessage);
      toast({
        title: "Error Loading Categories",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchAdminOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      if (!db) throw new Error("Firestore database is not initialized.");
      const ordersCollectionRef = collection(db, 'orders');
      const q = query(ordersCollectionRef, orderBy('orderDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const orderDate = data.orderDate instanceof Timestamp ? data.orderDate.toDate() : new Date(data.orderDate);
        fetchedOrders.push({ id: doc.id, ...data, orderDate } as Order);
      });
      setOrders(fetchedOrders);
    } catch (e: any) {
      console.error("Failed to fetch orders for admin page:", e);
      let errorMessage = e.message || "Failed to load orders.";
       if (e.code === 'permission-denied') {
        errorMessage = "Permission denied. Check Firestore security rules for 'orders' collection (admin read access).";
      }
      setOrdersError(errorMessage);
      toast({
        title: "Error Loading Orders",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchHeroImages = async () => {
    setIsLoadingHeroImages(true);
    setHeroImageError(null);
    try {
      if (!db) throw new Error("Firestore database is not initialized.");
      const heroImagesCollectionRef = collection(db, 'heroImages');
      const q = query(heroImagesCollectionRef, orderBy('displayOrder', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedHeroImages: HeroImage[] = [];
      querySnapshot.forEach((doc) => {
        fetchedHeroImages.push({ id: doc.id, ...doc.data() } as HeroImage);
      });
      setHeroImages(fetchedHeroImages);
    } catch (e: any) {
      console.error("Failed to fetch hero images for admin page:", e);
      let errorMessage = e.message || "Failed to load hero images.";
       if (e.code === 'permission-denied') {
        errorMessage = "Permission denied. Check Firestore security rules for 'heroImages' collection (admin read access).";
      } else if (e.code === 'failed-precondition' && e.message.toLowerCase().includes('index')) {
        errorMessage = "Database index missing for hero images. Please create an index on 'displayOrder' (ASC) in the 'heroImages' collection."
      }
      setHeroImageError(errorMessage);
      toast({
        title: "Error Loading Hero Images",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingHeroImages(false);
    }
  };


  useEffect(() => {
    fetchAdminProducts();
    fetchAdminCategories();
    fetchAdminOrders();
    fetchHeroImages();
  }, []);

  const handleAddProduct = async (productDataFromForm: ProductFormData) => {
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
      const newProductData: ProductFormData & { rating?: number } = {
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
      await addDoc(productsCollectionRef, newProductData);
      
      toast({
        title: "Product Added!",
        description: `${newProductData.name} has been successfully added.`,
      });
      setIsProductFormOpen(false);
      fetchAdminProducts(); 
      return true;

    } catch (e: any) {
      console.error('Failed to add product directly to Firestore:', e);
      let errorMessage = e.message || "Could not save the product.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules for 'products' collection (admin write access).";
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

  const handleUpdateProduct = async (productId: string, productDataFromForm: ProductFormData) => {
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

      if (!db) {
        throw new Error("Firestore database is not initialized. Check Firebase configuration.");
      }

      const productDocRef = doc(db, 'products', productId);
      await updateDoc(productDocRef, { ...validatedData }); 

      toast({
        title: "Product Updated!",
        description: `${validatedData.name} has been successfully updated.`,
      });
      setIsProductFormOpen(false);
      setEditingProduct(null);
      fetchAdminProducts(); 
      return true;

    } catch (e: any) {
      console.error('Failed to update product in Firestore:', e);
      let errorMessage = e.message || "Could not update the product.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules for 'products' collection (admin write access).";
      } else if (e.message && e.message.includes('Invalid product data')) {
          errorMessage = e.message;
      }
      
      toast({
        title: "Error Updating Product",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleProductFormSubmit = async (values: ProductFormData) => {
    if (editingProduct) {
      return handleUpdateProduct(editingProduct.id, values);
    } else {
      return handleAddProduct(values);
    }
  };

  const openProductForm = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleAddNewCategory = async (categoryDataFromForm: CategoryFormData) => {
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
      setIsCategoryFormOpen(false);
      fetchAdminCategories(); 
      return true;

    } catch (e: any) {
      console.error('Failed to add category directly to Firestore:', e);
      let errorMessage = e.message || "Could not save the category.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules for 'categories' collection (admin write access).";
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

  const handleUpdateCategory = async (categoryId: string, categoryDataFromForm: CategoryFormData) => {
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

      const categoryDocRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryDocRef, { ...validatedData });

      toast({
        title: "Category Updated!",
        description: `${validatedData.name} has been successfully updated.`,
      });
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
      fetchAdminCategories(); 
      return true;

    } catch (e: any) {
      console.error('Failed to update category in Firestore:', e);
      let errorMessage = e.message || "Could not update the category.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules for 'categories' collection (admin write access).";
      } else if (e.message && e.message.includes('Invalid category data')) {
          errorMessage = e.message;
      }
      
      toast({
        title: "Error Updating Category",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmittingCategory(false);
    }
  };
  
  const handleCategoryFormSubmit = async (values: CategoryFormData) => {
    if (editingCategory) {
      return handleUpdateCategory(editingCategory.id, values);
    } else {
      return handleAddNewCategory(values);
    }
  };

  const openCategoryForm = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };


  const handleDeleteProduct = async () => {
    if (!productToDelete || !db) {
      toast({
        title: "Deletion Error",
        description: "No product selected for deletion or database not initialized.",
        variant: "destructive",
      });
      return;
    }

    try {
      const productDocRef = doc(db, 'products', productToDelete.id);
      await deleteDoc(productDocRef);
      toast({
        title: "Product Deleted",
        description: `${productToDelete.name} has been successfully deleted.`,
      });
      setProductToDelete(null); 
      fetchAdminProducts(); 
    } catch (e: any) {
      console.error('Failed to delete product:', e);
      let errorMessage = e.message || "Could not delete the product.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules for 'products' collection (admin delete access).";
      }
      toast({
        title: "Error Deleting Product",
        description: errorMessage,
        variant: "destructive",
      });
      setProductToDelete(null); 
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete || !db) {
      toast({
        title: "Deletion Error",
        description: "No category selected for deletion or database not initialized.",
        variant: "destructive",
      });
      return;
    }

    try {
      const categoryDocRef = doc(db, 'categories', categoryToDelete.id);
      await deleteDoc(categoryDocRef);
      toast({
        title: "Category Deleted",
        description: `${categoryToDelete.name} has been successfully deleted.`,
      });
      setCategoryToDelete(null); 
      fetchAdminCategories(); 
    } catch (e: any) {
      console.error('Failed to delete category:', e);
      let errorMessage = e.message || "Could not delete the category.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules for 'categories' collection (admin delete access).";
      }
      toast({
        title: "Error Deleting Category",
        description: errorMessage,
        variant: "destructive",
      });
      setCategoryToDelete(null); 
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsDialogOpen(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setIsOrderDetailsDialogOpen(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!db) {
      toast({ title: "Database Error", description: "Firestore not initialized.", variant: "destructive" });
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, { status: newStatus });
      toast({ title: "Order Status Updated", description: `Order ${orderId} status changed to ${newStatus}.` });
      fetchAdminOrders(); 
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (e: any) {
      console.error('Failed to update order status:', e);
      let errorMessage = e.message || "Could not update order status.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Firestore permission denied. Check your Firestore security rules for 'orders' collection (admin update access).";
      }
      toast({ title: "Error Updating Status", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Hero Image Handlers
  const handleAddHeroImage = async (heroImageData: HeroImageFormData) => {
    setIsSubmittingHeroImage(true);
    try {
      const validation = HeroImageFormSchema.safeParse(heroImageData);
      if (!validation.success) {
        const errorMessages = Object.values(validation.error.flatten().fieldErrors)
                                  .map(errArray => errArray?.join(', '))
                                  .filter(Boolean)
                                  .join('; ');
        throw new Error(`Invalid hero image data: ${errorMessages}`);
      }
      const validatedData = validation.data;
      if (!db) throw new Error("Firestore database not initialized.");
      const heroImagesCollectionRef = collection(db, 'heroImages');
      await addDoc(heroImagesCollectionRef, validatedData);
      toast({ title: "Hero Image Added!", description: `${validatedData.altText} has been added.` });
      setIsHeroImageFormOpen(false);
      fetchHeroImages();
      return true;
    } catch (e: any) {
      console.error("Failed to add hero image:", e);
      let errorMessage = e.message || "Could not save hero image.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Permission denied. Check Firestore rules for 'heroImages' (admin write).";
      }
      toast({ title: "Error Adding Hero Image", description: errorMessage, variant: "destructive" });
      return false;
    } finally {
      setIsSubmittingHeroImage(false);
    }
  };

  const handleUpdateHeroImage = async (heroImageId: string, heroImageData: HeroImageFormData) => {
    setIsSubmittingHeroImage(true);
    try {
      const validation = HeroImageFormSchema.safeParse(heroImageData);
       if (!validation.success) {
        const errorMessages = Object.values(validation.error.flatten().fieldErrors)
                                  .map(errArray => errArray?.join(', '))
                                  .filter(Boolean)
                                  .join('; ');
        throw new Error(`Invalid hero image data: ${errorMessages}`);
      }
      const validatedData = validation.data;
      if (!db) throw new Error("Firestore database not initialized.");
      const heroImageDocRef = doc(db, 'heroImages', heroImageId);
      await updateDoc(heroImageDocRef, { ...validatedData });
      toast({ title: "Hero Image Updated!", description: `${validatedData.altText} has been updated.` });
      setIsHeroImageFormOpen(false);
      setEditingHeroImage(null);
      fetchHeroImages();
      return true;
    } catch (e: any) {
      console.error("Failed to update hero image:", e);
      let errorMessage = e.message || "Could not update hero image.";
       if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Permission denied. Check Firestore rules for 'heroImages' (admin write).";
      }
      toast({ title: "Error Updating Hero Image", description: errorMessage, variant: "destructive" });
      return false;
    } finally {
      setIsSubmittingHeroImage(false);
    }
  };

  const handleHeroImageFormSubmit = async (values: HeroImageFormData) => {
    if (editingHeroImage) {
      return handleUpdateHeroImage(editingHeroImage.id, values);
    } else {
      return handleAddHeroImage(values);
    }
  };
  
  const openHeroImageForm = (heroImage: HeroImage | null = null) => {
    setEditingHeroImage(heroImage);
    setIsHeroImageFormOpen(true);
  };

  const handleConfirmDeleteHeroImage = async () => {
    if (!heroImageToDelete || !db) {
      toast({ title: "Deletion Error", description: "No hero image selected or DB error.", variant: "destructive" });
      return;
    }
    try {
      const heroImageDocRef = doc(db, 'heroImages', heroImageToDelete.id);
      await deleteDoc(heroImageDocRef);
      toast({ title: "Hero Image Deleted", description: `${heroImageToDelete.altText} deleted.` });
      setHeroImageToDelete(null);
      fetchHeroImages();
    } catch (e: any) {
      console.error("Failed to delete hero image:", e);
      let errorMessage = e.message || "Could not delete hero image.";
      if (e.code && e.code.startsWith('permission-denied')) {
          errorMessage = "Permission denied. Check Firestore rules for 'heroImages' (admin delete).";
      }
      toast({ title: "Error Deleting Hero Image", description: errorMessage, variant: "destructive" });
      setHeroImageToDelete(null);
    }
  };


  return (
    <div className="space-y-8">
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              "{productToDelete?.name}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              "{categoryToDelete?.name}" from the database. Deleting a category does not delete products associated with it; those must be reassigned or deleted separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteCategory} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!heroImageToDelete} onOpenChange={(open) => !open && setHeroImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this hero image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the hero image
              "{heroImageToDelete?.altText}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHeroImageToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteHeroImage} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Hero Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          isOpen={isOrderDetailsDialogOpen}
          onClose={closeOrderDetails}
          onUpdateStatus={handleUpdateOrderStatus}
          isUpdatingStatus={isUpdatingStatus}
        />
      )}

      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isHeroImageFormOpen} onOpenChange={(isOpen) => {
              setIsHeroImageFormOpen(isOpen);
              if (!isOpen) setEditingHeroImage(null); 
            }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => openHeroImageForm()}>
                <ImageIcon className="mr-2 h-5 w-5" /> Add Hero Image
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingHeroImage ? 'Edit Hero Image' : 'Add New Hero Image'}</DialogTitle>
              </DialogHeader>
              <AddHeroImageForm
                onSubmitHeroImage={handleHeroImageFormSubmit}
                isSubmitting={isSubmittingHeroImage}
                initialData={editingHeroImage || undefined}
                isEditing={!!editingHeroImage}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isCategoryFormOpen} onOpenChange={(isOpen) => {
              setIsCategoryFormOpen(isOpen);
              if (!isOpen) setEditingCategory(null); 
            }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => openCategoryForm()}>
                <LayoutGrid className="mr-2 h-5 w-5" /> Add New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              </DialogHeader>
              <AddCategoryForm
                onSubmitCategory={handleCategoryFormSubmit}
                isSubmitting={isSubmittingCategory}
                initialData={editingCategory ? { name: editingCategory.name, slug: editingCategory.slug, imageUrl: editingCategory.imageUrl, imageHint: editingCategory.imageHint, displayOrder: editingCategory.displayOrder } : undefined}
                isEditing={!!editingCategory}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isProductFormOpen} onOpenChange={(isOpen) => {
              setIsProductFormOpen(isOpen);
              if (!isOpen) setEditingProduct(null);
            }}>
            <DialogTrigger asChild>
               <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => openProductForm()}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <AddProductForm
                onSubmitProduct={handleProductFormSubmit}
                isSubmitting={isSubmittingProduct}
                initialData={editingProduct ? { 
                    name: editingProduct.name, 
                    description: editingProduct.description, 
                    price: editingProduct.price, 
                    category: editingProduct.category, 
                    imageUrl: editingProduct.imageUrl, 
                    imageHint: editingProduct.imageHint, 
                    stock: editingProduct.stock 
                } : undefined}
                isEditing={!!editingProduct}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Hero Image Management Card */}
      <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <ImageIcon className="mr-3 h-6 w-6 text-primary" /> Hero Image Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHeroImages ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading hero images...</p>
              </div>
            ) : heroImageError ? (
              <p className="text-destructive text-center py-10">Error: {heroImageError}</p>
            ) : heroImages.length > 0 ? (
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Preview</TableHead>
                      <TableHead>Alt Text</TableHead>
                      <TableHead className="text-center">Order</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                      <TableHead>Link URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heroImages.map((img) => (
                      <TableRow key={img.id}>
                        <TableCell>
                          <div className="relative h-12 w-20 rounded-md overflow-hidden">
                            <Image src={img.imageUrl} alt={img.altText} layout="fill" objectFit="cover" data-ai-hint={img.dataAiHint}/>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{img.altText}</TableCell>
                        <TableCell className="text-center">{img.displayOrder}</TableCell>
                        <TableCell className="text-center">
                          {img.isActive ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[150px]">{img.linkUrl || 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-primary/80 hover:bg-primary/10"
                              onClick={() => openHeroImageForm(img)}
                              aria-label={`Edit hero image ${img.altText}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setHeroImageToDelete(img)}
                              aria-label={`Delete hero image ${img.altText}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No hero images found. Add some images for the homepage carousel.</p>
            )}
          </CardContent>
        </Card>


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
              <p className="text-destructive text-center py-10">Error: {productError}</p>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-xs hidden sm:table-cell">{product.id.substring(0,8)}...</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{product.stock ?? 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-primary/80 hover:bg-primary/10"
                              onClick={() => openProductForm(product)}
                              aria-label={`Edit product ${product.name}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setProductToDelete(product)}
                              aria-label={`Delete product ${product.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
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
              <p className="text-destructive text-center py-10">Error: {categoryError}</p>
            ) : categories.length > 0 ? (
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{category.displayOrder ?? 'N/A'}</TableCell>
                        <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-primary/80 hover:bg-primary/10"
                              onClick={() => openCategoryForm(category)}
                              aria-label={`Edit category ${category.name}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setCategoryToDelete(category)}
                              aria-label={`Delete category ${category.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
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
              <ShoppingBag className="mr-3 h-6 w-6 text-primary" /> Order Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading orders...</p>
              </div>
            ) : ordersError ? (
              <p className="text-destructive text-center py-10">Error: {ordersError}</p>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                        <TableCell className="font-medium">{order.shippingAddress.fullName}</TableCell>
                        <TableCell>{format(new Date(order.orderDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell className="text-right">₹{order.grandTotal.toFixed(2)}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell className="text-right space-x-1">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-primary/80 hover:bg-primary/10" 
                              aria-label={`View order ${order.id}`}
                              onClick={() => openOrderDetails(order)}
                            >
                              <ListOrdered className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10">No orders found.</p>
            )}
          </CardContent>
        </Card>
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
      </div>
    </div>
  );
}
