
import { products } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Package, Users, ShoppingBag } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
      </div>

      <Card className="shadow-md rounded-lg border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline">
            <Package className="mr-3 h-6 w-6 text-primary" /> Product Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs">{product.id}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.stock ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">No products found in mock data.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <Users className="mr-3 h-6 w-6 text-primary" /> User Management (Placeholder)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will display user information once a backend and authentication are implemented.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-lg border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-headline">
              <ShoppingBag className="mr-3 h-6 w-6 text-primary" /> Order Management (Placeholder)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This section will display order information once a backend is integrated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
