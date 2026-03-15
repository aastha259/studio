
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  ChefHat, 
  Sparkles, 
  LogOut,
  Utensils,
  Loader2,
  Flame,
  Store,
  Beef,
  IceCreamCone,
  Coffee,
  Filter,
  LayoutDashboard,
  CircleDot,
  Leaf,
  ChevronRight,
  Pizza,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
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
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/lib/contexts/auth-context';
import { useCart } from '@/lib/contexts/cart-context';
import FoodCard from '@/components/FoodCard';
import { personalizedFoodRecommendations } from '@/ai/flows/personalized-food-recommendations-flow';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const categoriesConfig = [
  { name: 'PIZZAS', icon: Pizza },
  { name: 'BURGERS', icon: Beef },
  { name: 'NORTH_INDIAN', icon: Leaf },
  { name: 'SOUTH_INDIAN', icon: CircleDot },
  { name: 'STREET_FOOD', icon: Store },
  { name: 'DESSERTS', icon: IceCreamCone },
  { name: 'BEVERAGES', icon: Coffee },
];

export default function MenuPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items, removeFromCart, updateQuantity, totalPrice, totalQuantity, clearCart } = useCart();
  const db = useFirestore();
  
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [isVegOnly, setIsVegOnly] = useState<boolean | null>(null);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dishesQuery = useMemoFirebase(() => collection(db, 'dishes'), [db]);
  const { data: allDishes, isLoading: dishesLoading } = useCollection(dishesQuery);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    async function getPersonalizedRecommendations() {
      if (!user?.uid || !allDishes || allDishes.length === 0) {
        setRecommendations([]);
        return;
      }
      
      setLoadingRecs(true);
      try {
        const result = await personalizedFoodRecommendations({
          userFoodHistory: [],
          availableFoods: allDishes.map(f => ({
            id: f.id,
            name: f.name,
            price: f.price,
            category: f.category,
            rating: f.rating,
            imageURL: f.image
          }))
        });
        setRecommendations(result.recommendations);
      } catch (e) {
        console.error("Failed to fetch recommendations", e);
      } finally {
        setLoadingRecs(false);
      }
    }
    if (mounted && allDishes && user) getPersonalizedRecommendations();
  }, [user?.uid, allDishes, db, mounted]);

  const filteredDishes = useMemo(() => {
    return (allDishes || []).filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || dish.category === selectedCategory;
      const matchesVeg = isVegOnly === null ? true : dish.isVeg === isVegOnly;
      const matchesPrice = dish.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesVeg && matchesPrice;
    });
  }, [allDishes, search, selectedCategory, isVegOnly, maxPrice]);

  const resetFilters = () => {
    setIsVegOnly(null);
    setMaxPrice(1000);
    setSearch('');
    setSelectedCategory('All');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB]" suppressHydrationWarning>
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-black tracking-tight hidden md:block">Bhartiya Swad</span>
          </Link>

          <div className="flex-1 max-w-xl flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search authentic dishes..." 
                className="pl-11 h-11 bg-muted/40 border-none rounded-2xl focus-visible:ring-primary/20 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                <LayoutDashboard className="w-5 h-5" />
              </Link>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative p-2 rounded-full hover:bg-primary/5 group">
                  <ShoppingCart className="w-6 h-6 group-hover:text-primary transition-colors" />
                  {totalQuantity > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                      {totalQuantity}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col rounded-l-[2.5rem] border-none shadow-2xl">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-2xl font-headline font-black flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-primary" /> Basket
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 py-8">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                      <Utensils className="w-20 h-20 mb-6" />
                      <p className="font-black text-xl italic text-center">Your basket is empty!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-primary/10 transition-all group">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white relative border shadow-sm">
                            <img src={item.imageURL || ''} alt={item.name} className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-sm">{item.name}</h4>
                            <p className="text-primary font-black">₹{item.price}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6 rounded-full border-primary/20"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-xs font-black">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6 rounded-full border-primary/20"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {items.length > 0 && (
                  <SheetFooter className="pt-8 border-t flex-col sm:flex-col gap-6">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total</span>
                        <span className="text-3xl font-headline font-black text-primary">₹{totalPrice}</span>
                      </div>
                    </div>
                    <Button className="w-full h-16 bg-primary text-xl font-black rounded-3xl shadow-xl shadow-primary/20" onClick={() => { alert("Order Placed!"); clearCart(); }}>
                      Place Order
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            {user ? (
              <Button variant="ghost" size="icon" onClick={() => logout()} className="rounded-full hover:bg-destructive/5 hover:text-destructive">
                <LogOut className="w-5 h-5" />
              </Button>
            ) : (
              <Link href="/login?callbackUrl=/menu">
                <Button className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-headline font-black text-foreground tracking-tight">Full Menu</h1>
              <p className="text-lg text-muted-foreground font-medium">Explore our curated selection of authentic Indian flavors.</p>
            </div>
            
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-14 px-8 rounded-2xl gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all font-black shadow-sm">
                  <Filter className="w-5 h-5" /> Filter Selection
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-[3rem] border-none shadow-2xl p-10">
                <SheetHeader className="pb-8 border-b">
                  <SheetTitle className="text-3xl font-headline font-black flex items-center gap-3">
                    <Filter className="w-8 h-8 text-primary" /> Refine Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="py-12 space-y-12">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dietary Preference</label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant={isVegOnly === null ? 'default' : 'outline'} onClick={() => setIsVegOnly(null)} className="rounded-2xl h-12 font-bold">All</Button>
                      <Button variant={isVegOnly === true ? 'default' : 'outline'} onClick={() => setIsVegOnly(true)} className={cn("rounded-2xl h-12 font-bold", isVegOnly === true && "bg-green-600 border-green-600 hover:bg-green-700")}>Veg</Button>
                      <Button variant={isVegOnly === false ? 'default' : 'outline'} onClick={() => setIsVegOnly(false)} className={cn("rounded-2xl h-12 font-bold", isVegOnly === false && "bg-red-600 border-red-600 hover:bg-red-700")}>Non-Veg</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Max Price (₹)</label>
                      <span className="font-headline font-black text-3xl text-primary">₹{maxPrice}</span>
                    </div>
                    <Slider value={[maxPrice]} max={1000} step={50} onValueChange={([val]) => setMaxPrice(val)} className="py-4" />
                  </div>
                </div>
                <div className="pt-8 border-t flex flex-col gap-4">
                  <Button variant="ghost" className="w-full text-muted-foreground font-black" onClick={resetFilters}>Clear All</Button>
                  <Button className="w-full h-16 rounded-3xl font-black text-xl shadow-xl shadow-primary/20" onClick={() => setShowFilters(false)}>Show Results</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
            <div 
              onClick={() => setSelectedCategory('All')} 
              className={cn(
                "flex-shrink-0 w-36 snap-start cursor-pointer group transition-all duration-300",
                selectedCategory === 'All' ? 'scale-105' : 'hover:scale-102'
              )}
            >
              <div className={cn(
                "aspect-square rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-500",
                selectedCategory === 'All' ? 'border-primary bg-primary shadow-2xl' : 'border-white bg-white shadow-md'
              )}>
                <Utensils className={cn("w-10 h-10 transition-colors duration-500", selectedCategory === 'All' ? 'text-white' : 'text-primary')} />
              </div>
              <p className={cn(
                "text-center mt-4 font-black text-[10px] uppercase tracking-widest",
                selectedCategory === 'All' ? 'text-primary' : 'text-muted-foreground'
              )}>All Dishes</p>
            </div>
            
            {categoriesConfig.map((cat) => (
              <div 
                key={cat.name} 
                onClick={() => setSelectedCategory(cat.name)} 
                className={cn(
                  "flex-shrink-0 w-36 snap-start cursor-pointer group transition-all duration-300",
                  selectedCategory === cat.name ? 'scale-105' : 'hover:scale-102'
                )}
              >
                <div className={cn(
                  "aspect-square rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-500",
                  selectedCategory === cat.name ? 'border-primary bg-primary shadow-2xl' : 'border-white bg-white shadow-md'
                )}>
                  <cat.icon className={cn("w-10 h-10 transition-colors duration-500", selectedCategory === cat.name ? 'text-white' : 'text-primary')} />
                </div>
                <p className={cn(
                  "text-center mt-4 font-black text-[10px] uppercase tracking-widest",
                  selectedCategory === cat.name ? 'text-primary' : 'text-muted-foreground'
                )}>{cat.name.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="space-y-12">
          {dishesLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-40">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="font-black text-xl italic">Opening the pantry...</p>
            </div>
          ) : (
            <>
              {filteredDishes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                  {filteredDishes.map(dish => (
                    <FoodCard key={dish.id} food={{...dish, imageURL: dish.image}} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-40 bg-white rounded-[4rem] border border-dashed border-primary/10">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-3xl font-headline font-black text-foreground">No matches found</h3>
                    <p className="text-muted-foreground font-medium">Try adjusting your filters or search keywords to find what you're craving.</p>
                    <Button variant="outline" onClick={resetFilters} className="rounded-2xl h-12 px-8 font-black border-primary text-primary">Reset All Filters</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {!dishesLoading && allDishes?.length === 0 && (
          <div className="bg-primary/5 p-16 rounded-[4rem] border border-dashed border-primary/20 flex flex-col items-center gap-8 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-primary" />
            </div>
            <div className="max-w-lg space-y-4">
              <h2 className="text-4xl font-headline font-black text-foreground">Our kitchen is just getting started!</h2>
              <p className="text-lg text-muted-foreground font-medium">It looks like the repository hasn't been synced yet. Visit the Admin Portal to bootstrap the menu with 500+ authentic items.</p>
            </div>
            <Link href="/admin/database">
              <Button className="h-16 px-12 rounded-3xl font-black bg-primary text-xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                Go to Admin Repository <ChevronRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-20 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <ChefHat className="text-primary w-8 h-8" />
              <span className="font-headline text-2xl font-black">Bhartiya Swad</span>
            </div>
            <p className="text-muted-foreground font-medium max-w-xs text-center md:text-left opacity-70">Authentic Indian culinary experiences delivered directly to your home.</p>
          </div>
          <div className="flex gap-10">
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Menu</Button>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">Locations</Button>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">About Us</Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
