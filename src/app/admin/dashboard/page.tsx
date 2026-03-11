
"use client"

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ChefHat,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const db = useFirestore();

  const ordersQuery = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const { data: orders } = useCollection(ordersQuery);

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: users } = useCollection(usersQuery);

  const restaurantsQuery = useMemoFirebase(() => collection(db, 'restaurants'), [db]);
  const { data: restaurants } = useCollection(restaurantsQuery);

  const totalRevenue = orders?.reduce((acc, order) => acc + (order.totalAmount || 0), 0) || 0;
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders?.filter(order => order.orderDate?.startsWith(today)).length || 0;

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = days.map(day => ({ name: day, revenue: 0 }));
    
    orders?.forEach(order => {
      const date = new Date(order.orderDate);
      const dayName = days[date.getDay()];
      const item = result.find(d => d.name === dayName);
      if (item) item.revenue += order.totalAmount || 0;
    });
    
    return result;
  }, [orders]);

  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary', trend: '+12.5%', isUp: true },
    { label: 'Total Orders', value: orders?.length || 0, icon: ShoppingBag, color: 'text-blue-500', trend: '+8.2%', isUp: true },
    { label: 'Total Customers', value: users?.length || 0, icon: Users, color: 'text-green-500', trend: '+5.4%', isUp: true },
    { label: 'Total Restaurants', value: restaurants?.length || 0, icon: ChefHat, color: 'text-accent', trend: 'Live', isUp: true },
  ];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2">Executive Summary</h1>
          <p className="text-muted-foreground">Real-time performance metrics for Bhartiya Swad.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3 border">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="font-bold text-sm">System Live: {today}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all bg-white border">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-4 rounded-2xl bg-muted/50 group-hover:scale-110 transition-transform", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full",
                  stat.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border shadow-sm rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-headline font-bold">Revenue Growth</CardTitle>
          </CardHeader>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border shadow-sm rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-headline font-bold">Sales Distribution</CardTitle>
          </CardHeader>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)', radius: 8 }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
