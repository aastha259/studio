"use client"

import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/lib/contexts/auth-context';
import { collection } from 'firebase/firestore';
import { format, subDays, startOfWeek, isSameDay, isSameWeek } from 'date-fns';
import { TrendingUp, ShoppingBag, BarChart3 } from 'lucide-react';

export default function AdminSalesPage() {
  const db = useFirestore();
  const { user } = useAuth();

  const isAuthorized = user?.isAdmin && user.email === 'xyz@admin.com';

  const ordersQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'orders');
  }, [db, isAuthorized]);
  const { data: orders } = useCollection(ordersQuery);

  const dishesQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'dishes');
  }, [db, isAuthorized]);
  const { data: dishes } = useCollection(dishesQuery);

  // Filter for valid orders based on standardized schema
  const validOrders = useMemo(() => {
    return orders?.filter(o => o.totalAmount !== undefined) || [];
  }, [orders]);

  const dailySalesData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), 13 - i);
      const label = format(date, 'MMM dd');
      const revenue = validOrders
        .filter(o => {
          if (!o.createdAt) return false;
          const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return isSameDay(orderDate, date);
        })
        .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      return { name: label, sales: revenue };
    });
  }, [validOrders]);

  const weeklyRevenueData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const date = subDays(new Date(), (5 - i) * 7);
      const weekStart = startOfWeek(date);
      const label = `Week ${format(weekStart, 'MM/dd')}`;
      const revenue = validOrders
        .filter(o => {
          if (!o.createdAt) return false;
          const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return isSameWeek(orderDate, weekStart);
        })
        .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      return { name: label, revenue };
    });
  }, [validOrders]);

  const topSellingItems = useMemo(() => {
    const performance: Record<string, { 
      id: string;
      name: string; 
      category: string; 
      totalOrders: number; 
      totalRevenue: number; 
      image: string 
    }> = {};

    validOrders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach((item: any) => {
        const dishId = item.dishId || item.id || item.name;
        if (!dishId) return;

        if (!performance[dishId]) {
          const catalogDish = dishes?.find(d => d.id === dishId || d.name === item.name);
          performance[dishId] = {
            id: dishId,
            name: item.name || catalogDish?.name || 'Unknown Dish',
            category: catalogDish?.category || 'General',
            totalOrders: 0,
            totalRevenue: 0,
            image: item.imageURL || catalogDish?.image || catalogDish?.imageURL || `https://picsum.photos/seed/${dishId}/200`
          };
        }
        
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        
        performance[dishId].totalOrders += qty;
        performance[dishId].totalRevenue += qty * price;
      });
    });

    return Object.values(performance)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }, [validOrders, dishes]);

  if (!isAuthorized) {
    return <div className="p-12 text-center font-bold text-muted-foreground">Unauthorized Access</div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-primary" />
          Sales Intelligence
        </h1>
        <p className="text-muted-foreground font-medium">Deep insights into standardized revenue streams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border shadow-sm rounded-[2rem] p-8 bg-white overflow-hidden">
          <CardHeader className="p-0 mb-8 flex items-center justify-between">
            <CardTitle className="text-xl font-headline font-black">Daily Trends</CardTitle>
            <TrendingUp className="w-5 h-5 text-primary opacity-20" />
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData}>
                <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.5)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border shadow-sm rounded-[2rem] p-8 bg-white overflow-hidden">
          <CardHeader className="p-0 mb-8 flex items-center justify-between">
            <CardTitle className="text-xl font-headline font-black">Weekly Revenue</CardTitle>
            <ShoppingBag className="w-5 h-5 text-accent opacity-20" />
          </CardHeader>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.5)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.3)' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-10 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline font-black">Menu Performance</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Real-time breakdown from standardized audit records.</p>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none">
                <TableHead className="font-black px-10 h-16 uppercase tracking-widest text-[10px]">Dish Name</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px]">Category</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px] text-center">Qty Sold</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px] text-right pr-10">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellingItems.map((dish) => (
                <TableRow key={dish.id} className="hover:bg-muted/5 transition-colors border-b last:border-none">
                  <TableCell className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden flex-shrink-0 border">
                        <img src={dish.image} alt={dish.name} className="object-cover w-full h-full" />
                      </div>
                      <span className="font-black">{dish.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full px-3 py-0.5 font-bold border-primary/20 text-primary uppercase text-[9px]">
                      {dish.category.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-center text-muted-foreground">
                    {dish.totalOrders.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-black text-right pr-10 text-primary text-lg">
                    ₹{dish.totalRevenue.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {topSellingItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-bold italic opacity-40">
                    No sales data recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}