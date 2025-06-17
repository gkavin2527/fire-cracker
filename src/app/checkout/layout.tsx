
import ProtectedPage from '@/components/auth/ProtectedPage';
import type { ReactNode } from 'react';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  // Protects the checkout page, user must be logged in.
  // adminOnly is false by default, so any authenticated user can access.
  return <ProtectedPage>{children}</ProtectedPage>;
}
