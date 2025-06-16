"use client";

import Link from 'next/link';
import { ShoppingCart, Home, Package, Menu, SparklesIcon, FlameIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import CrackleMartLogo from '@/components/icons/CrackleMartLogo';
import { categories } from '@/lib/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} passHref>
    <Button variant="ghost" className="text-foreground hover:text-primary transition-colors font-medium">
      {children}
    </Button>
  </Link>
);

const Header = () => {
  const { getItemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = getItemCount();

  const navItems = (
    <>
      <NavLink href="/">
        <Home className="mr-2 h-5 w-5" /> Home
      </NavLink>
      <NavLink href="/products">
        <Package className="mr-2 h-5 w-5" /> Products
      </NavLink>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-foreground hover:text-primary transition-colors font-medium">
            <SparklesIcon className="mr-2 h-5 w-5" /> Categories
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Product Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`} passHref>
              <DropdownMenuItem className="cursor-pointer">
                {category.icon && <category.icon className="mr-2 h-4 w-4" />}
                {category.name}
              </DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" passHref className="flex items-center gap-2">
          <CrackleMartLogo className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {navItems}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background p-6">
                <nav className="flex flex-col space-y-4">
                  {navItems}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
