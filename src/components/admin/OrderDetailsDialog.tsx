
"use client";

import { useEffect, useState } from 'react';
import type { Order, CartItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Image from 'next/image';
import { Loader2, Edit, Package, User, Mail, MapPin, CalendarDays, DollarSign, FileEdit, CheckCircle, Truck, PackageCheck, XCircle } from 'lucide-react';

interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => Promise<void>;
  isUpdatingStatus: boolean;
}

const orderStatuses: Order['status'][] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const statusIcons: Record<Order['status'], React.ElementType> = {
  Pending: Loader2,
  Processing: Edit,
  Shipped: Truck,
  Delivered: PackageCheck,
  Cancelled: XCircle,
};

const statusColors: Record<Order['status'], string> = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Processing: 'bg-blue-100 text-blue-800 border-blue-300',
  Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Delivered: 'bg-green-100 text-green-800 border-green-300',
  Cancelled: 'bg-red-100 text-red-800 border-red-300',
};


const OrderDetailsDialog = ({ order, isOpen, onClose, onUpdateStatus, isUpdatingStatus }: OrderDetailsDialogProps) => {
  const [selectedNewStatus, setSelectedNewStatus] = useState<Order['status'] | undefined>(undefined);

  useEffect(() => {
    if (order) {
      setSelectedNewStatus(order.status);
    }
  }, [order]);

  if (!order) {
    return null;
  }

  const CurrentStatusIcon = statusIcons[order.status] || Package;

  const handleStatusUpdate = async () => {
    if (selectedNewStatus && order.id) {
      await onUpdateStatus(order.id, selectedNewStatus);
      // Dialog closure will be handled by parent if desired, or status update can trigger it
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Package className="mr-3 h-7 w-7 text-primary" /> Order Details: {order.id}
          </DialogTitle>
          <DialogDescription>
            View and manage the details for this order.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-grow overflow-y-auto pr-2">
          {/* Customer and Shipping Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 font-headline flex items-center"><User className="mr-2 h-5 w-5 text-primary/80" />Customer Information</h3>
              <div className="text-sm p-3 bg-muted/50 rounded-md space-y-1 border">
                <p><strong className="font-medium">Name:</strong> {order.shippingAddress.fullName}</p>
                <p><strong className="font-medium">Email:</strong> {order.shippingAddress.email}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 font-headline flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary/80" />Shipping Address</h3>
              <div className="text-sm p-3 bg-muted/50 rounded-md space-y-1 border">
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 font-headline flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary/80" />Order Date</h3>
              <p className="text-sm p-3 bg-muted/50 rounded-md border">{format(new Date(order.orderDate), 'MMMM dd, yyyy HH:mm:ss')}</p>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2 font-headline flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary/80" />Total Amount</h3>
                <p className="text-xl font-bold p-3 bg-muted/50 rounded-md border text-primary">${order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Items and Status */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 font-headline flex items-center"><FileEdit className="mr-2 h-5 w-5 text-primary/80" />Update Status</h3>
              <div className="p-3 bg-muted/50 rounded-md space-y-3 border">
                <div className="flex items-center">
                    <span className="mr-2 font-medium text-sm">Current:</span>
                    <Badge variant="outline" className={`${statusColors[order.status]} text-xs px-2 py-0.5 rounded-full flex items-center`}>
                        <CurrentStatusIcon className="mr-1.5 h-3.5 w-3.5" />
                        {order.status}
                    </Badge>
                </div>
                <Select value={selectedNewStatus} onValueChange={(value) => setSelectedNewStatus(value as Order['status'])} disabled={isUpdatingStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map(status => {
                      const Icon = statusIcons[status];
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" /> {status}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button onClick={handleStatusUpdate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isUpdatingStatus || selectedNewStatus === order.status}>
                  {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1 font-headline flex items-center"><Package className="mr-2 h-5 w-5 text-primary/80" />Items Ordered ({order.items.reduce((acc, item) => acc + item.quantity, 0)})</h3>
               <div className="border rounded-md max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] hidden sm:table-cell">Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: CartItem) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="hidden sm:table-cell p-1.5">
                           <div className="relative h-12 w-12 rounded-md overflow-hidden">
                             <Image src={item.product.imageUrl || 'https://placehold.co/60x60.png'} alt={item.product.name} layout="fill" objectFit="cover" data-ai-hint={item.product.imageHint || 'product'} />
                           </div>
                        </TableCell>
                        <TableCell className="font-medium py-1.5">{item.product.name}</TableCell>
                        <TableCell className="text-center py-1.5">{item.quantity}</TableCell>
                        <TableCell className="text-right py-1.5">${item.product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right py-1.5">${(item.product.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
