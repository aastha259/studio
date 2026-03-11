
"use client"

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Utensils,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/lib/contexts/auth-context';
import { collection } from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, subDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

const COLORS = ['#E55C0A', '#C40A3A', '#FFD700', '#FFA500', '#4CAF50', '#2196F3'];

export default function AdminDashboardPage() {
  const db = useFirestore();
  const { user } = useAuth();

  // Firestore Data Fetching - Only run if admin is verified
  const ordersQuery = useMemoFirebase(() => {
    if (!user?.isAdmin) return null;
    return collection(db, 'orders');
  }, [db, user?.isAdmin]);
  const { data: orders } = useCollection(ordersQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!user?.isAdmin) return null;
    return collection(db, 'users');
  }, [db, user?.isAdmin]);
  const { data: users } = useCollection(usersQuery);

  const restaurantsQuery = useMemoFirebase(() => {
    if (!user?.isAdmin) return null;
    return collection(db, 'restaurants');
  }, [db, user?.isAdmin]);
  const { data: restaurants } = useCollection(restaurantsQuery);

  const foodsQuery = useMemoFirebase(() => {
    if (!user?.isAdmin) return null;
    return collection(db, 'foods');
  }, [db, user?.isAdmin]);
  const { data: foods } = useCollection(foodsQuery);

  const categoriesQuery = useMemoFirebase(() => {
    if (!user?.isAdmin) return null;
    return collection(db, 'categories');
  }, [db, user?.isAdmin]);
  const { data: categories } = useCollection(categoriesQuery);

  // Derived Summary Stats
  const stats = useMemo(() => {
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((acc, o) => acc + (o.totalAmount || 0), 0) || 0;
    const totalCustomers = users?.length || 0;
    const totalRestaurants = restaurants?.length || 0;

    return [
      { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', trend: '+12.5%', isUp: true },
      { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', trend: '+8.2%', isUp: true },
      { label: 'Total Customers', value: totalCustomers.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+5.4%', isUp: true },
      { label: 'Total Restaurants', value: totalRestaurants.toLocaleString(), icon: Store, color: 'text-green-500', bg: 'bg-green-500/10', trend: 'Live', isUp: true },
    ];
  }, [orders, users, restaurants]);

  // Daily Sales Trend (Last 7 Days)
  const dailyChartData = useMemo(() => {
    if (!orders) return [];
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayLabel = format(date, 'MMM dd');
      const dayOrders = orders.filter(o => o.orderDate && isSameDay(parseISO(o.orderDate), date));
      const revenue = dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      return { name: dayLabel, revenue };
    });
  }, [orders]);

  // Category-wise Sales Data
  const categoryChartData = useMemo(() => {
    if (!categories || !foods) return [];
    return categories.map(cat => {
      const catRevenue = foods
        .filter(f => f.categoryId === cat.id)
        .reduce((acc, f) => acc + (f.totalRevenue || 0), 0);
      return { name: cat.name, value: catRevenue };
    }).filter(d => d.value > 0).slice(0, 5);
  }, [categories, foods]);

  // Recent Orders (Last 5)
  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const dateA = a.orderDate ? parseISO(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? parseISO(b.orderDate).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 5);
  }, [orders]);

  // Top Customers
  const topCustomers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => (b.totalMoneySpent || 0) - (a.totalMoneySpent || 0)).slice(0, 5);
  }, [users]);

  if (!user?.isAdmin) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 text-primary">Executive Summary</h1>
          <p className="text-muted-foreground font-medium">Real-time performance tracking for Bhartiya Swad.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3 border font-bold text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{format(new Date(), 'EEEE, MMM dd, yyyy')}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all bg-white group">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg, stat.color)}>
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
              <h3 className="text-3xl font-black mt-2 tracking-tight">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border shadow-sm rounded-3xl p-8 bg-white h-[450px] flex flex-col">
          <div className="p-0 pb-6 flex flex-row items-center justify-between">
            <h3 className="text-xl font-headline font-bold">Revenue Trends (Last 7 Days)</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="rounded-full px-4 border-primary text-primary font-bold">Live</Badge>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border shadow-sm rounded-3xl p-8 bg-white h-[450px] flex flex-col">
          <div className="p-0 pb-6">
            <h3 className="text-xl font-headline font-bold">Category Distribution</h3>
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryChartData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">₹{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-headline font-bold">Recent Orders</CardTitle>
            <Button variant="ghost" className="text-primary font-bold text-sm">View All</Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold px-8 h-14">Order ID</TableHead>
                  <TableHead className="font-bold">Price</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/5 transition-colors border-b">
                    <TableCell className="px-8 font-mono text-[10px] font-bold">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-black text-primary">₹{(order.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase",
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                        order.status === 'Preparing' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {order.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-bold">
                      {order.orderDate ? format(parseISO(order.orderDate), 'p') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground font-bold italic">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Top Customers */}
        <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-headline font-bold">Top Customers</CardTitle>
            <Button variant="ghost" className="text-primary font-bold text-sm">View Insights</Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold px-8 h-14">Customer</TableHead>
                  <TableHead className="font-bold text-center">Orders</TableHead>
                  <TableHead className="font-bold text-right">Spent</TableHead>
                  <TableHead className="font-bold text-center">Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((cust, i) => (
                  <TableRow key={i} className="hover:bg-muted/5 transition-colors border-b">
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${cust.id}`} />
                          <AvatarFallback>{cust.displayName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm">{cust.displayName || 'Guest'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{cust.totalOrders || 0}</TableCell>
                    <TableCell className="text-right font-black text-primary">₹{(cust.totalMoneySpent || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase",
                        (cust.totalOrders || 0) >= 20 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-slate-100 text-slate-700'
                      )}>
                        {(cust.totalOrders || 0) >= 20 ? 'Gold' : (cust.totalOrders || 0) >= 10 ? 'Silver' : 'Regular'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {topCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground font-bold italic">
                      No customer data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
