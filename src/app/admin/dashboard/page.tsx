
"use client"

import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Utensils
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  // Mock Summary Stats
  const stats = [
    { label: 'Total Orders', value: '1,284', icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10', trend: '+12.5%', isUp: true },
    { label: 'Total Revenue', value: '₹4,82,900', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', trend: '+8.2%', isUp: true },
    { label: 'Total Customers', value: '842', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+5.4%', isUp: true },
    { label: 'Total Restaurants', value: '24', icon: Store, color: 'text-green-500', bg: 'bg-green-500/10', trend: 'Live', isUp: true },
  ];

  // Mock Recent Orders
  const recentOrders = [
    { id: 'ORD-7281', customer: 'Arjun Mehta', items: 'Paneer Butter Masala x2', price: '₹440', status: 'Preparing', date: '2 mins ago' },
    { id: 'ORD-7280', customer: 'Priya Sharma', items: 'Masala Dosa, Mango Lassi', price: '₹210', status: 'Delivered', date: '15 mins ago' },
    { id: 'ORD-7279', customer: 'Rahul K.', items: 'Butter Chicken, Garlic Naan', price: '₹520', status: 'Out for Delivery', date: '28 mins ago' },
    { id: 'ORD-7278', customer: 'Sonia G.', items: 'Vada Pav x4', price: '₹160', status: 'Delivered', date: '45 mins ago' },
  ];

  // Mock Top Customers
  const topCustomers = [
    { name: 'Anjali R.', orders: 42, spent: '₹12,400', status: 'Gold' },
    { name: 'Vikram Singh', orders: 28, spent: '₹8,900', status: 'Gold' },
    { name: 'Neha Kapoor', orders: 15, spent: '₹4,200', status: 'Silver' },
    { name: 'Amit Shah', orders: 12, spent: '₹3,850', status: 'Silver' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2">Executive Summary</h1>
          <p className="text-muted-foreground font-medium">Overview of Bhartiya Swad performance metrics.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3 border font-bold text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span>Last updated: Just now</span>
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

      {/* Analytics Graph Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border shadow-sm rounded-3xl p-8 bg-white h-[450px] flex flex-col">
          <div className="p-0 pb-6 flex flex-row items-center justify-between">
            <h3 className="text-xl font-headline font-bold">Revenue Trends</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="rounded-full px-4 cursor-pointer hover:bg-muted">Weekly</Badge>
              <Badge className="rounded-full px-4 cursor-pointer">Daily</Badge>
            </div>
          </div>
          <div className="flex-1 bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center flex-col opacity-60">
            <TrendingUp className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="font-bold text-muted-foreground">Daily Sales Graph Placeholder</p>
            <p className="text-xs text-muted-foreground">Chart initialization in progress...</p>
          </div>
        </Card>

        <Card className="border shadow-sm rounded-3xl p-8 bg-white h-[450px] flex flex-col">
          <div className="p-0 pb-6">
            <h3 className="text-xl font-headline font-bold">Top Selling Foods</h3>
          </div>
          <div className="flex-1 bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center flex-col opacity-60">
            <Utensils className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="font-bold text-muted-foreground text-center px-4">Weekly Revenue Chart Placeholder</p>
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
                  <TableHead className="font-bold">Items</TableHead>
                  <TableHead className="font-bold">Price</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/5 transition-colors border-b">
                    <TableCell className="px-8 font-mono text-xs font-bold">{order.id}</TableCell>
                    <TableCell>
                      <p className="font-bold text-sm">{order.items}</p>
                      <p className="text-[10px] text-muted-foreground">{order.customer}</p>
                    </TableCell>
                    <TableCell className="font-black text-primary">{order.price}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase",
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                        order.status === 'Preparing' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${cust.name}`} />
                          <AvatarFallback>{cust.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm">{cust.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">{cust.orders}</TableCell>
                    <TableCell className="text-right font-black text-primary">{cust.spent}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-full px-3 py-1 font-bold text-[10px] uppercase",
                        cust.status === 'Gold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-slate-100 text-slate-700'
                      )}>
                        {cust.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
