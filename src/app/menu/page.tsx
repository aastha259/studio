
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, 
  ShoppingCart, 
  ChefHat, 
  Sparkles, 
  LogOut,
  Utensils,
  Loader2,
  UtensilsCrossed,
  Soup,
  Store,
  Pizza,
  Beef,
  Flame,
  IceCreamCone,
  Coffee,
  Filter,
  Star,
  LayoutDashboard,
  CircleDot,
  Container,
  Clock,
  Navigation,
  GlassWater,
  Ham
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
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { seedMenuData } from '@/app/admin/database/page';
import { useToast } from '@/hooks/use-toast';

const categoriesConfig = [
  { name: 'Pizza', icon: Pizza, image: 'cat-pizza' },
  { name: 'Burgers', icon: Ham, image: 'cat-burgers' },
  { name: 'Biryani', icon: Flame, image: 'cat-biryani' },
  { name: 'North Indian', icon: UtensilsCrossed, image: 'cat-north-indian' },
  { name: 'South Indian', icon: Soup, image: 'cat-south-indian' },
  { name: 'Chinese', icon: Beef, image: 'cat-chinese' },
  { name: 'Fast Food', icon: CircleDot, image: 'cat-fast-food' },
  { name: 'Street Food', icon: Store, image: 'cat-street-food' },
  { name: 'Rolls & Wraps', icon: Navigation, image: 'cat-rolls' },
  { name: 'Sandwiches', icon: Container, image: 'cat-sandwiches' },
  { name: 'Pasta', icon: Utensils, image: 'cat-pasta' },
  { name: 'Salads', icon: Star, image: 'cat-salads' },
  { name: 'Desserts', icon: IceCreamCone, image: 'cat-sweets' },
  { name: 'Ice Cream', icon: IceCreamCone, image: 'cat-icecream' },
  { name: 'Beverages', icon: Coffee, image: 'cat-beverages' },
];

