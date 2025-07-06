
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
import { Switch } from "@/components/ui/switch";
import type { HeroImageFormData } from '@/types';
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import ImageDropzone from "./ImageDropzone";

const heroImageFormSchema = z.object({
  imageUrl: z.string().url({ message: "An image is required. Please upload one." }).min(1, { message: "An image is required. Please upload one." }),
  altText: z.string().min(3, { message: "Alt text must be at least 3 characters." }),
  dataAiHint: z.string().min(1, "AI hint is required.").max(50, "AI hint should be brief, max 50 chars."),
  displayOrder: z.coerce.number().int().min(0, { message: "Display order must be a non-negative integer." }),
  isActive: z.boolean().default(true),
  linkUrl: z.string().url({ message: "Please enter a valid URL or leave empty." }).optional().or(z.literal('')),
});

interface AddHeroImageFormProps {
  onSubmitHeroImage: (heroImage: HeroImageFormData) => Promise<boolean>;
  isSubmitting: boolean;
  initialData?: HeroImageFormData;
  isEditing?: boolean;
}

const AddHeroImageForm = ({ onSubmitHeroImage, isSubmitting, initialData, isEditing = false }: AddHeroImageFormProps) => {
  const form = useForm<HeroImageFormData>({
    resolver: zodResolver(heroImageFormSchema),
    // Default values are set here and will be overridden by useEffect if initialData is present for editing
    defaultValues: {
      imageUrl: "",
      altText: "Hero Image",
      dataAiHint: "hero banner",
      displayOrder: 0,
      isActive: true,
      linkUrl: "",
    },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      form.reset({
        imageUrl: initialData.imageUrl,
        altText: initialData.altText,
        dataAiHint: initialData.dataAiHint,
        displayOrder: initialData.displayOrder ?? 0, // Fallback to 0 if undefined
        isActive: initialData.isActive ?? true,   // Fallback to true if undefined
        linkUrl: initialData.linkUrl || "",
      });
    } else if (!isEditing) { // Reset to defaults for "Add New"
      form.reset({
        imageUrl: "",
        altText: "Hero Image",
        dataAiHint: "hero banner",
        displayOrder: 0,
        isActive: true,
        linkUrl: "",
      });
    }
  }, [initialData, isEditing, form]);

  async function onSubmit(values: HeroImageFormData) {
    const success = await onSubmitHeroImage(values);
    if (success && !isEditing) {
      form.reset({
        imageUrl: "",
        altText: "Hero Image",
        dataAiHint: "hero banner",
        displayOrder: 0,
        isActive: true,
        linkUrl: "",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hero Image</FormLabel>
              <FormControl>
                <ImageDropzone
                  initialImageUrl={field.value}
                  onUrlChange={(url) => {
                    field.onChange(url);
                    form.trigger("imageUrl");
                  }}
                  folder="hero-images"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="altText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alt Text (for accessibility)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Festive fireworks display" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dataAiHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data AI Hint (1-2 keywords)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., celebration fireworks" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="linkUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link URL (Optional, e.g., /products/category-slug)</FormLabel>
              <FormControl>
                <Input placeholder="/products/sky-shots" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                <FormLabel className="mb-2.5">Active Status</FormLabel>
                <FormControl>
                    <div className="flex items-center space-x-2">
                    <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-readonly
                    />
                    <span>{field.value ? "Visible" : "Hidden"}</span>
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating Hero Image..." : "Adding Hero Image..."}
            </>
          ) : (
            isEditing ? "Update Hero Image" : "Add Hero Image"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddHeroImageForm;
