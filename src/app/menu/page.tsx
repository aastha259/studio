
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
  Pizza,
  Ham as BurgerIcon,
  Soup,
  Store,
  Beef,
  Flame,
  IceCreamCone,
  Coffee,
  Filter,
  LayoutDashboard,
  CircleDot,
  Container,
  GlassWater,
  Leaf,
  UtensilsCrossed
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
  { name: 'Pizza', icon: Pizza },
  { name: 'Burgers', icon: BurgerIcon },
  { name: 'Biryani', icon: Soup },
  { name: 'North Indian', icon: Flame },
  { name: 'South Indian', icon: CircleDot },
  { name: 'Chinese', icon: Container },
  { name: 'Fast Food', icon: Utensils },
  { name: 'Street Food', icon: Store },
  { name: 'Sandwiches', icon: GlassWater },
  { name: 'Rolls & Wraps', icon: Beef },
  { name: 'Pasta', icon: UtensilsCrossed },
  { name: 'Salads', icon: Leaf },
  { name: 'Desserts', icon: IceCreamCone },
  { name: 'Ice Cream', icon: IceCreamCone },
  { name: 'Beverages', icon: Coffee },
];

export default function MenuPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const db = useFirestore();
  
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [isVegOnly, setIsVegOnly] = useState<boolean | null>(null);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dishesQuery = useMemoFirebase(() => collection(db, 'dishes'), [db]);
  const { data: allDishes, isLoading: dishesLoading } = useCollection(dishesQuery);

  const trendingQuery = useMemoFirebase(() => {
    return query(collection(db, 'dishes'), orderBy('totalOrders', 'desc'), limit(8));
  }, [db]);
  const { data: trendingDishes } = useCollection(trendingQuery);

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
      const matchesRating = dish.rating >= minRating;

      return matchesSearch && matchesCategory && matchesVeg && matchesPrice && matchesRating;
    });
  }, [allDishes, search, selectedCategory, isVegOnly, maxPrice, minRating]);

  const resetFilters = () => {
    setIsVegOnly(null);
    setMaxPrice(1000);
    setMinRating(0);
    setSearch('');
    setSelectedCategory('All');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg"><ChefHat className="text-white w-6 h-6" /></div>
            <span className="font-headline text-xl font-bold hidden md:block text-foreground">Bhartiya Swad</span>
          </Link>

          <div className="flex-1 max-w-xl flex gap-4">
            {user && (
              <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            )}
            <Link href="/menu" className="flex items-center gap-2 text-sm font-black text-primary transition-colors px-3 border-b-2 border-primary">
              <Utensils className="w-4 h-4" /> Menu
            </Link>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search flavors..." 
                className="pl-10 h-11 bg-muted/50 border-none rounded-2xl w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="relative p-2 rounded-full">
                      <ShoppingCart className="w-6 h-6" />
                      {items.length > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md flex flex-col rounded-l-[2.5rem] border-none">
                    <SheetHeader className="pb-6 border-b"><SheetTitle className="text-2xl font-headline flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-primary" /> Basket</SheetTitle></SheetHeader>
                    <ScrollArea className="flex-1 py-6">
                      {items.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-40 py-20"><Utensils className="w-20 h-20 mb-4" /><p className="font-bold">Empty</p></div> : (
                        <div className="space-y-6">
                          {items.map((item) => (
                            <div key={item.id} className="flex gap-4 items-center">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted relative border"><img src={item.imageURL || ''} alt={item.name} className="object-cover w-full h-full" /></div>
                              <div className="flex-1"><h4 className="font-bold text-sm">{item.name}</h4><p className="text-primary font-black">₹{item.price}</p></div>
                              <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-destructive font-bold">Remove</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {items.length > 0 && (
                      <SheetFooter className="pt-6 border-t flex-col sm:flex-col gap-4">
                        <div className="flex justify-between items-center w-full"><span className="text-lg font-bold">Total</span><span className="text-2xl font-headline font-black text-primary">₹{totalPrice}</span></div>
                        <Button className="w-full h-14 bg-primary text-lg font-black rounded-2xl shadow-xl" onClick={() => { alert("Order Placed!"); clearCart(); }}>Checkout</Button>
                      </SheetFooter>
                    )}
                  </SheetContent>
                </Sheet>
                <Button variant="ghost" size="icon" onClick={() => logout()} className="rounded-full hover:bg-destructive/5 hover:text-destructive"><LogOut className="w-5 h-5" /></Button>
              </>
            ) : (
              <Link href="/login?callbackUrl=/menu"><Button className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90">Login</Button></Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        {dishesLoading && (
          <div className="flex items-center justify-center gap-4 p-8 bg-primary/10 rounded-3xl animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="font-black text-primary">Exploring the kitchen...</p>
          </div>
        )}

        {trendingDishes && trendingDishes.length > 0 && (
          <section>
            <h2 className="text-4xl font-headline font-black mb-8 flex items-center gap-3"><Flame className="w-10 h-10 text-accent animate-bounce" /> Trending Now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingDishes.map(dish => <FoodCard key={dish.id} food={{...dish, imageURL: dish.image}} />)}
            </div>
          </section>
        )}

        {user && recommendations.length > 0 && (
          <section className="bg-primary/5 p-12 rounded-[3rem] border border-primary/10">
            <h2 className="text-4xl font-headline font-black mb-10 flex items-center gap-4"><Sparkles className="w-10 h-10 text-primary animate-pulse" /> Recommended For You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.map(dish => <FoodCard key={dish.id} food={dish} />)}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
            <div><h2 className="text-4xl font-headline font-black">Browse Categories</h2><p className="text-muted-foreground mt-2 font-medium">Explore flavors by category.</p></div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 rounded-2xl gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all font-bold"><Filter className="w-5 h-5" /> Filter Menu</Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-[2.5rem] border-none">
                <SheetHeader className="pb-8 border-b"><SheetTitle className="text-3xl font-headline font-black flex items-center gap-3"><Filter className="w-8 h-8 text-primary" /> Filters</SheetTitle></SheetHeader>
                <div className="py-10 space-y-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant={isVegOnly === null ? 'default' : 'outline'} onClick={() => setIsVegOnly(null)} className="rounded-xl font-bold">All</Button>
                      <Button variant={isVegOnly === true ? 'default' : 'outline'} onClick={() => setIsVegOnly(true)} className={cn("rounded-xl font-bold", isVegOnly === true && "bg-green-600")}>Veg</Button>
                      <Button variant={isVegOnly === false ? 'default' : 'outline'} onClick={() => setIsVegOnly(false)} className={cn("rounded-xl font-bold", isVegOnly === false && "bg-red-600")}>Non-Veg</Button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Max Price</label><span className="font-headline font-black text-2xl text-primary">₹{maxPrice}</span></div>
                    <Slider value={[maxPrice]} max={1000} step={10} onValueChange={([val]) => setMaxPrice(val)} />
                  </div>
                </div>
                <SheetFooter className="flex-col gap-4 pt-8 border-t mt-auto">
                  <Button variant="ghost" className="w-full text-muted-foreground font-black" onClick={resetFilters}>Reset</Button>
                  <Button className="w-full h-16 rounded-2xl font-black text-xl" onClick={() => setShowFilters(false)}>Apply</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-8 overflow-x-auto pb-10 no-scrollbar snap-x">
            <div onClick={() => setSelectedCategory('All')} className={`flex-shrink-0 w-36 snap-start cursor-pointer group transition-all duration-500 ${selectedCategory === 'All' ? 'scale-110' : ''}`}>
              <div className={`aspect-square rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-500 ${selectedCategory === 'All' ? 'border-primary bg-primary shadow-2xl' : 'border-white bg-white shadow-md'}`}>
                <Utensils className={`w-12 h-12 transition-colors duration-500 ${selectedCategory === 'All' ? 'text-white' : 'text-primary'}`} />
              </div>
              <p className={`text-center mt-4 font-black text-sm uppercase ${selectedCategory === 'All' ? 'text-primary' : 'text-muted-foreground'}`}>All</p>
            </div>
            {categoriesConfig.map((cat) => (
              <div key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex-shrink-0 w-36 snap-start cursor-pointer group transition-all duration-500 ${selectedCategory === cat.name ? 'scale-110' : ''}`}>
                <div className={`relative aspect-square rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 shadow-md ${selectedCategory === cat.name ? 'border-primary shadow-2xl' : 'border-white bg-white'}`}>
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/5"><cat.icon className={cn("w-12 h-12", selectedCategory === cat.name ? "text-primary scale-110" : "text-muted-foreground")} /></div>
                </div>
                <p className={`text-center mt-4 font-black text-sm uppercase ${selectedCategory === cat.name ? 'text-primary' : 'text-muted-foreground'}`}>{cat.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="full-menu" className="pt-12 border-t border-dashed">
          <h3 className="text-3xl font-headline font-black mb-12">Full Menu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {filteredDishes.map(dish => <FoodCard key={dish.id} food={{...dish, imageURL: dish.image}} />)}
            {filteredDishes.length === 0 && !dishesLoading && (
              <div className="col-span-full text-center py-20 opacity-40 italic font-bold">No dishes found matching your criteria.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
