"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  ChefHat, 
  TrendingUp, 
  Sparkles, 
  LogOut,
  MapPin,
  Utensils
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/contexts/auth-context';
import { useCart } from '@/lib/contexts/cart-context';
import FoodCard from '@/components/FoodCard';
import { personalizedFoodRecommendations } from '@/ai/flows/personalized-food-recommendations-flow';

// Mock Data
const ALL_FOODS = [
  { id: '1', name: 'Paneer Butter Masala', price: 220, category: 'North Indian', rating: 4.8, trending: true, imageURL: 'https://picsum.photos/seed/pbm/600/400' },
  { id: '2', name: 'Masala Dosa', price: 120, category: 'South Indian', rating: 4.6, trending: true, imageURL: 'https://picsum.photos/seed/dosa/600/400' },
  { id: '3', name: 'Vada Pav', price: 40, category: 'Street Food', rating: 4.9, trending: true, imageURL: 'https://picsum.photos/seed/vada/600/400' },
  { id: '4', name: 'Gulab Jamun', price: 80, category: 'Sweets', rating: 4.7, trending: false, imageURL: 'https://picsum.photos/seed/gulab/600/400' },
  { id: '5', name: 'Butter Chicken', price: 350, category: 'North Indian', rating: 4.9, trending: true, imageURL: 'https://picsum.photos/seed/chicken/600/400' },
  { id: '6', name: 'Chole Bhature', price: 150, category: 'North Indian', rating: 4.5, trending: false, imageURL: 'https://picsum.photos/seed/chole/600/400' },
  { id: '7', name: 'Pav Bhaji', price: 110, category: 'Street Food', rating: 4.6, trending: true, imageURL: 'https://picsum.photos/seed/pav/600/400' },
  { id: '8', name: 'Mango Lassi', price: 90, category: 'Beverages', rating: 4.8, trending: false, imageURL: 'https://picsum.photos/seed/lassi/600/400' },
];

const CATEGORIES = ['All', 'North Indian', 'South Indian', 'Street Food', 'Fast Food', 'Sweets', 'Beverages'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => {
    async function getRecommendations() {
      setLoadingRecs(true);
      try {
        const result = await personalizedFoodRecommendations({
          userFoodHistory: [{ name: 'Paneer Butter Masala', category: 'North Indian' }],
          availableFoods: ALL_FOODS
        });
        setRecommendations(result.recommendations);
      } catch (e) {
        console.error("Failed to fetch recommendations", e);
      } finally {
        setLoadingRecs(false);
      }
    }
    getRecommendations();
  }, []);

  const filteredFoods = ALL_FOODS.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-xl font-bold hidden md:block">Bhartiya Swad</span>
          </div>

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search for dishes, cuisines..." 
              className="pl-10 h-11 bg-muted/50 border-none rounded-2xl w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Andheri East, Mumbai</span>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative p-2 rounded-full">
                  <ShoppingCart className="w-6 h-6" />
                  {items.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                      {items.reduce((acc, i) => acc + i.quantity, 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                    Your Basket
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 py-6">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                      <Utensils className="w-20 h-20 mb-4" />
                      <p className="font-bold text-lg">Your basket is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted relative">
                            <img src={item.imageURL} alt={item.name} className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold">{item.name}</h4>
                            <p className="text-primary font-bold">₹{item.price}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm bg-muted px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-destructive">Remove</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {items.length > 0 && (
                  <SheetFooter className="pt-6 border-t flex-col sm:flex-col gap-4">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-lg font-bold">Subtotal</span>
                      <span className="text-2xl font-headline font-black text-primary">₹{totalPrice}</span>
                    </div>
                    <Button 
                      className="w-full h-14 bg-primary text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
                      onClick={() => {
                        alert("Order Placed Successfully!");
                        clearCart();
                      }}
                    >
                      Checkout Now
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section / Categories */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12">
          <h2 className="text-2xl font-headline font-black mb-6 flex items-center gap-2">
            What's on your <span className="text-primary italic">mind</span>?
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-8 h-12 font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'shadow-lg shadow-primary/20' : ''}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mb-16 bg-gradient-to-br from-primary/5 to-accent/5 p-8 rounded-[2.5rem] border border-primary/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-headline font-black flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  AI Recommended for You
                </h2>
                <p className="text-muted-foreground mt-1">Based on your tastes and favorites</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-headline font-black flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-accent" />
              Trending Now
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredFoods.map(food => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </div>

        {filteredFoods.length === 0 && (
          <div className="text-center py-20">
            <Utensils className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-bold">No dishes found matching your search</p>
          </div>
        )}
      </main>
    </div>
  );
}