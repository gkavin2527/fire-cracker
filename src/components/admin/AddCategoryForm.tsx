
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
import type { CategoryFormData } from '@/types';
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import ImageDropzone from "./ImageDropzone";

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') 
    .replace(/[^\w-]+/g, '') 
    .replace(/--+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, ''); 
};

const categoryFormSchema = z.object({
  name: z.string().min(3, { message: "Category name must be at least 3 characters." }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with dashes, e.g., 'sky-shots'."),
  imageUrl: z.string().url({ message: "An image is required. Please upload one." }).min(1, { message: "An image is required. Please upload one." }),
  imageHint: z.string().min(1, "Image hint is required.").max(50, "Image hint should be brief, max 50 chars."),
  displayOrder: z.coerce.number().int().min(0, "Display order must be a non-negative integer.").optional(),
});

interface AddCategoryFormProps {
  onSubmitCategory: (category: CategoryFormData) => Promise<boolean>;
  isSubmitting: boolean;
  initialData?: CategoryFormData;
  isEditing?: boolean;
}

const AddCategoryForm = ({ onSubmitCategory, isSubmitting, initialData, isEditing = false }: AddCategoryFormProps) => {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      imageUrl: "",
      imageHint: "category image",
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      // Reset to default if not editing (e.g., dialog opened for "Add New")
      form.reset({
        name: "",
        slug: "",
        imageUrl: "",
        imageHint: "category image",
        displayOrder: 0,
      });
    }
  }, [initialData, form]);


  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    form.setValue("name", name);
    // Only auto-update slug if user hasn't manually changed it OR if it's a new form
    if (!form.formState.dirtyFields.slug || !isEditing) { 
      form.setValue("slug", generateSlug(name), { shouldValidate: true });
    }
     if ((!form.formState.dirtyFields.imageHint || !isEditing) && name.trim()) {
      form.setValue("imageHint", name.split(' ').slice(0,2).join(' ').toLowerCase(), { shouldValidate: true });
    }
  };


  async function onSubmit(values: CategoryFormData) {
    const success = await onSubmitCategory(values);
    if (success && !isEditing) { // Only reset form if it was an "add" operation and successful
      form.reset({ // Reset to defaults for "Add New"
        name: "",
        slug: "",
        imageUrl: "",
        imageHint: "category image",
        displayOrder: 0,
      });
    }
    // For edit, the dialog closing will handle visual state.
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Image</FormLabel>
              <FormControl>
                <ImageDropzone
                  initialImageUrl={field.value}
                  onUrlChange={(url) => field.onChange(url)}
                  folder="categories"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Sky Shots" {...field} onChange={handleNameChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL-friendly name)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., sky-shots" {...field} />
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
        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating Category..." : "Adding Category..."}
            </>
          ) : (
            isEditing ? "Update Category" : "Add Category"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddCategoryForm;
