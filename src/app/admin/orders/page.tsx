
"use client"

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminOrdersPage() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-primary" />
            Order Management
          </h1>
          <p className="text-muted-foreground font-medium">Monitor and process live customer orders.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Find order ID..." className="pl-10 h-11 bg-white rounded-xl shadow-sm border" />
          </div>
          <Button variant="outline" className="h-11 px-6 rounded-xl font-bold gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
        <div className="bg-muted/20 p-8 border-b">
            <h3 className="font-bold text-lg">Live Order Stream</h3>
        </div>
        <div className="p-8 flex items-center justify-center min-h-[400px] opacity-40">
           <div className="text-center">
             <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
             <p className="font-bold text-xl">Incoming Order Queue</p>
             <p className="text-sm">Real-time connection pending...</p>
           </div>
        </div>
      </Card>
    </div>
  );
}
