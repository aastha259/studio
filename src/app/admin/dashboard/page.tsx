"use client"
import { normalizeOrder } from '@/lib/normalizeOrder';
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  Clock,
  Utensils,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, computeOrderStatus, STATUS_LABELS } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/lib/contexts/auth-context';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';

export default function AdminDashboardPage() {
  const db = useFirestore();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const isAuthorized = user?.isAdmin && user.email === 'xyz@admin.com';

  const ordersQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);
    return query(
      collection(db, 'orders'), 
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );
  }, [db, isAuthorized]);
  const { data: orders } = useCollection(ordersQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'users');
  }, [db, isAuthorized]);
  const { data: users } = useCollection(usersQuery);

  const restaurantsQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'restaurants');
  }, [db, isAuthorized]);
  const { data: restaurants } = useCollection(restaurantsQuery);

  const validOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .map(normalizeOrder)
      .filter(o => o && o.userId && o.totalAmount > 0);
  }, [orders]);

  const insights = useMemo(() => {
    if (validOrders.length === 0) return { peakHour: 'N/A', topDishes: [], topUsers: [] };

    // 1. Peak Hour Calculation
    const hourCounts: Record<number, number> = {};
    validOrders.forEach(o => {
      if (!o.createdAt) return;
      const date = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const peakHourFormatted = peakHour ? format(new Date().setHours(Number(peakHour)), 'p') : 'N/A';

    // 2. Top Selling Dishes
    const dishPerformance: Record<string, { name: string; qty: number; revenue: number }> = {};
    validOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        const id = item.dishId || item.name;
        if (!dishPerformance[id]) {
          dishPerformance[id] = { name: item.name, qty: 0, revenue: 0 };
        }
        dishPerformance[id].qty += Number(item.quantity) || 0;
        dishPerformance[id].revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
      });
    });
    const topDishes = Object.values(dishPerformance)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 3. Most Active Users
    const userOrderCounts: Record<string, number> = {};
    validOrders.forEach(o => {
      userOrderCounts[o.userId] = (userOrderCounts[o.userId] || 0) + 1;
    });
    const topUsers = Object.entries(userOrderCounts)
      .map(([uid, count]) => {
        const u = users?.find(user => user.uid === uid || user.id === uid);
        return {
          name: u?.displayName || u?.name || 'Guest User',
          email: u?.email || 'N/A',
          orders: count
        };
      })
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    return { peakHour: peakHourFormatted, topDishes, topUsers };
  }, [validOrders, users]);

  const stats = useMemo(() => {
    const totalOrdersCount = validOrders.length;
    const totalRevenue = validOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const activeCustomerIds = new Set(validOrders.map(o => o.userId).filter(Boolean));
    const totalCustomers = activeCustomerIds.size;
    const totalRestaurants = restaurants?.length || 0;

    return [
      { label: 'Revenue (30d)', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%', isUp: true },
      { label: 'Orders (30d)', value: totalOrdersCount.toLocaleString(), icon: ShoppingBag, color: 'text-accent', bg: 'bg-accent/10', trend: '+8%', isUp: true },
      { label: 'Active Users', value: totalCustomers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-600/10', trend: '+5%', isUp: true },
      { label: 'Peak Traffic', value: insights.peakHour, icon: Clock, color: 'text-green-600', bg: 'bg-green-600/10', trend: 'Live', isUp: true },
    ];
  }, [validOrders, restaurants, insights]);

  const dailyChartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayLabel = format(date, 'MMM dd');
      const revenue = validOrders
        .filter(o => {
          if (!o.createdAt) return false;
          const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return isSameDay(orderDate, date);
        })
        .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      return { name: dayLabel, revenue };
    });
  }, [validOrders]);

  if (!isAuthorized) {
    return <div className="p-12 text-center font-bold text-muted-foreground">Unauthorized Access</div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground font-medium">Real-time performance metrics derived from order data.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3 border font-bold text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{format(new Date(), 'MMMM dd, yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group p-2">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 shadow-sm", stat.bg, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest",
                  stat.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight text-foreground">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 border shadow-sm rounded-[2.5rem] p-8 md:p-12 bg-white h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-headline font-black text-foreground">Revenue Trends</h3>
              <p className="text-sm text-muted-foreground mt-1">Real-time daily revenue calculation.</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">Live Data</Badge>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.5)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: 'hsl(var(--muted-foreground))'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: 'hsl(var(--muted-foreground))'}} />
                <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={5} dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 10, shadow: '0 0 20px hsl(var(--primary)/0.5)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Users Card */}
        <Card className="border shadow-sm rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
          <CardHeader className="p-8 border-b bg-muted/10">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <CardTitle className="text-xl font-headline font-black">Top Customers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Table>
              <TableBody>
                {insights.topUsers.map((cust, i) => (
                  <TableRow key={i} className="hover:bg-muted/5 transition-colors border-b last:border-none">
                    <TableCell className="pl-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{cust.name}</span>
                        <span className="text-[10px] text-muted-foreground">{cust.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge className="bg-primary/10 text-primary border-none font-black">{cust.orders} Orders</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {insights.topUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-20 text-muted-foreground italic text-sm">No activity recorded yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card className="border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-10 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline font-black text-foreground">Menu Performance</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Top selling items by quantity sold.</p>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black px-10 h-16 uppercase tracking-widest text-[10px]">Dish Name</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px] text-center">Units Sold</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px] text-right pr-10">Est. Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.topDishes.map((dish, i) => (
                <TableRow key={i} className="hover:bg-muted/5 transition-colors border-b last:border-none">
                  <TableCell className="px-10 py-6">
                    <span className="font-black text-foreground">{dish.name}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-muted-foreground">{dish.qty.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <span className="font-black text-primary text-lg">₹{dish.revenue.toLocaleString()}</span>
                  </TableCell>
                </TableRow>
              ))}
              {insights.topDishes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20 text-muted-foreground font-bold italic opacity-40">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Waiting for sales data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-10 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline font-black text-foreground">Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">The latest validated order records.</p>
          </div>
          <Link href="/admin/orders">
            <Button variant="outline" className="rounded-xl font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all">
              View All Orders
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black px-10 h-16 uppercase tracking-widest text-[10px]">Order ID</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px]">Revenue</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-black h-16 uppercase tracking-widest text-[10px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validOrders.slice(0, 5).map((order) => {
                const statusKey = computeOrderStatus(order.createdAt);
                const statusLabel = STATUS_LABELS[statusKey];
                return (
                  <TableRow key={order.id} className="hover:bg-muted/5 transition-colors border-b last:border-none group">
                    <TableCell className="px-10 font-mono text-xs font-bold text-muted-foreground">#{(order.orderId || order.id).slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="font-black text-primary text-lg">₹{(order.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-4 py-1 font-bold text-[10px] uppercase tracking-wider border-none",
                        statusKey === 'delivered' ? 'bg-green-100 text-green-700' : 
                        statusKey === 'preparing' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-bold italic">
                      {order.createdAt ? format(order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt), 'p, MMM dd') : 'Just now'}
                    </TableCell>
                  </TableRow>
                )
              })}
              {validOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-bold italic opacity-40">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    Waiting for new orders...
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
