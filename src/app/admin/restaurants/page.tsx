
"use client"

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminRestaurantsPage() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
            <Store className="w-10 h-10 text-primary" />
            Partners
          </h1>
          <p className="text-muted-foreground font-medium">Manage restaurant locations and performance.</p>
        </div>
        <Button className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2">
          <Plus className="w-5 h-5" />
          Add Restaurant
        </Button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search partners..." className="pl-10 h-12 bg-white rounded-2xl shadow-sm border-none ring-1 ring-primary/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white h-64 flex flex-col items-center justify-center opacity-40">
             <Store className="w-12 h-12 mb-4 text-muted-foreground" />
             <p className="font-bold">Partner Card Placeholder</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
