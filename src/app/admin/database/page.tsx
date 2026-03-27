
"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Search, Database, Loader2, Sparkles, Flame, AlertCircle } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, doc, deleteDoc, addDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export const MENU_CATEGORIES = [
  'PIZZAS',
  'BURGERS',
  'NORTH_INDIAN',
  'SOUTH_INDIAN',
  'STREET_FOOD',
  'DESSERTS',
  'BEVERAGES'
];

export default function AdminDatabasePage() {
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const dishesQuery = useMemoFirebase(() => {
    return query(collection(db, 'dishes'), limit(300));
  }, [db]);
  const { data: dishes, isLoading, error } = useCollection(dishesQuery);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const deleteToast = toast.loading("Deleting dish...");
    try {
      await deleteDoc(doc(db, 'dishes', id));
      toast.success("Dish removed successfully", { id: deleteToast });
    } catch (e: any) {
      toast.error("Failed to delete dish", { id: deleteToast });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleMegaSeed500 = async () => {
    setIsSeeding(true);
    const seedToast = toast.loading("Seeding mega repository...");
    
    try {
      const resSnap = await getDocs(collection(db, 'restaurants'));
      let restaurantIds = resSnap.docs.map(d => d.id);

      if (restaurantIds.length === 0) {
        toast.loading("Adding base restaurants...", { id: seedToast });
        const batch = writeBatch(db);
        const resNames = ['Royal Punjab', 'South Spice', 'The Pizza Co.', 'Burger King Indian', 'Street Delights'];
        const newResIds: string[] = [];
        resNames.forEach(name => {
          const ref = doc(collection(db, 'restaurants'));
          batch.set(ref, {
            name,
            address: 'Main Street, Bharat',
            phone: '+91 9876543210',
            email: `contact@${name.toLowerCase().replace(' ', '')}.com`,
            imageURL: `https://picsum.photos/seed/${name}/600/400`,
            averageRating: 4.5,
            totalOrders: 0,
            totalRevenue: 0
          });
          newResIds.push(ref.id);
        });
        await batch.commit();
        restaurantIds = newResIds;
      }

      const templates: Record<string, { count: number; prefixes: string[]; items: string[]; keywords: string[] }> = {
        PIZZAS: { count: 20, prefixes: ['Artisanal', 'Classic', 'Double Cheese', 'Spicy'], items: ['Margherita', 'Paneer Tikka', 'Veggie Delight'], keywords: ['pizza'] },
        BURGERS: { count: 20, prefixes: ['Maharaja', 'Spicy', 'Crispy', 'Supreme'], items: ['Veggie Burger', 'Aloo Tikki', 'Paneer Burger'], keywords: ['burger'] }
      };

      const allItems: any[] = [];
      Object.entries(templates).forEach(([category, config]) => {
        for (let i = 0; i < config.count; i++) {
          const prefix = config.prefixes[Math.floor(Math.random() * config.prefixes.length)];
          const item = config.items[Math.floor(Math.random() * config.items.length)];
          const name = `${prefix} ${item} #${i + 1}`;
          allItems.push({
            name, category, price: Math.floor(Math.random() * (450 - 60 + 1) + 60),
            image: `https://picsum.photos/seed/${category.toLowerCase()}${i}/800/600`,
            description: `Authentic ${name} prepared with premium ingredients.`,
            isVeg: Math.random() > 0.15,
            rating: parseFloat((Math.random() * (4.8 - 3.5) + 3.5).toFixed(1)),
            totalOrders: Math.floor(Math.random() * 200),
            totalRevenue: 0,
            restaurantId: restaurantIds[Math.floor(Math.random() * restaurantIds.length)],
            createdAt: new Date().toISOString()
          });
        }
      });

      const batch = writeBatch(db);
      allItems.forEach(item => {
        const newDocRef = doc(collection(db, 'dishes'));
        batch.set(newDocRef, item);
      });
      await batch.commit();

      toast.success(`Successfully added ${allItems.length} unique dishes.`, { id: seedToast });
    } catch (e: any) {
      console.error("Seeding error:", e);
      toast.error("Repository sync failed.", { id: seedToast });
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
      totalRevenue: 0,
      restaurantId: ''
    };

    const addToast = toast.loading("Adding new dish...");
    try {
      await addDoc(collection(db, 'dishes'), newDish);
      setIsAddDishOpen(false);
      toast.success(`${newDish.name} is now live!`, { id: addToast });
    } catch (err: any) {
      toast.error("Failed to add dish.", { id: addToast });
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3 text-foreground">
            <Database className="w-10 h-10 text-primary" />
            Mega Repository
          </h1>
          <p className="text-muted-foreground font-medium">Manage your catalog (Showing first {dishes?.length || 0} items).</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <Button 
            variant="default" 
            onClick={handleMegaSeed500} 
            disabled={isSeeding}
            className="rounded-xl bg-accent hover:bg-accent/90 text-white font-black h-11 px-6 shadow-lg shadow-accent/20 transition-all group overflow-hidden relative active:scale-95"
          >
            {isSeeding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            )}
            <span className="relative z-10">{isSeeding ? "SYNCING..." : "SYNC DATA"}</span>
          </Button>
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search dishes..." 
              className="pl-10 h-11 bg-white rounded-xl border shadow-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-6 rounded-3xl flex items-center gap-4 border border-destructive/20 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6" />
          <p className="font-bold">Error loading repository: {error.message}</p>
        </div>
      )}

      <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="p-6 border-b flex justify-between items-center bg-muted/20">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Catalog Stream
          </h3>
          <Dialog open={isAddDishOpen} onOpenChange={setIsAddDishOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold transition-transform active:scale-95">
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
                  <Input id="name" name="name" required placeholder="e.g. Paneer Tikka" className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" name="price" type="number" required placeholder="320" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select name="category" className="w-full h-10 px-3 border rounded-xl bg-white text-sm focus:ring-primary/20" required>
                      {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Description..." className="rounded-xl" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isVeg" name="isVeg" defaultChecked className="w-4 h-4 rounded border-green-600 text-green-600 accent-green-600" />
                  <Label htmlFor="isVeg">Vegetarian</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full rounded-xl font-bold bg-primary h-12 shadow-lg active:scale-95">Save Dish</Button>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : dishes?.filter(d => d.name?.toLowerCase().includes(search.toLowerCase())).map((dish) => (
                <TableRow key={dish.id} className="hover:bg-muted/5 transition-colors group">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border bg-muted shrink-0 shadow-sm transition-transform group-hover:scale-110">
                        <img src={dish.image} alt={dish.name} className="object-cover w-full h-full" />
                      </div>
                      <span className="font-bold text-sm text-foreground">{dish.name}</span>
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
                    <Badge variant="outline" className="rounded-full text-[10px] uppercase font-bold text-muted-foreground">
                      {dish.category?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-primary">₹{dish.price}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-lg text-muted-foreground hover:text-destructive transition-all active:scale-90" 
                      onClick={() => {
                        if(confirm(`Remove ${dish.name}?`)) handleDelete(dish.id);
                      }}
                      disabled={isDeleting === dish.id}
                    >
                      {isDeleting === dish.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {dishes?.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <Database className="w-16 h-16" />
                      <p className="font-bold italic text-xl">Repository is empty</p>
                      <p className="text-sm">Click Sync Data to onboard items</p>
                    </div>
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
