
"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Search, Database, Sparkles, Loader2, Leaf, Beef } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, addDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES_DATA = [
  { name: 'Pizza', description: 'Cheesy delights from classic Margherita to exotic toppings.', seed: 'pizza' },
  { name: 'Burgers', description: 'Juicy, flame-grilled burgers with unique flavor profiles.', seed: 'burger' },
  { name: 'Biryani', description: 'Fragrant and flavorful rice dishes cooked with spices and love.', seed: 'biryani' },
  { name: 'North Indian', description: 'Rich and hearty classics from the heart of Northern India.', seed: 'north-indian' },
  { name: 'South Indian', description: 'Light, fermented, and flavorful dishes from the South.', seed: 'south-indian' },
  { name: 'Chinese', description: 'The perfect Indo-Chinese fusion of spice and tang.', seed: 'chinese' },
  { name: 'Fast Food', description: 'Quick bites for when you are on the go.', seed: 'fast-food' },
  { name: 'Sandwiches', description: 'Freshly toasted bread with delicious fillings.', seed: 'sandwich' },
  { name: 'Rolls & Wraps', description: 'Spicy fillings wrapped in soft parathas.', seed: 'wrap' },
  { name: 'Pasta', description: 'Authentic Italian pasta with a variety of rich sauces.', seed: 'pasta' },
  { name: 'Salads', description: 'Fresh, crunchy, and healthy greens.', seed: 'salad' },
  { name: 'Street Food', description: 'The authentic taste of Indian streets.', seed: 'street-food' },
  { name: 'Desserts', description: 'Sweet endings for a perfect meal.', seed: 'sweets' },
  { name: 'Ice Cream', description: 'Chilled delights in every flavor.', seed: 'icecream' },
  { name: 'Beverages', description: 'Refreshing drinks to complement your meal.', seed: 'drinks' },
];

