
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
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Icon select removed
import type { CategoryFormData } from '@/types';
import { Loader2 } from "lucide-react";
// import { iconMap } from "@/lib/iconMap"; // Icon map no longer needed here

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

const categoryFormSchema = z.object({
  name: z.string().min(3, { message: "Category name must be at least 3 characters." }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with dashes, e.g., 'sky-shots'."),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }),
  imageHint: z.string().min(1, "Image hint is required.").max(50, "Image hint should be brief, max 50 chars."),
  // iconName: z.string().optional(), // Removed
  displayOrder: z.coerce.number().int().min(0, "Display order must be a non-negative integer.").optional(),
});

interface AddCategoryFormProps {
  onSubmitCategory: (category: CategoryFormData) => Promise<boolean>;
  isSubmitting: boolean;
}

const AddCategoryForm = ({ onSubmitCategory, isSubmitting }: AddCategoryFormProps) => {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      imageUrl: "https://placehold.co/200x150.png",
      imageHint: "category image",
      // iconName: "DefaultIcon", // Removed
      displayOrder: 0,
    },
  });

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    form.setValue("name", name);
    if (!form.formState.dirtyFields.slug) { // Only auto-update slug if user hasn't manually changed it
      form.setValue("slug", generateSlug(name), { shouldValidate: true });
    }
     if (!form.formState.dirtyFields.imageHint && name.trim()) {
      form.setValue("imageHint", name.split(' ').slice(0,2).join(' ').toLowerCase(), { shouldValidate: true });
    }
  };


  async function onSubmit(values: CategoryFormData) {
    const success = await onSubmitCategory(values);
    if (success) {
      form.reset();
    }
  }

  // const availableIcons = Object.keys(iconMap); // Icons removed

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
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
        {/* Icon Name field removed
        <FormField
          control={form.control}
          name="iconName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon Name</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableIcons.map(iconKey => (
                    <SelectItem key={iconKey} value={iconKey}>
                      {iconKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        */}
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
              Adding Category...
            </>
          ) : (
            "Add Category"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddCategoryForm;
