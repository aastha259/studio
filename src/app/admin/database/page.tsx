
"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Search, Database } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminDatabasePage() {
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const foodsQuery = useMemoFirebase(() => collection(db, 'foods'), [db]);
  const { data: foods } = useCollection(foodsQuery);

  const restaurantsQuery = useMemoFirebase(() => collection(db, 'restaurants'), [db]);
  const { data: restaurants } = useCollection(restaurantsQuery);

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: users } = useCollection(usersQuery);

  const categoriesQuery = useMemoFirebase(() => collection(db, 'categories'), [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const ordersQuery = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const { data: orders } = useCollection(ordersQuery);

  const handleDelete = async (collName: string, id: string) => {
    if (confirm(`Are you sure you want to delete this document from ${collName}?`)) {
      await deleteDoc(doc(db, collName, id));
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      await updateDoc(doc(db, 'foods', id), { price });
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
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Filter collection..." 
            className="pl-10 h-11 bg-white rounded-xl border shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                    <TableCell className="p-6 font-bold">{food.name}</TableCell>
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
