
"use client"

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const COLORS = ['#E55C0A', '#C40A3A', '#FFD700', '#FFA500', '#4CAF50', '#2196F3'];

export default function AdminSalesPage() {
  const db = useFirestore();

  const foodsQuery = useMemoFirebase(() => collection(db, 'foods'), [db]);
  const { data: foods } = useCollection(foodsQuery);

  const categoriesQuery = useMemoFirebase(() => collection(db, 'categories'), [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const categoryData = categories?.map((cat, i) => {
    const totalRev = foods?.filter(f => f.categoryId === cat.id).reduce((acc, f) => acc + (f.totalRevenue || 0), 0) || 0;
    return { name: cat.name, value: totalRev };
  }).filter(d => d.value > 0) || [];

  const topSellingItems = foods?.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0)).slice(0, 5) || [];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-headline font-black mb-2">Sales Analytics</h1>
        <p className="text-muted-foreground">Detailed performance tracking for dishes and categories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border shadow-sm rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-headline font-bold">Top Dishes by Orders</CardTitle>
          </CardHeader>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topSellingItems}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{fontSize: 12, fontWeight: 700}} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="totalOrders" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border shadow-sm rounded-3xl p-8 bg-white">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-headline font-bold">Category Shares</CardTitle>
          </CardHeader>
          <div className="h-[400px] flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="250">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
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

      <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="p-8 border-b">
          <CardTitle className="text-xl font-headline font-bold">Menu Performance Table</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold p-6">Food Name</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold text-center">Orders</TableHead>
              <TableHead className="font-bold text-right">Revenue</TableHead>
              <TableHead className="font-bold text-center pr-6">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {foods?.map((food) => (
              <TableRow key={food.id} className="hover:bg-muted/5">
                <TableCell className="p-6 font-bold">{food.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-full">
                    {categories?.find(c => c.id === food.categoryId)?.name || 'Misc'}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-center">{food.totalOrders || 0}</TableCell>
                <TableCell className="font-bold text-primary text-right">₹{(food.totalRevenue || 0).toLocaleString()}</TableCell>
                <TableCell className="text-center pr-6">
                  <div className="flex items-center justify-center gap-1 font-bold">
                    <span className="text-yellow-500">★</span> {food.rating || '4.5'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
