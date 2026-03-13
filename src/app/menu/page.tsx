
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

const categoriesConfig = [
  { name: 'Pizza', icon: Pizza, image: 'cat-pizza' },
  { name: 'Burgers', icon: Ham, image: 'cat-burgers' },
  { name: 'Biryani', icon: Flame, image: 'cat-biryani' },
  { name: 'North Indian', icon: UtensilsCrossed, image: 'cat-north-indian' },
  { name: 'South Indian', icon: Soup, image: 'cat-south-indian' },
  { name: 'Chinese', icon: Beef, image: 'cat-chinese' },
  { name: 'Fast Food', icon: CircleDot, image: 'cat-fast-food' },
  { name: 'Sandwiches', icon: Container, image: 'cat-sandwiches' },
  { name: 'Rolls & Wraps', icon: Navigation, image: 'cat-rolls' },
  { name: 'Pasta', icon: Utensils, image: 'cat-pasta' },
  { name: 'Salads', icon: Star, image: 'cat-salads' },
  { name: 'Street Food', icon: Store, image: 'cat-street-food' },
  { name: 'Desserts', icon: IceCreamCone, image: 'cat-sweets' },
  { name: 'Ice Cream', icon: IceCreamCone, image: 'cat-icecream' },
  { name: 'Beverages', icon: Coffee, image: 'cat-beverages' },
];

