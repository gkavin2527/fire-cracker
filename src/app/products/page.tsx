
"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/products/ProductCard';
import type { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListFilter, Search, Loader2 } from 'lucide-react';

const ProductsPage = () => {
  const searchParams = useSearchParams();
  const initialCategorySlug = searchParams.get('category');

  const [allFetchedProducts, setAllFetchedProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productError, setProductError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [sortOrder, setSortOrder] = useState<string>('default');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setProductError(null);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: Product[] = await response.json();
        setAllFetchedProducts(data);
        setFilteredProducts(data); 
        if (data.length > 0) {
          const newMaxPrice = Math.ceil(Math.max(...data.map(p => p.price), 100) / 10) * 10;
          setPriceRange([0, newMaxPrice]);
        } else {
          setPriceRange([0, 100]);
        }
      } catch (e: any) {
        console.error("Failed to fetch products:", e);
        setProductError(e.message || "Failed to load products.");
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: Category[] = await response.json();
        setCategories(data);
      } catch (e: any) {
        console.error("Failed to fetch categories:", e);
        setCategoryError(e.message || "Failed to load categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const maxPrice = useMemo(() => {
    if (allFetchedProducts.length === 0 && isLoadingProducts) return 100;
    if (allFetchedProducts.length === 0 && !isLoadingProducts) return 100;
    return Math.ceil(Math.max(...allFetchedProducts.map(p => p.price), 100) / 10) * 10;
  }, [allFetchedProducts, isLoadingProducts]);


  useEffect(() => {
    let tempProducts = [...allFetchedProducts];

    if (selectedCategory !== 'all') {
      const categoryDetails = categories.find(c => c.slug === selectedCategory);
      if (categoryDetails) {
        tempProducts = tempProducts.filter(p => p.category === categoryDetails.name);
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
  }, [selectedCategory, searchTerm, priceRange, sortOrder, allFetchedProducts, categories]);
  
  useEffect(() => {
    if(initialCategorySlug) {
        setSelectedCategory(initialCategorySlug);
    }
  }, [initialCategorySlug]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setPriceRange([0, maxPrice]);
    setSortOrder('default');
  };
  
  const currentCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return 'All Products';
    return categories.find(c => c.slug === selectedCategory)?.name || 'Products';
  }, [selectedCategory, categories]);

  const isLoading = isLoadingProducts || isLoadingCategories;

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
              {isLoadingCategories ? (
                <div className="mt-1 h-10 flex items-center justify-center border rounded-md bg-muted/50">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : categoryError ? (
                 <p className="text-xs text-destructive mt-1">Error loading categories.</p>
              ) : (
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
              )}
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
                    disabled={isLoadingProducts}
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
          {currentCategoryName}
        </h1>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : productError ? (
          <div className="text-center py-10 text-destructive">
            <p className="text-xl">Error: {productError}</p>
            <p>Could not load products. Please try again later.</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">No products found matching your criteria.</p>
            <Button variant="link" onClick={resetFilters} className="mt-4 text-primary">
              Clear all filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductsPage;
