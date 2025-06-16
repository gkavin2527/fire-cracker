
"use client";

import Link from 'next/link';
import { ShoppingCart, Home, Package, Menu, SparklesIcon, UserCircle, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode, onClick?: () => void }) => (
  <Link href={href} passHref>
    <Button variant="ghost" onClick={onClick} className="text-foreground hover:text-primary transition-colors font-medium w-full justify-start md:w-auto">
      {children}
    </Button>
  </Link>
);

const Header = () => {
  const { getItemCount } = useCart();
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const itemCount = getItemCount();

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
            <SparklesIcon className="mr-2 h-5 w-5" /> Categories
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Product Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`} passHref>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                {category.icon && <category.icon className="mr-2 h-4 w-4" />}
                {category.name}
              </DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
       {user && (
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

          {loading ? (
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
                 {loading ? <p className="text-sm text-muted-foreground">Loading...</p> :
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

