
"use client"

import React, { useState } from 'react';
import { 
  Store, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Utensils, 
  Star, 
  Phone, 
  MapPin, 
  Loader2
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminRestaurantsPage() {
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [viewingMenu, setViewingMenu] = useState<any>(null);

  // Fetch Restaurants
  const restaurantsQuery = useMemoFirebase(() => collection(db, 'restaurants'), [db]);
  const { data: restaurants, isLoading } = useCollection(restaurantsQuery);

  // Fetch Dishes
  const dishesQuery = useMemoFirebase(() => collection(db, 'dishes'), [db]);
  const { data: allDishes } = useCollection(dishesQuery);

  const filteredRestaurants = restaurants?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSaveRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      imageURL: formData.get('imageURL') as string || `https://picsum.photos/seed/restaurant-${Date.now()}/600/400`,
      averageRating: parseFloat(formData.get('rating') as string) || 0,
      totalOrders: 0,
      totalRevenue: 0
    };

    if (editingRestaurant) {
      await updateDoc(doc(db, 'restaurants', editingRestaurant.id), data);
      setEditingRestaurant(null);
    } else {
      await addDoc(collection(db, 'restaurants'), data);
      setIsAddOpen(false);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (confirm('Are you sure you want to remove this restaurant partner?')) {
      await deleteDoc(doc(db, 'restaurants', id));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
            <Store className="w-10 h-10 text-primary" />
            Partner Network
          </h1>
          <p className="text-muted-foreground font-medium">Manage restaurant locations and performance.</p>
        </div>
        
        <Dialog open={isAddOpen || !!editingRestaurant} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingRestaurant(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2 text-lg">
              <Plus className="w-6 h-6" />
              Onboard Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline font-black text-primary">
                {editingRestaurant ? 'Edit Partner' : 'New Restaurant Partner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveRestaurant} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold">Restaurant Name</Label>
                <Input id="name" name="name" defaultValue={editingRestaurant?.name} required placeholder="e.g. Royal Punjab" className="rounded-xl h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">Contact Phone</Label>
                  <Input id="phone" name="phone" defaultValue={editingRestaurant?.phone} required placeholder="+91 ..." className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating" className="font-bold">Initial Rating</Label>
                  <Input id="rating" name="rating" type="number" step="0.1" max="5" defaultValue={editingRestaurant?.averageRating || 4.5} required className="rounded-xl h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold">Business Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingRestaurant?.email} required placeholder="contact@restaurant.com" className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="font-bold">Physical Address</Label>
                <Input id="address" name="address" defaultValue={editingRestaurant?.address} required placeholder="Full street address..." className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageURL" className="font-bold">Image URL (Optional)</Label>
                <Input id="imageURL" name="imageURL" defaultValue={editingRestaurant?.imageURL} placeholder="https://..." className="rounded-xl h-12" />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-14 rounded-2xl font-black bg-primary text-lg shadow-lg">
                  {editingRestaurant ? 'Update Records' : 'Finalize Onboarding'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name or location..." 
          className="pl-12 h-14 bg-white rounded-2xl shadow-sm border-none ring-1 ring-primary/10 focus-visible:ring-primary transition-all text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black px-10 h-20 uppercase tracking-widest text-[10px]">Restaurant</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Location</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-center">Orders</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-center">Rating</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-right pr-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants.map((res) => {
                const restaurantMenu = allDishes?.filter(f => f.restaurantId === res.id) || [];
                
                return (
                  <TableRow key={res.id} className="hover:bg-muted/5 transition-colors border-b last:border-none group">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl border-2 border-primary/10 shadow-md overflow-hidden bg-muted">
                          <img src={res.imageURL} className="object-cover w-full h-full" alt={res.name} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-lg text-foreground">{res.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-bold">
                            <Phone className="w-3 h-3" /> {res.phone}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium max-w-[200px]">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{res.address}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-xl text-primary">{res.totalOrders || 0}</span>
                        <span className="text-[10px] uppercase font-black tracking-tighter opacity-40">Orders</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="rounded-full bg-green-100 text-green-700 hover:bg-green-100 border-none font-black px-3 py-1 gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {res.averageRating || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary hover:text-white"
                          onClick={() => setViewingMenu(res)}
                        >
                          <Utensils className="w-4 h-4 mr-2" />
                          Menu ({restaurantMenu.length})
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-muted-foreground hover:text-primary"
                          onClick={() => setEditingRestaurant(res)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteRestaurant(res.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRestaurants.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center opacity-30">
                      <Store className="w-20 h-20 mb-4" />
                      <p className="text-xl font-black italic">No partner restaurants found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Menu Management View (Overlay/Dialog) */}
      <Dialog open={!!viewingMenu} onOpenChange={() => setViewingMenu(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] p-0 overflow-hidden border-none max-h-[85vh] flex flex-col">
          <div className="bg-primary p-10 text-white relative">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-3xl border-4 border-white/20 shadow-2xl overflow-hidden bg-white/10">
                <img src={viewingMenu?.imageURL} className="object-cover w-full h-full" alt={viewingMenu?.name} />
              </div>
              <div>
                <h2 className="text-4xl font-headline font-black leading-tight">{viewingMenu?.name}</h2>
                <p className="text-white/70 font-bold flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" /> {viewingMenu?.address}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-10 overflow-y-auto bg-offwhite/50">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-xl font-headline font-black text-foreground">Digital Menu Catalog</h3>
                <Badge variant="outline" className="rounded-full px-4 py-1 font-black">
                  {allDishes?.filter(f => f.restaurantId === viewingMenu?.id).length || 0} ITEMS TOTAL
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allDishes?.filter(f => f.restaurantId === viewingMenu?.id).map((food) => (
                  <div key={food.id} className="bg-white border p-4 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border shadow-sm">
                        <img src={food.image || food.imageURL} alt={food.name} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="font-black text-foreground leading-none">{food.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-bold">₹{food.price}</p>
                        {food.trending && (
                          <Badge className="mt-2 h-4 text-[8px] bg-accent font-black uppercase">Trending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
