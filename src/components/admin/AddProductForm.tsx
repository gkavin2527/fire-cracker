
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Category, ProductFormData } from '@/types';
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  category: z.string().min(1, { message: "Please select a category." }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  imageHint: z.string().max(50, "Image hint should be brief, max 50 chars.").optional(),
  stock: z.coerce.number().int().min(0, { message: "Stock must be a non-negative integer." }).optional(),
});

type ProductFormValues = ProductFormData; // Omit<Product, 'id' | 'rating'> is already ProductFormData

interface AddProductFormProps {
  onSubmitProduct: (product: ProductFormValues) => Promise<boolean>;
  isSubmitting: boolean;
  initialData?: ProductFormValues;
  isEditing?: boolean;
}

const AddProductForm = ({ onSubmitProduct, isSubmitting, initialData, isEditing = false }: AddProductFormProps) => {
  const [formCategories, setFormCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      price: 0,
      category: "",
      imageUrl: "https://placehold.co/400x300.png",
      imageHint: "product image",
      stock: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        imageUrl: "https://placehold.co/400x300.png",
        imageHint: "product image",
        stock: 0,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchCategoriesForForm = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: Category[] = await response.json();
        setFormCategories(data);
      } catch (e: any) {
        console.error("Failed to fetch categories for AddProductForm:", e);
        setCategoryError(e.message || "Failed to load categories.");
        toast({
          title: "Error Loading Categories",
          description: e.message || "Could not fetch categories for the form.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategoriesForForm();
  }, [toast]);

  async function onSubmit(values: ProductFormValues) {
    const success = await onSubmitProduct(values);
    if (success && !isEditing) {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        imageUrl: "https://placehold.co/400x300.png",
        imageHint: "product image",
        stock: 0,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sky Dominator XL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the product..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="199.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isLoadingCategories || !!categoryError || formCategories.length === 0}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingCategories ? "Loading categories..." :
                      categoryError ? "Error loading categories" :
                      formCategories.length === 0 ? "No categories found" :
                      "Select a category"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingCategories ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </div>
                  ) : categoryError ? (
                     <SelectItem value="error" disabled>Error: {categoryError.substring(0,50)}...</SelectItem>
                  ) : formCategories.length === 0 ? (
                     <SelectItem value="no-cat" disabled>No categories available</SelectItem>
                  ) : (
                    formCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="imageHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Hint (for AI, 1-2 words)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. aerial fireworks" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting || isLoadingCategories}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating Product..." : "Adding Product..."}
            </>
          ) : (
            isEditing ? "Update Product" : "Add Product"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddProductForm;

    
