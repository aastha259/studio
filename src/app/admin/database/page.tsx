
"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Search, Database, Loader2, Sparkles, Flame } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const MENU_CATEGORIES = [
  'PIZZAS',
  'BURGERS',
  'NORTH_INDIAN',
  'SOUTH_INDIAN',
  'STREET_FOOD',
  'DESSERTS_ICE_CREAM',
  'BEVERAGES'
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

  const handleMegaSeed500 = async () => {
    setIsSeeding(true);
    toast({ title: "Seeding Started", description: "Generating 500+ unique dishes..." });
    
    try {
      const templates: Record<string, { count: number; prefixes: string[]; items: string[]; keywords: string[] }> = {
        PIZZAS: {
          count: 65,
          prefixes: ['Artisanal', 'Classic', 'Double Cheese', 'Spicy', 'Tandoori', 'Peri Peri', 'Garden', 'Gourmet', 'Wood-fired', 'Spicy'],
          items: ['Margherita', 'Paneer Tikka', 'Veggie Delight', 'Farmhouse', 'Mexican Green Wave', 'Cheese N Corn', 'Mushroom Special', 'Hawaiian', 'Zesty Veg'],
          keywords: ['pizza', 'cheese']
        },
        BURGERS: {
          count: 65,
          prefixes: ['Maharaja', 'Spicy', 'Crispy', 'Supreme', 'Giant', 'Zesty', 'Grilled', 'Smoky', 'Double', 'Royal'],
          items: ['Veggie Burger', 'Aloo Tikki', 'Paneer Burger', 'Cheese Lava', 'Mexican Burger', 'Schezwan Burger', 'Garden Burger', 'Monster Veg'],
          keywords: ['burger', 'sandwich']
        },
        NORTH_INDIAN: {
          count: 85,
          prefixes: ['Shahi', 'Kadai', 'Butter', 'Dal', 'Paneer', 'Dum', 'Malai', 'Special', 'Makhani', 'Dhaba Style'],
          items: ['Makhani', 'Masala', 'Kofta', 'Tadka', 'Gravy', 'Do Pyaza', 'Pasanda', 'Korma', 'Handi Paneer'],
          keywords: ['curry', 'indian-food']
        },
        SOUTH_INDIAN: {
          count: 85,
          prefixes: ['Mysore', 'Rava', 'Masala', 'Ghee Roast', 'Onion', 'Gunpowder', 'Paper', 'Neer', 'Malabar'],
          items: ['Dosa', 'Idli', 'Uttapam', 'Vada', 'Appam', 'Paniyaram', 'Parotta', 'Karam Dosa'],
          keywords: ['dosa', 'idli']
        },
        STREET_FOOD: {
          count: 85,
          prefixes: ['Bombay', 'Delhi', 'Special', 'Masala', 'Tangy', 'Crunchy', 'Street Style', 'Vada', 'Samosa'],
          items: ['Pav Bhaji', 'Vada Pav', 'Pani Puri', 'Bhel Puri', 'Samosa Chaat', 'Aloo Tikki', 'Dabeli', 'Misal Pav'],
          keywords: ['chaat', 'street-food']
        },
        DESSERTS_ICE_CREAM: {
          count: 65,
          prefixes: ['Sweet', 'Royal', 'Hot', 'Gulab', 'Rich', 'Kesari', 'Belgian', 'Natural', 'Creamy', 'Exotic'],
          items: ['Jamun', 'Rasmalai', 'Halwa', 'Ladoo', 'Jalebi', 'Rabri', 'Chocolate', 'Vanilla', 'Mango', 'Butterscotch'],
          keywords: ['dessert', 'ice-cream']
        },
        BEVERAGES: {
          count: 85,
          prefixes: ['Fresh', 'Chilled', 'Masala', 'Sweet', 'Zesty', 'Organic', 'Fruit', 'Cold', 'Iced'],
          items: ['Lassi', 'Coffee', 'Tea', 'Shake', 'Mojito', 'Lemonade', 'Juice', 'Smoothie', 'Frappe'],
          keywords: ['beverage', 'drink']
        }
      };

      const allItems: any[] = [];
      
      Object.entries(templates).forEach(([category, config]) => {
        for (let i = 0; i < config.count; i++) {
          const prefix = config.prefixes[Math.floor(Math.random() * config.prefixes.length)];
          const item = config.items[Math.floor(Math.random() * config.items.length)];
          const name = `${prefix} ${item} #${i + 1}`;
          
          allItems.push({
            name,
            category,
            price: Math.floor(Math.random() * (450 - 60 + 1) + 60),
            image: `https://picsum.photos/seed/${category.toLowerCase()}${i}/800/600`,
            description: `Authentic ${name} prepared with premium ingredients and traditional recipes.`,
            isVeg: Math.random() > 0.15, // Most are veg in Bhartiya Swad
            rating: parseFloat((Math.random() * (4.8 - 3.5) + 3.5).toFixed(1)),
            totalOrders: 0,
            totalRevenue: 0,
            createdAt: new Date().toISOString()
          });
        }
      });

      // Firestore Batch Write (Max 500 per batch)
      // We divide our items into chunks of 450 to stay safe
      const CHUNK_SIZE = 450;
      for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        const chunk = allItems.slice(i, i + CHUNK_SIZE);
        
        chunk.forEach(item => {
          const newDocRef = doc(collection(db, 'dishes'));
          batch.set(newDocRef, item);
        });
        
        await batch.commit();
        console.log(`Committed batch ${Math.floor(i/CHUNK_SIZE) + 1}`);
      }

      toast({ title: "Sync Complete", description: `Successfully added ${allItems.length} unique dishes to your repository.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Seeding Failed", description: e.message });
      console.error(e);
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
          <p className="text-muted-foreground font-medium">Manage your authentic Indian menu catalog ({dishes?.length || 0} items).</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <Button 
            variant="default" 
            onClick={handleMegaSeed500} 
            disabled={isSeeding}
            className="rounded-xl bg-accent hover:bg-accent/90 text-white font-black h-11 px-6 shadow-lg shadow-accent/20 transition-all group overflow-hidden relative"
          >
            {isSeeding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 group-hover:animate-bounce" />
            )}
            <span className="relative z-10">SYNC 500+ DISHES</span>
            {!isSeeding && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
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
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Catalog Stream
          </h3>
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
                  <Input id="name" name="name" required placeholder="e.g. Paneer Tikka" className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" name="price" type="number" required placeholder="320" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select name="category" className="w-full h-10 px-3 border rounded-xl bg-white text-sm" required>
                      {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Authentic Indian description..." className="rounded-xl" />
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
                      <div className="w-12 h-12 rounded-xl overflow-hidden border bg-muted shrink-0 shadow-sm">
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
                      {dish.category.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-primary">₹{dish.price}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete(dish.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!dishes || dishes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 opacity-30">
                    <Database className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-bold italic">No dishes in repository.</p>
                    <p className="text-sm">Click "SYNC 500+ DISHES" to populate.</p>
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