export default function MenuPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const db = useFirestore();
  
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Advanced Filters
  const [isVegOnly, setIsVegOnly] = useState<boolean | null>(null);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all available foods
  const foodsQuery = useMemoFirebase(() => collection(db, 'foods'), [db]);
  const { data: allFoods, isLoading: foodsLoading } = useCollection(foodsQuery);

  // Trending items based on totalOrders frequency
  const trendingQuery = useMemoFirebase(() => {
    return query(collection(db, 'foods'), orderBy('totalOrders', 'desc'), limit(8));
  }, [db]);
  const { data: trendingFoods } = useCollection(trendingQuery);

  // AI Recommendations
  useEffect(() => {
    async function getPersonalizedRecommendations() {
      if (!user?.uid || !allFoods || allFoods.length === 0) {
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
              category: allFoods.find(f => f.id === itemData.foodId)?.category
            });
          });
        }

        const result = await personalizedFoodRecommendations({
          userFoodHistory: history.length > 0 ? history : [],
          availableFoods: allFoods.map(f => ({
            id: f.id,
            name: f.name,
            price: f.price,
            category: f.category,
            rating: f.rating,
            imageURL: f.imageURL
          }))
        });
        setRecommendations(result.recommendations);
      } catch (e) {
        console.error("Failed to fetch recommendations", e);
      } finally {
        setLoadingRecs(false);
      }
    }
    if (allFoods) getPersonalizedRecommendations();
  }, [user?.uid, allFoods, db]);

  // Filtering Logic
  const filteredFoods = useMemo(() => {
    return (allFoods || []).filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
      const matchesVeg = isVegOnly === null ? true : food.isVeg === isVegOnly;
      const matchesPrice = food.price <= maxPrice;
      const matchesRating = food.rating >= minRating;

      return matchesSearch && matchesCategory && matchesVeg && matchesPrice && matchesRating;
    });
  }, [allFoods, search, selectedCategory, isVegOnly, maxPrice, minRating]);

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
      {/* Navigation Header */}
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
                placeholder="Search hundreds of dishes..." 
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
                        Your Basket
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
                                <img src={item.imageURL} alt={item.name} className="object-cover w-full h-full" />
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
                        <Button 
                          className="w-full h-14 bg-primary text-lg font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                          onClick={() => {
                            alert("Bhartiya Swad: Order Placed Successfully!");
                            clearCart();
                          }}
                        >
                          Place Order
                        </Button>
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
                <Button className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90">
                  Login to Order
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Menu Page Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        
        {/* 1. Trending Dishes Section */}
        {trendingFoods && trendingFoods.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-headline font-black flex items-center gap-3">
                  <Flame className="w-10 h-10 text-accent animate-bounce" />
                  Trending <span className="text-primary italic">Dishes</span>
                </h2>
                <p className="text-muted-foreground mt-2 font-medium">Bestsellers based on customer choices.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingFoods.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </section>
        )}

        {/* 2. Recommended For You Section (Only if logged in) */}
        {mounted && user && (recommendations.length > 0 || loadingRecs) && (
          <section className="bg-gradient-to-br from-primary/5 to-accent/5 p-12 rounded-[3rem] border border-primary/10 relative overflow-hidden animate-in fade-in duration-1000">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-headline font-black flex items-center gap-4">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                  Recommended <span className="text-accent underline decoration-4 underline-offset-8">For You</span>
                </h2>
                <p className="text-muted-foreground mt-2 font-medium">AI-curated selections based on your favorites.</p>
              </div>
              {loadingRecs && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.length > 0 ? (
                recommendations.map(food => (
                  <FoodCard key={food.id} food={food} />
                ))
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-white/50 animate-pulse border border-dashed" />
                ))
              )}
            </div>
          </section>
        )}

        {/* 3. Categories Browsing Section */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
            <div>
              <h2 className="text-4xl font-headline font-black">
                Explore <span className="text-primary italic">Menu</span>
              </h2>
              <p className="text-muted-foreground mt-2 font-medium">Browse by cuisine and dietary choice.</p>
            </div>
            
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 rounded-2xl gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all font-bold">
                  <Filter className="w-5 h-5" />
                  Refine Results
                  {activeFilterCount > 0 && (
                    <Badge className="bg-white text-primary ml-2 rounded-full px-2">{activeFilterCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-[2.5rem] border-none">
                <SheetHeader className="pb-8 border-b">
                  <SheetTitle className="text-3xl font-headline font-black flex items-center gap-3">
                    <Filter className="w-8 h-8 text-primary" />
                    Menu Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="py-10 space-y-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dietary Choice</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant={isVegOnly === null ? 'default' : 'outline'} onClick={() => setIsVegOnly(null)} className="rounded-xl font-bold">All</Button>
                      <Button variant={isVegOnly === true ? 'default' : 'outline'} onClick={() => setIsVegOnly(true)} className={cn("rounded-xl font-bold", isVegOnly === true && "bg-green-600")}>Veg</Button>
                      <Button variant={isVegOnly === false ? 'default' : 'outline'} onClick={() => setIsVegOnly(false)} className={cn("rounded-xl font-bold", isVegOnly === false && "bg-red-600")}>Non-Veg</Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Max Price</label>
                      <span className="font-headline font-black text-2xl text-primary">₹{maxPrice}</span>
                    </div>
                    <Slider value={[maxPrice]} max={1000} step={10} onValueChange={([val]) => setMaxPrice(val)} />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Min Rating</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 4, 4.5, 4.8].map((r) => (
                        <Button 
                          key={r}
                          variant={minRating === r ? 'default' : 'outline'}
                          onClick={() => setMinRating(minRating === r ? 0 : r)}
                          className="rounded-xl font-bold h-11"
                        >
                          {r}★
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <SheetFooter className="flex-col gap-4 pt-8 border-t mt-auto">
                  <Button variant="ghost" className="w-full text-muted-foreground font-black uppercase tracking-widest text-[10px]" onClick={resetFilters}>Clear All</Button>
                  <Button className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20" onClick={() => setShowFilters(false)}>Apply Filters</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-8 overflow-x-auto pb-10 no-scrollbar snap-x">
            <div 
              onClick={() => setSelectedCategory('All')}
              className={`flex-shrink-0 w-36 snap-start cursor-pointer group transition-all duration-500 ${selectedCategory === 'All' ? 'scale-110' : ''}`}
            >
              <div className={`aspect-square rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-500 ${selectedCategory === 'All' ? 'border-primary bg-primary shadow-2xl shadow-primary/30' : 'border-white bg-white hover:border-primary/20 shadow-md'}`}>
                <Utensils className={`w-12 h-12 transition-colors duration-500 ${selectedCategory === 'All' ? 'text-white' : 'text-primary'}`} />
              </div>
              <p className={`text-center mt-4 font-black text-sm uppercase tracking-wider ${selectedCategory === 'All' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>All Foods</p>
            </div>
            
            {categoriesConfig.map((cat) => {
              const placeholder = PlaceHolderImages.find(img => img.id === cat.image);
              const isActive = selectedCategory === cat.name;
              
              return (
                <div 
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 w-36 snap-start cursor-pointer group transition-all duration-500 ${isActive ? 'scale-110' : ''}`}
                >
                  <div className={`relative aspect-square rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 shadow-md ${isActive ? 'border-primary shadow-2xl shadow-primary/30' : 'border-white hover:border-primary/20'}`}>
                    {placeholder && (
                      <Image 
                        src={placeholder.imageUrl} 
                        alt={cat.name} 
                        fill 
                        className={`object-cover transition-all duration-1000 group-hover:scale-110 ${isActive ? 'opacity-30' : 'opacity-70 grayscale-[20%]'}`} 
                        data-ai-hint={placeholder.imageHint}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <cat.icon className={cn("w-12 h-12 drop-shadow-2xl transition-all duration-500", isActive ? "text-white scale-110" : "text-white opacity-80")} />
                    </div>
                  </div>
                  <p className={`text-center mt-4 font-black text-sm uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>{cat.name}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Full Specials / Filtered Grid Section */}
        <section id="full-menu" className="pt-12 border-t border-dashed">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-headline font-black">
                {search || activeFilterCount > 0 ? (
                  <>Match <span className="text-primary italic">Results</span></>
                ) : (
                  selectedCategory === 'All' ? 'The Complete Menu' : `${selectedCategory} Collection`
                )}
              </h3>
              <p className="text-muted-foreground mt-1 font-medium">{filteredFoods.length} items available</p>
            </div>
          </div>
          
          {foodsLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="font-bold text-muted-foreground animate-pulse">Loading delicious options...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {filteredFoods.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}

          {!foodsLoading && filteredFoods.length === 0 && (
            <div className="text-center py-40 bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted flex flex-col items-center">
              <UtensilsCrossed className="w-24 h-24 mb-6 text-muted-foreground opacity-20" />
              <p className="text-3xl text-foreground font-black">Nothing found</p>
              <p className="text-muted-foreground mt-2 max-w-sm font-medium">Try resetting your filters or adjusting your search.</p>
              <Button variant="outline" className="mt-10 rounded-2xl h-14 px-8 font-black border-primary text-primary hover:bg-primary hover:text-white" onClick={resetFilters}>Reset All Filters</Button>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t py-20 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <ChefHat className="text-primary w-8 h-8" />
            <span className="text-2xl font-headline font-black">Bhartiya Swad</span>
          </div>
          <p className="text-muted-foreground font-medium mb-8 max-w-md mx-auto">The ultimate Indian food delivery experience.</p>
          <div className="flex justify-center gap-8 text-sm font-bold text-muted-foreground">
            <Link href="/menu" className="hover:text-primary">Full Menu</Link>
            <Link href="#" className="hover:text-primary">Privacy</Link>
            <Link href="#" className="hover:text-primary">Terms</Link>
          </div>
          <p className="mt-12 text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">© 2025 Bhartiya Swad. Authentic & Sharp.</p>
        </div>
      </footer>
    </div>
  );
}
