
"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Search, Database, Sparkles, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminDatabasePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const foodsQuery = useMemoFirebase(() => collection(db, 'foods'), [db]);
  const { data: foods } = useCollection(foodsQuery);

  const restaurantsQuery = useMemoFirebase(() => collection(db, 'restaurants'), [db]);
  const { data: restaurants } = useCollection(restaurantsQuery);

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: users } = useCollection(usersQuery);

  const categoriesQuery = useMemoFirebase(() => collection(db, 'categories'), [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const handleDelete = async (collName: string, id: string) => {
    if (confirm(`Are you sure you want to delete this document from ${collName}?`)) {
      await deleteDoc(doc(db, collName, id));
      toast({ title: "Deleted", description: "Document removed successfully." });
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      await updateDoc(doc(db, 'foods', id), { price });
    }
  };

  const handleBootstrap = async () => {
    setIsBootstrapping(true);
    try {
      // 1. Define Categories
      const categoryNames = [
        'North Indian', 'South Indian', 'Street Food', 'Fast Food',
        'Chinese', 'Biryani', 'Sweets & Desserts', 'Beverages'
      ];
      
      const categoryMap: Record<string, string> = {};
      
      for (const name of categoryNames) {
        // Check if category already exists
        const q = query(collection(db, 'categories'), where('name', '==', name));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          const docRef = await addDoc(collection(db, 'categories'), {
            name,
            description: `Authentic ${name} dishes from across India.`
          });
          categoryMap[name] = docRef.id;
        } else {
          categoryMap[name] = snap.docs[0].id;
        }
      }

      // 2. Define Sample Foods
      const sampleFoods = [
        { name: 'Paneer Butter Masala', price: 280, cat: 'North Indian', desc: 'Creamy tomato gravy with soft cottage cheese cubes.', seed: '10' },
        { name: 'Masala Dosa', price: 120, cat: 'South Indian', desc: 'Crispy fermented crepe with spicy potato masala filling.', seed: '11' },
        { name: 'Chole Bhature', price: 150, cat: 'Street Food', desc: 'Spicy chickpea curry served with fluffy deep-fried leavened bread.', seed: '12' },
        { name: 'Butter Chicken', price: 350, cat: 'North Indian', desc: 'Classic tandoori chicken simmered in a rich makhani gravy.', seed: '13' },
        { name: 'Veg Biryani', price: 220, cat: 'Biryani', desc: 'Fragrant long-grain basmati rice cooked with garden-fresh vegetables.', seed: '14' },
        { name: 'Chicken Biryani', price: 320, cat: 'Biryani', desc: 'Authentic Hyderabadi style slow-cooked chicken and rice.', seed: '15' },
        { name: 'Pani Puri', price: 60, cat: 'Street Food', desc: 'Tangy and spicy flavored water filled in crispy wheat puris.', seed: '16' },
        { name: 'Samosa', price: 40, cat: 'Street Food', desc: 'Triangular pastry filled with spiced potatoes and green peas.', seed: '17' },
        { name: 'Pav Bhaji', price: 140, cat: 'Street Food', desc: 'Spicy mashed vegetable curry served with butter-toasted buns.', seed: '18' },
        { name: 'Vada Pav', price: 50, cat: 'Street Food', desc: 'The iconic Mumbai spicy potato fritter burger.', seed: '19' },
        { name: 'Margherita Pizza', price: 250, cat: 'Fast Food', desc: 'Classic sourdough base topped with fresh mozzarella and basil.', seed: '20' },
        { name: 'Hakka Noodles', price: 180, cat: 'Chinese', desc: 'Wok-tossed stir-fried noodles with crunchy vegetables.', seed: '21' },
        { name: 'Gulab Jamun', price: 80, cat: 'Sweets & Desserts', desc: 'Deep-fried milk solids balls soaked in rose-flavored sugar syrup.', seed: '22' },
        { name: 'Rasgulla', price: 70, cat: 'Sweets & Desserts', desc: 'Soft and spongy cottage cheese balls in light sugar syrup.', seed: '23' },
        { name: 'Cold Coffee', price: 100, cat: 'Beverages', desc: 'Rich and creamy chilled coffee topped with chocolate syrup.', seed: '24' },
        { name: 'Mango Lassi', price: 90, cat: 'Beverages', desc: 'Smooth and refreshing traditional yogurt drink with Alphonso mango.', seed: '25' },
      ];

      for (const item of sampleFoods) {
        // Check if food already exists
        const q = query(collection(db, 'foods'), where('name', '==', item.name));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await addDoc(collection(db, 'foods'), {
            name: item.name,
            price: item.price,
            description: item.desc,
            categoryId: categoryMap[item.cat],
            restaurantId: restaurants?.[0]?.id || 'admin-root',
            imageURL: `https://picsum.photos/seed/food-${item.seed}/600/400`,
            rating: parseFloat((4.2 + Math.random() * 0.7).toFixed(1)),
            trending: Math.random() > 0.7,
            totalOrders: Math.floor(Math.random() * 50),
            totalRevenue: 0
          });
        }
      }

      toast({
        title: "Database Initialized",
        description: "Signature dishes and categories have been added to the system."
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Bootstrap Failed",
        description: e.message
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleAddFood = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFood = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      categoryId: formData.get('categoryId') as string,
      restaurantId: restaurants?.[0]?.id || 'admin-root',
      description: formData.get('description') as string,
      imageURL: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/600/400`,
      rating: 4.5,
      trending: formData.get('trending') === 'on',
      totalOrders: 0,
      totalRevenue: 0
    };
    await addDoc(collection(db, 'foods'), newFood);
    setIsAddFoodOpen(false);
    toast({ title: "Item Added", description: `${newFood.name} is now live.` });
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCat = {
      name: formData.get('name') as string,
      description: formData.get('description') as string
    };
    await addDoc(collection(db, 'categories'), newCat);
    setIsAddCategoryOpen(false);
    toast({ title: "Category Created", description: `${newCat.name} is now available.` });
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
            <Database className="w-10 h-10 text-primary" />
            Collection Manager
          </h1>
          <p className="text-muted-foreground">Direct administrative access to all system data.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleBootstrap} 
            disabled={isBootstrapping}
            className="rounded-xl border-primary text-primary hover:bg-primary/5 font-bold h-11"
          >
            {isBootstrapping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Bootstrap Menu
          </Button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filter collection..." 
              className="pl-10 h-11 bg-white rounded-xl border shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="foods" className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl h-14 mb-8 shadow-sm flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="foods" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Foods</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Categories</TabsTrigger>
          <TabsTrigger value="restaurants" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Restaurants</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Users</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="foods">
          <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
            <div className="p-6 border-b flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-lg">Menu Catalog</h3>
              <Dialog open={isAddFoodOpen} onOpenChange={setIsAddFoodOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> New Dish
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-headline font-black text-2xl text-primary">Add Food Item</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddFood} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input id="name" name="name" required placeholder="e.g. Garlic Naan" className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input id="price" name="price" type="number" required placeholder="120" className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Category</Label>
                        <select name="categoryId" className="w-full h-10 px-3 border rounded-xl bg-white text-sm" required>
                          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" name="description" placeholder="A brief description..." className="rounded-xl" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="trending" name="trending" className="w-4 h-4 rounded border-primary text-primary accent-primary" />
                      <Label htmlFor="trending">Mark as Trending</Label>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full rounded-xl font-bold bg-primary h-12">Save Item</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold p-6">Name</TableHead>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Price (₹)</TableHead>
                  <TableHead className="font-bold text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foods?.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map((food) => (
                  <TableRow key={food.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border bg-muted shrink-0">
                          <img src={food.imageURL} alt={food.name} className="object-cover w-full h-full" />
                        </div>
                        <span className="font-bold">{food.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full">
                        {categories?.find(c => c.id === food.categoryId)?.name || 'Misc'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          defaultValue={food.price} 
                          className="w-24 h-9 font-bold bg-muted/30 border-none rounded-lg"
                          onBlur={(e) => handleUpdatePrice(food.id, e.target.value)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete('foods', food.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
            <div className="p-6 border-b flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-lg">System Categories</h3>
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-accent hover:bg-accent/90 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> New Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-headline font-black text-2xl text-accent">New Category</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCategory} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat_name">Name</Label>
                      <Input id="cat_name" name="name" required placeholder="e.g. North Indian" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat_desc">Description</Label>
                      <Input id="cat_desc" name="description" placeholder="Short summary..." className="rounded-xl" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full rounded-xl font-bold bg-accent h-12">Create Category</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold p-6">Category Name</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="font-bold text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="p-6 font-bold">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-sm truncate">{cat.description}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete('categories', cat.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="restaurants">
          <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold p-6">Partner Name</TableHead>
                  <TableHead className="font-bold">Location</TableHead>
                  <TableHead className="font-bold text-right">Revenue</TableHead>
                  <TableHead className="font-bold text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurants?.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="p-6 font-bold">{res.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{res.address}</TableCell>
                    <TableCell className="font-bold text-right text-green-600">₹{(res.totalRevenue || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete('restaurants', res.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border shadow-sm rounded-3xl overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold p-6">Full Name</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold text-right">Orders</TableHead>
                  <TableHead className="font-bold text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.filter(u => u.email?.toLowerCase().includes(search.toLowerCase())).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="p-6 font-bold">{u.displayName || 'Guest'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="font-bold text-right">{u.totalOrders || 0}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete('users', u.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
