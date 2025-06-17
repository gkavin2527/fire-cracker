
"use client";

import Link from 'next/link';
import { ShoppingCart, Home, Package, Menu, SparklesIcon, UserCircle, LogIn, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import CrackleMartLogo from '@/components/icons/CrackleMartLogo';
import type { Category } from '@/types';
import { getIcon } from '@/lib/iconMap';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define the admin email address here
// In a real app, this would come from a more secure configuration or user role system
const ADMIN_EMAIL = "gkavin446@gmail.com";

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode, onClick?: () => void }) => (
  <Link href={href} passHref>
    <Button variant="ghost" onClick={onClick} className="text-foreground hover:text-primary transition-colors font-medium w-full justify-start md:w-auto">
      {children}
    </Button>
  </Link>
);

const Header = () => {
  const { getItemCount } = useCart();
  const { user, logout, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const itemCount = getItemCount();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          let errorBody = "No additional error body from API or failed to parse error body.";
          try {
            const errorJson = await response.json();
            errorBody = JSON.stringify(errorJson);
          } catch (e) {
            try {
              errorBody = await response.text();
              if (!errorBody.trim()) errorBody = "Empty error body from API."
            } catch (textError) {
               errorBody = "Could not parse error body as JSON or text."
            }
          }
          console.error(`Header: Failed to fetch categories. Status: ${response.status}. API Response: ${errorBody}`);
          throw new Error(`Failed to fetch categories. Status: ${response.status}. Response: ${errorBody}`);
        }
        const data: Category[] = await response.json();
        setCategories(data);
      } catch (error: any) {
        console.error("Header: Error fetching categories:", error.message);
        setCategoriesError(error.message || 'Could not load categories.');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    router.push('/login');
  }

  const navItems = (
    <>
      <NavLink href="/" onClick={() => setMobileMenuOpen(false)}>
        <Home className="mr-2 h-5 w-5" /> Home
      </NavLink>
      <NavLink href="/products" onClick={() => setMobileMenuOpen(false)}>
        <Package className="mr-2 h-5 w-5" /> Products
      </NavLink>
      <DropdownMenu onOpenChange={(open) => { if(!open) setMobileMenuOpen(false)}}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-foreground hover:text-primary transition-colors font-medium w-full justify-start md:w-auto">
            {categoriesLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SparklesIcon className="mr-2 h-5 w-5" />} Categories
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Product Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categoriesLoading ? (
            <DropdownMenuItem disabled>Loading categories...</DropdownMenuItem>
          ) : categoriesError ? (
            <DropdownMenuItem disabled>Error: {categoriesError.substring(0,100)}...</DropdownMenuItem>
          ) : categories.length > 0 ? (
            categories.map((category) => {
              const Icon = getIcon(category.iconName);
              return (
                <Link key={category.id} href={`/products?category=${category.slug}`} passHref>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                    <Icon className="mr-2 h-4 w-4" />
                    {category.name}
                  </DropdownMenuItem>
                </Link>
              );
            })
          ) : (
             <DropdownMenuItem disabled>No categories found</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
       {user && user.email === ADMIN_EMAIL && (
         <NavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
            <ShieldCheck className="mr-2 h-5 w-5" /> Admin
        </NavLink>
       )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" passHref className="flex items-center gap-2">
          <CrackleMartLogo className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navItems}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {authLoading ? (
             <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5"/>}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" onClick={handleLogin}>
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Button>
          )}
          
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background p-6 flex flex-col">
                <nav className="flex flex-col space-y-2 mt-4">
                  {navItems}
                </nav>
                <div className="mt-auto pt-4 border-t border-border/40">
                 {authLoading ? <p className="text-sm text-muted-foreground">Loading...</p> :
                  user ? (
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                            <AvatarFallback>
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5"/>}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                             <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                             <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                          </div>
                       </div>
                        <Button variant="outline" onClick={handleLogout} className="w-full">
                          <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </div>
                  ) : (
                    <Button onClick={handleLogin} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                       <LogIn className="mr-2 h-5 w-5" /> Login / Register
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