const DISH_TEMPLATES: Record<string, { veg: string[], nonVeg: string[] }> = {
  'Pizza': {
    veg: ['Margherita', 'Farmhouse', 'Paneer Tikka Pizza', 'Veg Extravaganza', 'Cheese Burst', 'Double Cheese Margherita', 'Peppy Paneer', 'Mexican Green Wave', 'Spicy Triple Tango', 'Veggie Paradise', 'Cloud 9', 'Indi Tandoori Paneer'],
    nonVeg: ['Chicken Golden Delight', 'Non Veg Supreme', 'Chicken Dominator', 'Pepper Barbecue Chicken', 'Chicken Fiesta', 'Indi Chicken Tikka', 'Spicy Chicken', 'Chicken Keema']
  },
  'Burgers': {
    veg: ['Aloo Tikki Burger', 'Cheese Lava Burger', 'Spicy Paneer Burger', 'Veg Whopper', 'Crispy Veg Burger', 'Mushroom Burger', 'Veg Double Cheese', 'Herb Chili Burger'],
    nonVeg: ['Chicken Whopper', 'Crispy Chicken Burger', 'Chicken Cheese Lava', 'Chicken Steak Burger', 'BBQ Chicken Burger', 'Spicy Chicken Fillet']
  },
  'Biryani': {
    veg: ['Hyderabadi Veg Biryani', 'Paneer Biryani', 'Mushroom Biryani', 'Dum Veg Biryani', 'Kolkata Veg Biryani', 'Lucknowi Tarkari Biryani', 'Subz-e-Biryani'],
    nonVeg: ['Chicken Dum Biryani', 'Mutton Dum Biryani', 'Egg Biryani', 'Ambur Chicken Biryani', 'Malabar Mutton Biryani', 'Tandoori Chicken Biryani']
  },
  'North Indian': {
    veg: ['Paneer Butter Masala', 'Dal Makhani', 'Shahi Paneer', 'Malai Kofta', 'Mix Veg', 'Palak Paneer', 'Chole Masala', 'Kadai Paneer', 'Jeera Aloo'],
    nonVeg: ['Butter Chicken', 'Chicken Tikka Masala', 'Mutton Rogan Josh', 'Chicken Curry', 'Rara Chicken', 'Mutton Korma', 'Handi Chicken']
  },
  'South Indian': {
    veg: ['Masala Dosa', 'Idli Sambhar', 'Medu Vada', 'Rava Dosa', 'Onion Uttapam', 'Paper Plain Dosa', 'Ghee Roast Dosa', 'Lemon Rice', 'Curd Rice'],
    nonVeg: ['Chicken 65', 'Andhra Chicken Curry', 'Chettinad Chicken', 'Kerala Fish Curry', 'Mutton Sukka']
  },
  'Chinese': {
    veg: ['Veg Hakka Noodles', 'Veg Manchurian', 'Schezwan Noodles', 'Veg Fried Rice', 'Chili Paneer', 'Honey Chili Potato', 'Veg Spring Rolls'],
    nonVeg: ['Chicken Hakka Noodles', 'Chicken Manchurian', 'Chili Chicken', 'Chicken Fried Rice', 'Dragon Chicken', 'Chicken Lollipops']
  },
  'Desserts': {
    veg: ['Gulab Jamun', 'Rasmalai', 'Chocolate Lava Cake', 'Brownie with Ice Cream', 'Kheer', 'Gajar ka Halwa', 'Pastry', 'Cupcake', 'Waffles'],
    nonVeg: []
  },
  'Beverages': {
    veg: ['Cold Coffee', 'Mango Shake', 'Lemon Soda', 'Mojito', 'Iced Tea', 'Lassi', 'Masala Chai', 'Cold Drink', 'Fruit Juice'],
    nonVeg: []
  }
};

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
      const categoryMap: Record<string, string> = {};
      
      // 1. Create Categories
      for (const cat of CATEGORIES_DATA) {
        const q = query(collection(db, 'categories'), where('name', '==', cat.name));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          const docRef = await addDoc(collection(db, 'categories'), {
            name: cat.name,
            description: cat.description
          });
          categoryMap[cat.name] = docRef.id;
        } else {
          categoryMap[cat.name] = snap.docs[0].id;
        }
      }

      // 2. Generate Dishes (300+ items)
      let totalDishesCreated = 0;
      const restaurantId = restaurants?.[0]?.id || 'admin-root';

      for (const catName of CATEGORIES_DATA.map(c => c.name)) {
        const templates = DISH_TEMPLATES[catName] || { veg: [`Classic ${catName}`, `Special ${catName}`, `Spicy ${catName}`, `Garden ${catName}`, `Gourmet ${catName}`, `Chef Choice ${catName}`], nonVeg: [`Chicken ${catName}`, `Mutton ${catName}`, `Egg ${catName}`] };
        
        // Generate Veg Items (about 15-20 per category)
        const vegItems = [...templates.veg];
        while (vegItems.length < 15) {
          vegItems.push(`${['Double', 'Triple', 'Extra', 'Ultimate', 'Spicy', 'Royal'][Math.floor(Math.random() * 6)]} ${templates.veg[Math.floor(Math.random() * templates.veg.length)]}`);
        }

        for (const itemName of vegItems) {
          const q = query(collection(db, 'foods'), where('name', '==', itemName));
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(collection(db, 'foods'), {
              name: itemName,
              price: 100 + Math.floor(Math.random() * 35) * 10,
              description: `A delicious and authentic ${itemName} served hot and fresh.`,
              categoryId: categoryMap[catName],
              restaurantId: restaurantId,
              imageURL: `https://picsum.photos/seed/${itemName.replace(/\s/g, '-')}/800/600`,
              rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
              trending: Math.random() > 0.8,
              isVeg: true,
              totalOrders: Math.floor(Math.random() * 200),
              totalRevenue: 0
            });
            totalDishesCreated++;
          }
        }

        // Generate Non-Veg Items (where applicable)
        const nonVegItems = templates.nonVeg;
        for (const itemName of nonVegItems) {
          const q = query(collection(db, 'foods'), where('name', '==', itemName));
          const snap = await getDocs(q);
          if (snap.empty) {
            await addDoc(collection(db, 'foods'), {
              name: itemName,
              price: 200 + Math.floor(Math.random() * 40) * 10,
              description: `Our signature ${itemName} prepared with premium ingredients and traditional spices.`,
              categoryId: categoryMap[catName],
              restaurantId: restaurantId,
              imageURL: `https://picsum.photos/seed/${itemName.replace(/\s/g, '-')}/800/600`,
              rating: parseFloat((4.2 + Math.random() * 0.8).toFixed(1)),
              trending: Math.random() > 0.7,
              isVeg: false,
              totalOrders: Math.floor(Math.random() * 300),
              totalRevenue: 0
            });
            totalDishesCreated++;
          }
        }
      }

      toast({
        title: "Database Mega-Seed Complete",
        description: `Successfully synchronized ${totalDishesCreated} new dishes across 15 categories.`
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
      imageURL: `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/800/600`,
      rating: 4.5,
      trending: formData.get('trending') === 'on',
      isVeg: formData.get('isVeg') === 'on',
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
          <p className="text-muted-foreground">Admin-only portal for massive menu data seeding and management.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleBootstrap} 
            disabled={isBootstrapping}
            className="rounded-xl border-primary text-primary hover:bg-primary/5 font-bold h-11"
          >
            {isBootstrapping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Mega-Seed 300+ Items
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
              <h3 className="font-bold text-lg">Full Catalog ({foods?.length || 0})</h3>
              <Dialog open={isAddFoodOpen} onOpenChange={setIsAddFoodOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Manual Entry
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
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="trending" name="trending" className="w-4 h-4 rounded border-primary text-primary accent-primary" />
                        <Label htmlFor="trending">Trending</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="isVeg" name="isVeg" defaultChecked className="w-4 h-4 rounded border-green-600 text-green-600 accent-green-600" />
                        <Label htmlFor="isVeg">Vegetarian</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full rounded-xl font-bold bg-primary h-12">Save Item</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="font-bold p-6">Name</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
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
                          <div className="w-12 h-12 rounded-xl overflow-hidden border bg-muted shrink-0 shadow-sm">
                            <img src={food.imageURL} alt={food.name} className="object-cover w-full h-full" />
                          </div>
                          <span className="font-bold text-sm">{food.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {food.isVeg ? (
                          <Leaf className="w-5 h-5 text-green-600" />
                        ) : (
                          <Beef className="w-5 h-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full text-[10px]">
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
            </div>
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
