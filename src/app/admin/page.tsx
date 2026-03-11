"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, 
  Plus, 
  Trash2, 
  Edit3, 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  LogOut,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';

const INITIAL_FOODS = [
  { id: '1', name: 'Paneer Butter Masala', price: 220, category: 'North Indian', rating: 4.8, trending: true, imageURL: 'https://picsum.photos/seed/pbm/600/400' },
  { id: '2', name: 'Masala Dosa', price: 120, category: 'South Indian', rating: 4.6, trending: true, imageURL: 'https://picsum.photos/seed/dosa/600/400' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [foods, setFoods] = useState(INITIAL_FOODS);
  const [newFood, setNewFood] = useState({ name: '', price: '', category: 'North Indian', trending: false, imageURL: 'https://picsum.photos/seed/new/600/400' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') router.push('/login');
  }, [user, router]);

  const handleAddFood = () => {
    setFoods([...foods, { ...newFood, id: Date.now().toString(), price: Number(newFood.price), rating: 5.0 }]);
    setNewFood({ name: '', price: '', category: 'North Indian', trending: false, imageURL: 'https://picsum.photos/seed/new/600/400' });
    setIsDialogOpen(false);
  };

  const deleteFood = (id: string) => {
    setFoods(foods.filter(f => f.id !== id));
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="w-full bg-white border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="font-headline text-xl font-bold">Admin Console</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold">{user.displayName}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Super Admin</p>
          </div>
          <Button variant="ghost" onClick={() => logout()} className="text-destructive font-bold">
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Revenue', value: '₹45,280', icon: TrendingUp, color: 'text-primary' },
            { label: 'Orders Today', value: '124', icon: ShoppingBag, color: 'text-blue-500' },
            { label: 'Total Customers', value: '1,204', icon: Users, color: 'text-green-500' },
            { label: 'Menu Items', value: foods.length, icon: ChefHat, color: 'text-accent' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-black mt-1">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-headline font-black">Menu Management</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 h-12 rounded-xl px-6 font-bold">
                <Plus className="w-5 h-5 mr-2" />
                Add New Dish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline">New Dish Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Dish Name</Label>
                  <Input value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} placeholder="e.g. Paneer Butter Masala" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={newFood.price} onChange={e => setNewFood({...newFood, price: e.target.value})} placeholder="250" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={newFood.category} onChange={e => setNewFood({...newFood, category: e.target.value})} placeholder="North Indian" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="trending" checked={newFood.trending} onCheckedChange={(val) => setNewFood({...newFood, trending: !!val})} />
                  <Label htmlFor="trending" className="font-bold">Mark as Trending</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleAddFood} className="bg-primary hover:bg-primary/90 rounded-xl px-8">Create Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold p-6">Dish</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Price</TableHead>
                <TableHead className="font-bold">Rating</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {foods.map((food) => (
                <TableRow key={food.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden relative">
                        <img src={food.imageURL} alt={food.name} className="object-cover w-full h-full" />
                      </div>
                      <span className="font-bold">{food.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full px-3">{food.category}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-primary">₹{food.price}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-bold">
                      <span className="text-yellow-500">★</span> {food.rating}
                    </div>
                  </TableCell>
                  <TableCell>
                    {food.trending ? (
                      <Badge className="bg-accent/10 text-accent border-accent/20 rounded-full">Trending</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full">Standard</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary rounded-xl">
                        <Edit3 className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteFood(food.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}