export default function MenuPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [isVegOnly, setIsVegOnly] = useState<boolean | null>(null);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all available dishes
  const dishesQuery = useMemoFirebase(() => collection(db, 'dishes'), [db]);
  const { data: allDishes, isLoading: dishesLoading } = useCollection(dishesQuery);

  // Auto-seed if database is empty
  useEffect(() => {
    if (mounted && !dishesLoading && allDishes && allDishes.length === 0 && !isSeeding) {
      setIsSeeding(true);
      seedMenuData(db, null).finally(() => setIsSeeding(false));
    }
  }, [allDishes, dishesLoading, db, mounted, isSeeding]);

  // Trending items based on totalOrders frequency
  const trendingQuery = useMemoFirebase(() => {
    return query(collection(db, 'dishes'), orderBy('totalOrders', 'desc'), limit(8));
  }, [db]);
  const { data: trendingDishes } = useCollection(trendingQuery);

  // AI Recommendations
  useEffect(() => {
    async function getPersonalizedRecommendations() {
      if (!user?.uid || !allDishes || allDishes.length === 0) {
        setRecommendations([]);
        return;
      }
      
      setLoadingRecs(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef, 
          where('userId', '==', user.uid), 
          orderBy('orderDate', 'desc'), 
          limit(5)
        );
        const orderSnap = await getDocs(q);
        
        const history: { name: string; category?: string }[] = [];
        for (const orderDoc of orderSnap.docs) {
          const itemsRef = collection(db, 'orders', orderDoc.id, 'orderItems');
          const itemsSnap = await getDocs(itemsRef);
          itemsSnap.forEach(itemDoc => {
            const itemData = itemDoc.data();
            history.push({
              name: itemData.foodName,
              category: allDishes.find(f => f.id === itemData.dishId)?.category
            });
          });
        }

        const result = await personalizedFoodRecommendations({
          userFoodHistory: history.length > 0 ? history : [],
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
    if (allDishes && user) getPersonalizedRecommendations();
  }, [user?.uid, allDishes, db]);

  // Filtering Logic
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

  const activeFilterCount = (isVegOnly !== null ? 1 : 0) + (maxPrice < 1000 ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const resetFilters = () => {
    setIsVegOnly(null);
    setMaxPrice(1000);
    setMinRating(0);
    setSearch('');
    setSelectedCategory('All');
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white" suppressHydrationWarning>
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-xl font-bold hidden md:block text-foreground">Bhartiya Swad</span>
          </Link>

          <div className="flex-1 max-w-xl flex gap-4">
            {mounted && user && (
              <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            <Link href="/menu" className="flex items-center gap-2 text-sm font-black text-primary transition-colors px-3 border-b-2 border-primary">
              <Utensils className="w-4 h-4" />
              Menu
            </Link>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search 500+ dishes..." 
                className="pl-10 h-11 bg-muted/50 border-none rounded-2xl w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!mounted ? (
              <div className="w-10 h-10" />
            ) : user ? (
              <>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="relative p-2 rounded-full hover:bg-primary/5">
                      <ShoppingCart className="w-6 h-6" />
                      {items.length > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
                          {items.reduce((acc, i) => acc + i.quantity, 0)}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md flex flex-col rounded-l-[2.5rem] border-none">
                    <SheetHeader className="pb-6 border-b">
                      <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary" />
                        Basket
                      </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-1 py-6">
                      {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                          <Utensils className="w-20 h-20 mb-4" />
                          <p className="font-bold text-lg">Empty Basket</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {items.map((item) => (
                            <div key={item.id} className="flex gap-4 items-center animate-in slide-in-from-right-4">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted relative border shadow-sm">
                                <img src={item.imageURL || ''} alt={item.name} className="object-cover w-full h-full" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-sm">{item.name}</h4>
                                <p className="text-primary font-black">₹{item.price}</p>
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-destructive hover:bg-destructive/5 font-bold">Remove</Button>
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
                        <Button className="w-full h-14 bg-primary text-lg font-black rounded-2xl shadow-xl shadow-primary/20" onClick={() => { alert("Order Placed!"); clearCart(); }}>Place Order</Button>
                      </SheetFooter>
                    )}
                  </SheetContent>
                </Sheet>
                <Button variant="ghost" size="icon" onClick={() => logout()} className="rounded-full hover:bg-destructive/5 hover:text-destructive">
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Link href="/login?callbackUrl=/menu">
                <Button className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90">Login to Order</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        {isSeeding && (
          <div className="flex items-center justify-center gap-4 p-8 bg-primary/10 rounded-3xl animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="font-black text-primary">Initializing Restaurant Database (Adding 200+ dishes)...</p>
          </div>
        )}

        {trendingDishes && trendingDishes.length > 0 && !isSeeding && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-headline font-black mb-8 flex items-center gap-3">
              <Flame className="w-10 h-10 text-accent animate-bounce" />
              Trending Now
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingDishes.map(dish => (
                <FoodCard key={dish.id} food={{...dish, imageURL: dish.image}} />
              ))}
            </div>
          </section>
        )}

        {mounted && user && (recommendations.length > 0 || loadingRecs) && !isSeeding && (
          <section className="bg-gradient-to-br from-primary/5 to-accent/5 p-12 rounded-[3rem] border border-primary/10 animate-in fade-in duration-1000">
            <h2 className="text-4xl font-headline font-black mb-10 flex items-center gap-4">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              Recommended For You
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.map(dish => (
                <FoodCard key={dish.id} food={dish} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
            <div>
              <h2 className="text-4xl font-headline font-black">Explore Categories</h2>
              <p className="text-muted-foreground mt-2 font-medium">Browse by your favorite cuisine.</p>
            </div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 rounded-2xl gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all font-bold">
                  <Filter className="w-5 h-5" />
                  Filter Menu
                  {activeFilterCount > 0 && <Badge className="bg-white text-primary ml-2 rounded-full px-2">{activeFilterCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-[2.5rem] border-none">
                <SheetHeader className="pb-8 border-b">
                  <SheetTitle className="text-3xl font-headline font-black flex items-center gap-3"><Filter className="w-8 h-8 text-primary" /> Filters</SheetTitle>
                </SheetHeader>
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
                <div className={`relative aspect-square rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 shadow-md ${selectedCategory === cat.name ? 'border-primary shadow-2xl' : 'border-white'}`}>
                  <Image src={PlaceHolderImages.find(img => img.id === cat.image)?.imageUrl || ''} alt={cat.name} fill className={`object-cover ${selectedCategory === cat.name ? 'opacity-30' : 'opacity-70'}`} />
                  <div className="absolute inset-0 flex items-center justify-center"><cat.icon className={cn("w-12 h-12 text-white drop-shadow-2xl")} /></div>
                </div>
                <p className={`text-center mt-4 font-black text-sm uppercase ${selectedCategory === cat.name ? 'text-primary' : 'text-muted-foreground'}`}>{cat.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="full-menu" className="pt-12 border-t border-dashed">
          <h3 className="text-3xl font-headline font-black mb-12">Complete Menu</h3>
          {dishesLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="font-bold text-muted-foreground">Loading dishes...</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {filteredDishes.map(dish => (
                <FoodCard key={dish.id} food={{...dish, imageURL: dish.image}} />
              ))}
            </div>
          )}
          {!dishesLoading && filteredDishes.length === 0 && (
            <div className="text-center py-40 bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted flex flex-col items-center">
              <UtensilsCrossed className="w-24 h-24 mb-6 text-muted-foreground opacity-20" />
              <p className="text-3xl text-foreground font-black">No matches found</p>
              <Button variant="outline" className="mt-10 rounded-2xl h-14 px-8 font-black border-primary text-primary" onClick={resetFilters}>Reset Filters</Button>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t py-20 mt-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-6"><ChefHat className="text-primary w-8 h-8" /><span className="text-2xl font-headline font-black">Bhartiya Swad</span></div>
        <p className="text-muted-foreground font-medium mb-8 max-w-md mx-auto">Authentic Indian flavors delivered to your doorstep.</p>
        <p className="mt-12 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">© 2025 Bhartiya Swad.</p>
      </footer>
    </div>
  );
}
