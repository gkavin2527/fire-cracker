
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
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const bulkAddSchema = z.object({
  productsJson: z.string().min(10, { message: "JSON data cannot be empty." }),
});

type BulkAddFormValues = z.infer<typeof bulkAddSchema>;

interface BulkAddProductFormProps {
  onSubmit: (productsJson: string) => Promise<boolean>;
  isSubmitting: boolean;
}

const jsonExample = `[
  {
    "name": "Small Rocket",
    "description": "A small but feisty rocket.",
    "price": 5.99,
    "category": "Sky Shots / Aerials",
    "stock": 200,
    "imageUrl": "https://placehold.co/400x300.png",
    "imageHint": "small rocket"
  },
  {
    "name": "Ground Spinner",
    "description": "Spins on the ground with colors.",
    "price": 2.50,
    "category": "Spinning Crackers",
    "stock": 500
  }
]`;


const BulkAddProductForm = ({ onSubmit, isSubmitting }: BulkAddProductFormProps) => {
  const form = useForm<BulkAddFormValues>({
    resolver: zodResolver(bulkAddSchema),
    defaultValues: {
      productsJson: "",
    },
  });

  async function handleSubmit(values: BulkAddFormValues) {
    const success = await onSubmit(values.productsJson);
    if (success) {
      form.reset();
    }
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">JSON Format Example</CardTitle>
          <CardDescription className="text-xs">
            Paste a JSON array matching this structure. `imageUrl` and `imageHint` are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs p-2 bg-slate-800 text-white rounded-md overflow-x-auto">
            <code>{jsonExample}</code>
          </pre>
        </CardContent>
      </Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="productsJson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product JSON Array</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="[\n  {...},\n  {...}\n]"
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Adding many products at once may take a few moments to process. Limit of 50 products per submission.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Products...
              </>
            ) : (
              "Add Products to Database"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BulkAddProductForm;
