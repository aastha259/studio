"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  User, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/lib/contexts/auth-context';
import { collection } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn, computeOrderStatus, STATUS_LABELS } from '@/lib/utils';

export default function AdminOrdersPage() {
  const db = useFirestore();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const isAuthorized = user?.isAdmin && user.email === 'xyz@admin.com';

  const ordersRef = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'orders');
  }, [db, isAuthorized]);
  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersRef);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
      return dateB - dateA;
    });
  }, [rawOrders]);

  const usersQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'users');
  }, [db, isAuthorized]);
  const { data: users } = useCollection(usersQuery);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();
    return orders?.filter(o => {
      const orderIdMatch = (o.orderId || o.id || '').toLowerCase().includes(query);
      const userMatch = users?.find(u => u.uid === o.userId)?.displayName?.toLowerCase().includes(query);
      const emailMatch = (o.userEmail || '').toLowerCase().includes(query);
      return orderIdMatch || userMatch || emailMatch;
    }) || [];
  }, [orders, users, search]);

  const getStatusColor = (statusKey: string) => {
    switch (statusKey) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'placed': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3 text-foreground">
            <ShoppingBag className="w-10 h-10 text-primary" />
            Order Management
          </h1>
          <p className="text-muted-foreground font-medium">Live customer tracking dashboard (Standardized Database).</p>
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
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <div className="bg-muted/10 p-8 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h3 className="font-black text-xl font-headline text-foreground">Audit Stream</h3>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-1 font-bold bg-white">
              {filteredOrders.length} ORDERS AUDITED
            </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black px-10 h-20 uppercase tracking-widest text-[10px]">Order ID</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Customer</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Amount</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-right pr-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const customer = users?.find(u => u.uid === order.userId);
                const orderId = order.orderId || order.id || '';
                const totalAmount = order.totalAmount || 0;
                const statusKey = computeOrderStatus(order.createdAt);
                
                return (
                  <TableRow key={order.id} className="hover:bg-muted/5 transition-colors border-b last:border-none group">
                    <TableCell className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-muted-foreground">#{orderId.slice(0, 12).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-accent mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {order.createdAt ? format(order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt), 'MMM dd, p') : 'Processing'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{customer?.displayName || order.deliveryDetails?.name || 'Guest User'}</span>
                          <span className="text-[10px] text-muted-foreground">{customer?.email || order.userEmail || 'No email'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-lg text-primary">₹{(totalAmount || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-wider border-none", getStatusColor(statusKey))}>
                        {STATUS_LABELS[statusKey]}
                      </Badge>
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
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none bg-[#FDFCFB]">
          <DialogHeader className="bg-primary p-10 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-headline font-black">Order Audit</DialogTitle>
                <DialogDescription className="text-white/70 font-bold mt-1">
                  ID: #{(selectedOrder?.orderId || selectedOrder?.id || '').toUpperCase()}
                </DialogDescription>
              </div>
              <Badge className="rounded-full px-4 py-1.5 font-black text-[10px] uppercase border-none bg-white text-primary">
                {STATUS_LABELS[computeOrderStatus(selectedOrder?.createdAt)]}
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="p-10 space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Customer Details</p>
              <div className="p-4 bg-white rounded-2xl border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{selectedOrder?.deliveryDetails?.name || 'Guest'}</p>
                  <p className="text-[10px] text-muted-foreground">UID: {selectedOrder?.userId?.slice(0, 12)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Items In Order</p>
              <Card className="border shadow-none rounded-2xl overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase h-10">Dish</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-center h-10">Qty</TableHead>
                      <TableHead className="font-black text-[10px] uppercase text-right h-10">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder?.items?.map((item: any, idx: number) => (
                      <TableRow key={idx} className="border-b last:border-none">
                        <TableCell className="font-bold text-sm text-foreground">{item.name}</TableCell>
                        <TableCell className="text-center font-bold text-sm text-foreground">x{item.quantity}</TableCell>
                        <TableCell className="text-right font-black text-primary text-sm">₹{item.price * item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-dashed">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Standardized Total</p>
                  <p className="text-xs text-muted-foreground italic">Validated audit record</p>
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