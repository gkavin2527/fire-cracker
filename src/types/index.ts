
import type { LucideIcon } from 'lucide-react';

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
  iconName?: string; // e.g., "RocketIcon", "BombIcon" - to be mapped to Lucide components
  displayOrder?: number; // For controlling display order
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string; // Added email field
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  orderDate: Date;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}

// Type for the product form, excluding fields that are auto-generated or not part of creation
export type ProductFormData = Omit<Product, 'id' | 'rating'>;

// Type for the order confirmation email generation
export interface OrderConfirmationEmailInput {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number; imageUrl: string; imageHint: string }>;
  totalAmount: number;
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
