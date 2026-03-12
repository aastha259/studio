
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, 
  ShoppingCart, 
  ChefHat, 
  TrendingUp, 
  Sparkles, 
  LogOut,
  MapPin,
  Utensils,
  Loader2,
  UtensilsCrossed,
  Soup,
  Store,
  Pizza,
  Beef,
  Flame,
  IceCreamCone,
  Coffee
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const categoriesConfig = [
  { name: 'North Indian', icon: UtensilsCrossed, image: 'cat-north-indian' },
  { name: 'South Indian', icon: Soup, image: 'cat-south-indian' },
  { name: 'Street Food', icon: Store, image: 'cat-street-food' },
  { name: 'Fast Food', icon: Pizza, image: 'cat-fast-food' },
  { name: 'Chinese', icon: Beef, image: 'cat-chinese' },
  { name: 'Biryani', icon: Flame, image: 'cat-biryani' },
  { name: 'Sweets & Desserts', icon: IceCreamCone, image: 'cat-sweets' },
  { name: 'Beverages', icon: Coffee, image: 'cat-beverages' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const db = useFirestore();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Fetch all available foods from Firestore
  const foodsQuery = useMemoFirebase(() => collection(db, 'foods'), [db]);
  const { data: allFoods, isLoading: foodsLoading } = useCollection(foodsQuery);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  // Fetch real order history and generate AI recommendations
  useEffect(() => {
    async function getPersonalizedRecommendations() {
      if (!user?.uid || !allFoods || allFoods.length === 0) return;
      
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

    if (allFoods) {
      getPersonalizedRecommendations();
    }
  }, [user?.uid, allFoods, db]);

  const filteredFoods = (allFoods || []).filter(food => {
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
            <span className="font-headline text-xl font-bold hidden md:block text-foreground">Bhartiya Swad</span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Explore Categories Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-headline font-black mb-6 text-foreground">
            Explore <span className="text-primary italic">Categories</span>
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
            <div 
              onClick={() => setSelectedCategory('All')}
              className={`flex-shrink-0 w-32 snap-start cursor-pointer group transition-all ${selectedCategory === 'All' ? 'scale-105' : ''}`}
            >
              <div className={`aspect-square rounded-[2rem] flex items-center justify-center border-4 transition-all duration-300 ${selectedCategory === 'All' ? 'border-primary bg-primary shadow-xl shadow-primary/20' : 'border-white bg-white hover:border-primary/20 shadow-sm'}`}>
                <Utensils className={`w-10 h-10 transition-colors ${selectedCategory === 'All' ? 'text-white' : 'text-primary'}`} />
              </div>
              <p className={`text-center mt-3 font-bold text-sm ${selectedCategory === 'All' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>All Dishes</p>
            </div>
            
            {categoriesConfig.map((cat) => {
              const placeholder = PlaceHolderImages.find(img => img.id === cat.image);
              const isActive = selectedCategory === cat.name;
              
              return (
                <div 
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 w-32 snap-start cursor-pointer group transition-all ${isActive ? 'scale-105' : ''}`}
                >
                  <div className={`relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all duration-300 shadow-sm ${isActive ? 'border-primary shadow-xl shadow-primary/20' : 'border-white hover:border-primary/20'}`}>
                    {placeholder && (
                      <Image 
                        src={placeholder.imageUrl} 
                        alt={cat.name} 
                        fill 
                        className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isActive ? 'opacity-40 grayscale-0' : 'opacity-80 grayscale-[20%]'}`} 
                        data-ai-hint={placeholder.imageHint}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <cat.icon className={`w-10 h-10 drop-shadow-lg transition-colors ${isActive ? 'text-white' : 'text-white'}`} />
                    </div>
                  </div>
                  <p className={`text-center mt-3 font-bold text-sm ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>{cat.name}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recommendations Section */}
        {(recommendations.length > 0 || loadingRecs) && (
          <div className="mb-16 bg-gradient-to-br from-primary/5 to-accent/5 p-8 rounded-[2.5rem] border border-primary/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-headline font-black flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  Recommended For You
                </h2>
                <p className="text-muted-foreground mt-1 font-medium">Tailored tastes based on your order history</p>
              </div>
              {loadingRecs && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
            
            {!loadingRecs && recommendations.length === 0 && (
              <div className="py-12 text-center opacity-40">
                <Utensils className="w-12 h-12 mx-auto mb-4" />
                <p className="font-bold">Order more to unlock personalized suggestions!</p>
              </div>
            )}
          </div>
        )}

        {/* Main Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-headline font-black flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-accent" />
              {selectedCategory === 'All' ? 'Popular Dishes' : `${selectedCategory} Specials`}
            </h2>
          </div>
          
          {foodsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredFoods.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </div>

        {!foodsLoading && filteredFoods.length === 0 && (
          <div className="text-center py-20">
            <Utensils className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground font-bold">No dishes found matching your selection</p>
          </div>
        )}
      </main>
    </div>
  );
}
