
import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  imageHint: string; // For AI to find relevant images
  stock?: number;
  rating?: number;
}

export interface Category {
  id: string; // Firestore document ID
  name: string;
  slug: string;
  imageUrl: string;
  imageHint: string;
  displayOrder?: number; // For controlling display order
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string; 
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface UserProfile {
  uid: string;
  email?: string | null; 
  displayName?: string | null; 
  photoURL?: string | null; 
  defaultShippingAddress?: ShippingAddress;
}

export interface Order {
  id: string; 
  userId: string; 
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  grandTotal: number;
  orderDate: Timestamp; 
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}

// Type for the product form, excluding fields that are auto-generated or not part of creation
export type ProductFormData = Omit<Product, 'id' | 'rating'>;

// Type for the category form
export type CategoryFormData = Omit<Category, 'id'>;


// Type for the order confirmation email generation
export interface OrderConfirmationEmailInput {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl: string; imageHint: string }>;
  subtotal: number;
  shippingCost: number;
  grandTotal: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shopName: string;
  shopUrl: string;
}

export interface OrderConfirmationEmailOutput {
  subject: string;
  htmlBody: string;
}
