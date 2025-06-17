
import ProtectedPage from '@/components/auth/ProtectedPage';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ProtectedPage adminOnly={true}>{children}</ProtectedPage>;
}
