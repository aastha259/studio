
"use client"

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Clock, 
  User, 
  Store,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch Orders (Real-time)
  const ordersQuery = useMemoFirebase(() => query(collection(db, 'orders'), orderBy('orderDate', 'desc')), [db]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

  // Fetch Users & Restaurants for lookups
  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: users } = useCollection(usersQuery);

  const restaurantsQuery = useMemoFirebase(() => collection(db, 'restaurants'), [db]);
  const { data: restaurants } = useCollection(restaurantsQuery);

  // Fetch Order Items for the selected order
  const orderItemsQuery = useMemoFirebase(() => {
    if (!selectedOrder) return null;
    return collection(db, 'orders', selectedOrder.id, 'orderItems');
  }, [db, selectedOrder]);
  const { data: orderItems, isLoading: itemsLoading } = useCollection(orderItemsQuery);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  const filteredOrders = orders?.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    users?.find(u => u.id === o.userId)?.displayName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Out for Delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Preparing': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-primary" />
            Order Management
          </h1>
          <p className="text-muted-foreground font-medium">Monitor and process live customer orders in real-time.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by Order ID or Customer..." 
              className="pl-12 h-12 bg-white rounded-2xl shadow-sm border ring-1 ring-primary/5 focus-visible:ring-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold gap-2 border-primary/20 text-primary hover:bg-primary/5">
            <Filter className="w-5 h-5" />
            Filter
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <div className="bg-muted/10 p-8 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h3 className="font-black text-xl font-headline">Live Order Stream</h3>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-1 font-bold bg-white">
              {filteredOrders.length} ORDERS TOTAL
            </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black px-10 h-20 uppercase tracking-widest text-[10px]">Order ID</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Customer</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Restaurant</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Amount</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-right pr-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const customer = users?.find(u => u.id === order.userId);
                const restaurant = restaurants?.find(r => r.id === order.restaurantId);
                
                return (
                  <TableRow key={order.id} className="hover:bg-muted/5 transition-colors border-b last:border-none group">
                    <TableCell className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-accent mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {order.orderDate ? format(parseISO(order.orderDate), 'MMM dd, p') : 'Processing'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{customer?.displayName || 'Guest User'}</span>
                          <span className="text-[10px] text-muted-foreground">{customer?.email || 'No email'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium">{restaurant?.name || 'Partner Outlet'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-lg text-primary">₹{(order.totalAmount || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={order.status || 'Pending'} 
                        onValueChange={(val) => handleUpdateStatus(order.id, val)}
                      >
                        <SelectTrigger className={cn("w-40 h-10 rounded-full font-black text-[10px] uppercase tracking-wider border-2", getStatusColor(order.status))}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="Pending" className="font-bold">Pending</SelectItem>
                          <SelectItem value="Preparing" className="font-bold text-orange-600">Preparing</SelectItem>
                          <SelectItem value="Out for Delivery" className="font-bold text-blue-600">Out for Delivery</SelectItem>
                          <SelectItem value="Delivered" className="font-bold text-green-600">Delivered</SelectItem>
                          <SelectItem value="Cancelled" className="font-bold text-red-600">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl font-bold text-primary hover:bg-primary/5 gap-2"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {filteredOrders.length === 0 && !ordersLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32 opacity-30">
                    <div className="flex flex-col items-center">
                      <ShoppingBag className="w-20 h-20 mb-4" />
                      <p className="text-xl font-black italic">Waiting for new orders...</p>
                      <p className="text-sm">The stream is active and listening for incoming requests.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {ordersLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none bg-offwhite">
          <DialogHeader className="bg-primary p-10 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-headline font-black">Order Breakdown</DialogTitle>
                <DialogDescription className="text-white/70 font-bold mt-1">
                  ID: #{selectedOrder?.id.toUpperCase()}
                </DialogDescription>
              </div>
              <Badge className={cn("rounded-full px-4 py-1.5 font-black text-[10px] uppercase border-none bg-white", getStatusColor(selectedOrder?.status).split(' ')[1])}>
                {selectedOrder?.status || 'Processing'}
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="p-10 space-y-8">
            {/* Customer & Logistics Info */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Customer Details</p>
                <div className="p-4 bg-white rounded-2xl border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{users?.find(u => u.id === selectedOrder?.userId)?.displayName || 'Guest'}</p>
                    <p className="text-[10px] text-muted-foreground">UID: {selectedOrder?.userId.slice(0, 8)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assigned Kitchen</p>
                <div className="p-4 bg-white rounded-2xl border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center">
                    <Store className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{restaurants?.find(r => r.id === selectedOrder?.restaurantId)?.name || 'Outlet'}</p>
                    <p className="text-[10px] text-muted-foreground">RID: {selectedOrder?.restaurantId.slice(0, 8)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Items in Order</p>
              <Card className="border shadow-none rounded-2xl overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase h-10">Dish Name</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-center h-10">Qty</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-right h-10">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems?.map((item) => (
                      <TableRow key={item.id} className="border-b last:border-none">
                        <TableCell className="font-bold text-sm">{item.foodName}</TableCell>
                        <TableCell className="text-center font-bold text-sm">x{item.quantity}</TableCell>
                        <TableCell className="text-right font-black text-primary text-sm">₹{item.subtotal}</TableCell>
                      </TableRow>
                    ))}
                    {itemsLoading && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    )}
                    {orderItems?.length === 0 && !itemsLoading && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-10 opacity-30 italic font-bold">
                          No items found for this order.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between pt-6 border-t border-dashed">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Total Collection</p>
                  <p className="text-xs text-muted-foreground italic">Inclusive of taxes & delivery</p>
                </div>
              </div>
              <p className="text-4xl font-headline font-black text-primary">₹{selectedOrder?.totalAmount}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
