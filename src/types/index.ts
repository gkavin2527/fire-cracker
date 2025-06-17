
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
  id: string; // Firestore document ID, same as the one generated client-side
  userId: string; // ID of the user who placed the order
  items: CartItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  orderDate: any; // Will be Firestore Timestamp, 'any' for now to avoid build issues before Firestore import
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
