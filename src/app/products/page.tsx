"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { products as allProducts, categories } from '@/lib/mockData';
import type { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListFilter, Search } from 'lucide-react';

const ProductsPage = () => {
  const searchParams = useSearchParams();
  const initialCategorySlug = searchParams.get('category');

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(allProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]); // Max price could be dynamic
  const [sortOrder, setSortOrder] = useState<string>('default');

  const maxPrice = useMemo(() => Math.max(...allProducts.map(p => p.price), 100), []);
  useEffect(() => { setPriceRange([0,maxPrice])}, [maxPrice]);


  useEffect(() => {
    let tempProducts = allProducts;

    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.slug === selectedCategory);
      if (category) {
        tempProducts = tempProducts.filter(p => p.category === category.name);
      }
    }

    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(lowercasedSearchTerm) ||
        p.description.toLowerCase().includes(lowercasedSearchTerm) ||
        p.id.toLowerCase().includes(lowercasedSearchTerm)
      );
    }
    
    tempProducts = tempProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (sortOrder === 'price-asc') {
      tempProducts.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      tempProducts.sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'name-asc') {
      tempProducts.sort((a,b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'name-desc') {
       tempProducts.sort((a,b) => b.name.localeCompare(a.name));
    }


    setFilteredProducts(tempProducts);
  }, [selectedCategory, searchTerm, priceRange, sortOrder, maxPrice]);
  
  useEffect(() => {
    if(initialCategorySlug) {
        setSelectedCategory(initialCategorySlug);
    }
  }, [initialCategorySlug]);


  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <Card className="p-2 sticky top-20 shadow-md rounded-lg">
          <CardHeader className="pb-4">
             <CardTitle className="text-xl font-headline flex items-center"><ListFilter className="mr-2 h-5 w-5 text-primary"/> Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="search-term" className="text-sm font-medium">Search</Label>
              <div className="relative mt-1">
                <Input
                  id="search-term"
                  type="text"
                  placeholder="Search by name, ID, desc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <Label htmlFor="category-select" className="text-sm font-medium">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-select" className="w-full mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
                <Label className="text-sm font-medium">Price Range</Label>
                <div className="mt-2 p-1 border rounded-md">
                    <Slider
                    min={0}
                    max={maxPrice}
                    step={1}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="my-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                    </div>
                </div>
            </div>
            
            <div>
              <Label htmlFor="sort-order" className="text-sm font-medium">Sort By</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger id="sort-order" className="w-full mt-1">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Product Grid */}
      <main className="w-full md:w-3/4 lg:w-4/5">
        <h1 className="text-3xl font-bold mb-8 font-headline">
          {selectedCategory === 'all' ? 'All Products' : categories.find(c=>c.slug === selectedCategory)?.name || 'Products'}
        </h1>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">No products found matching your criteria.</p>
            <Button variant="link" onClick={() => { setSelectedCategory('all'); setSearchTerm(''); setPriceRange([0, maxPrice]); }} className="mt-4 text-primary">
              Clear all filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductsPage;
