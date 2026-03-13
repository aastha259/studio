
"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Search, Database, Sparkles, Loader2, BookOpen, RefreshCw } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, addDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const MENU_CATEGORIES = [
  'Pizza',
  'Burgers',
  'Biryani',
  'North Indian',
  'South Indian',
  'Chinese',
  'Fast Food',
  'Street Food',
  'Sandwiches',
  'Rolls & Wraps',
  'Pasta',
  'Salads',
  'Desserts',
  'Ice Cream',
  'Beverages'
];

export default function AdminDatabasePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const dishesQuery = useMemoFirebase(() => collection(db, 'dishes'), [db]);
  const { data: dishes } = useCollection(dishesQuery);

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this dish?`)) {
      await deleteDoc(doc(db, 'dishes', id));
      toast({ title: "Deleted", description: "Dish removed successfully." });
    }
  };

  const handleSyncDishes = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      let addedCount = 0;

      for (const category of MENU_CATEGORIES) {
        // Create 5 sample items per category for quick population
        for (let i = 1; i <= 5; i++) {
          const name = `${category} Special ${i}`;
          const q = query(collection(db, 'dishes'), where('name', '==', name));
          const snap = await getDocs(q);
          
          if (snap.empty) {
            const newDocRef = doc(collection(db, 'dishes'));
            batch.set(newDocRef, {
              name,
              category,
              price: 150 + (i * 50),
              description: `A delicious and authentic ${category} dish prepared with fresh ingredients.`,
              image: `https://picsum.photos/seed/${category}${i}/800/600`,
              rating: 4.0 + (Math.random()),
              isVeg: true,
              createdAt: new Date().toISOString(),
              totalOrders: 0,
              totalRevenue: 0
            });
            addedCount++;
          }
        }
      }

      await batch.commit();
      toast({ title: "Menu Synced", description: `Successfully added ${addedCount} dishes to the catalog.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddDish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDish = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      image: `https://picsum.photos/seed/${Date.now()}/800/600`,
      rating: 4.5,
      isVeg: formData.get('isVeg') === 'on',
      createdAt: new Date().toISOString(),
      totalOrders: 0,
      totalRevenue: 0
    };
    await addDoc(collection(db, 'dishes'), newDish);
    setIsAddDishOpen(false);
    toast({ title: "Dish Added", description: `${newDish.name} is now live.` });
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3 text-foreground">
            <Database className="w-10 h-10 text-primary" />
            Mega Repository
          </h1>
          <p className="text-muted-foreground font-medium">Manage your Bhartiya Swad menu repository.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleSyncDishes} 
            disabled={isSeeding}
            className="rounded-xl border-primary text-primary hover:bg-primary/5 font-bold h-11"
          >
            {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sync Sample Catalog
          </Button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search dishes..." 
              className="pl-10 h-11 bg-white rounded-xl border shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="p-6 border-b flex justify-between items-center bg-muted/20">
          <h3 className="font-bold text-lg">Catalog ({dishes?.length || 0})</h3>
          <Dialog open={isAddDishOpen} onOpenChange={setIsAddDishOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-headline font-black text-2xl text-primary">Add New Dish</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDish} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dish Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Special Pizza" className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" name="price" type="number" required placeholder="320" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select name="category" className="w-full h-10 px-3 border rounded-xl bg-white text-sm" required>
                      {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Short and tasty description..." className="rounded-xl" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isVeg" name="isVeg" defaultChecked className="w-4 h-4 rounded border-green-600 text-green-600 accent-green-600" />
                  <Label htmlFor="isVeg">Vegetarian</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full rounded-xl font-bold bg-primary h-12">Save Dish</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="max-h-[700px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-bold p-6">Dish</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Price</TableHead>
                <TableHead className="font-bold text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes?.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map((dish) => (
                <TableRow key={dish.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border bg-muted shrink-0">
                        <img src={dish.image} alt={dish.name} className="object-cover w-full h-full" />
                      </div>
                      <span className="font-bold text-sm">{dish.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dish.isVeg ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Veg</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Non-Veg</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full text-[10px]">{dish.category}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-primary">₹{dish.price}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete(dish.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
