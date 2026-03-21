"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  ChefHat, 
  ArrowLeft,
  Loader2,
  Clock,
  LogOut,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/auth-context';
import { useCart } from '@/lib/contexts/cart-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simplified query to avoid complex index requirements that can mask as permission errors
  const ordersQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
  }, [db, user?.uid]);

  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  // Perform sorting in memory to ensure real-time updates without index overhead
  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => {
      const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [rawOrders]);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login?callbackUrl=/orders');
    }
  }, [user, loading, router, mounted]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin text-primary" />
          <p className="font-headline font-bold text-muted-foreground">Gathering your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-black tracking-tight text-foreground">Bhartiya Swad</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="font-bold gap-2 rounded-xl text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
            
            <div className="flex items-center gap-3 pl-4 border-l">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()} 
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-headline font-black tracking-tight">My Order History</h1>
            <p className="text-muted-foreground font-medium mt-1">Review all your past and current culinary adventures.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none rounded-full px-6 h-10 flex items-center font-black uppercase tracking-widest text-[10px]">
            {orders?.length || 0} TOTAL ORDERS
          </Badge>
        </div>

        {ordersLoading ? (
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-[2.5rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {orders.map((order) => (
              <Card key={order.id} className="border shadow-sm rounded-[2.5rem] overflow-hidden bg-white hover:shadow-xl transition-all group">
                <CardContent className="p-8 md:p-10 flex flex-col md:flex-row gap-8 justify-between">
                  <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order Reference</p>
                        <p className="font-mono text-sm font-black text-primary">#{order.orderId?.slice(0, 16).toUpperCase() || order.id.slice(0, 16).toUpperCase()}</p>
                      </div>
                      <Badge className={cn(
                        "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-wider border-none",
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                      )}>
                        {order.orderStatus || 'Order Placed'}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Delicacies</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-muted/20 p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white border overflow-hidden flex-shrink-0">
                              <img src={item.imageURL || `https://picsum.photos/seed/${item.dishId}/200/200`} alt={item.foodName} className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs truncate">{item.foodName}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-dashed pt-8 md:pt-0 md:pl-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <CreditCard className="w-3 h-3" /> Method
                        </span>
                        <span className="font-black text-foreground capitalize">{order.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Timestamp
                        </span>
                        <span className="font-black text-foreground">
                          {order.orderDate ? format(parseISO(order.orderDate), 'MMM dd, p') : 'Processing'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Grand Total</p>
                          <p className="text-3xl font-headline font-black text-primary">₹{order.totalPrice}</p>
                        </div>
                      </div>
                      <Link href={`/orders/${order.id}`} className="w-full">
                        <Button className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-lg shadow-primary/10 group">
                          Track Progress <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-muted/5 rounded-[3rem] p-24 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-headline font-black text-foreground">You have not placed any orders yet.</h3>
                <p className="text-muted-foreground font-medium italic">Your culinary journey is just one click away.</p>
              </div>
              <Link href="/menu">
                <Button className="h-14 px-10 rounded-2xl bg-primary text-lg font-black shadow-xl shadow-primary/20 text-white">
                  Explore Full Menu
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}