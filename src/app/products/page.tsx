
import { Suspense } from 'react'; 
import ProductsPageClientContent from '@/components/products/ProductsPageClient';
import { Loader2 } from 'lucide-react';

// This component is now a Server Component.
// It does NOT use "use client".
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground text-lg">Loading products...</p>
      </div>
    }>
      <ProductsPageClientContent />
    </Suspense>
  );
}
