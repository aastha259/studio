
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ChefHat, 
  Sparkles, 
  LogOut,
  Utensils,
  Loader2,
  Flame,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { items, removeFromCart, totalPrice, clearCart } = useCart();
  const db = useFirestore();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Fetch all foods for context
  const foodsQuery = useMemoFirebase(() => collection(db, 'foods'), [db]);
  const { data: allFoods } = useCollection(foodsQuery);

  // Trending items
  const trendingQuery = useMemoFirebase(() => {
    return query(collection(db, 'foods'), orderBy('totalOrders', 'desc'), limit(4));
  }, [db]);
  const { data: trendingFoods } = useCollection(trendingQuery);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  // AI Recommendations
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
        console.error("AI flow failed", e);
      } finally {
        setLoadingRecs(false);
      }
    }
    if (allFoods) getPersonalizedRecommendations();
  }, [user?.uid, allFoods, db]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Shared Header */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-xl font-bold hidden md:block">Bhartiya Swad</span>
          </Link>

          <div className="flex gap-4 items-center">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-black text-primary px-3 border-b-2 border-primary">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/menu" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
              <Utensils className="w-4 h-4" />
              Menu
            </Link>
          </div>

          <div className="flex items-center gap-4">
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
              <SheetContent className="w-full sm:max-w-md flex flex-col rounded-l-[2.5rem]">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-2xl font-headline flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                    Basket
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 py-6">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                      <Utensils className="w-16 h-16 mb-4" />
                      <p className="font-bold">Your basket is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted relative border">
                            <img src={item.imageURL} alt={item.name} className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">{item.name}</h4>
                            <p className="text-primary font-bold">₹{item.price}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-destructive font-bold">Remove</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {items.length > 0 && (
                  <SheetFooter className="pt-6 border-t flex-col sm:flex-col gap-4">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-headline font-black text-primary">₹{totalPrice}</span>
                    </div>
                    <Button className="w-full h-14 bg-primary text-lg font-bold rounded-2xl shadow-xl" onClick={() => { alert("Order Placed!"); clearCart(); }}>Checkout</Button>
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

      {/* Overview Area */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-5xl font-headline font-black text-foreground leading-tight">
                Namaste, <span className="text-primary">{user.displayName}</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-lg font-medium">Hungry for something authentic today?</p>
            </div>
            <Link href="/menu">
              <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                Explore Full Menu
              </Button>
            </Link>
          </div>
        </section>

        {/* Quick Highlights */}
        {trendingFoods && trendingFoods.length > 0 && (
          <section>
            <h2 className="text-3xl font-headline font-black mb-8 flex items-center gap-3">
              <Flame className="w-8 h-8 text-accent animate-bounce" />
              Community Favorites
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingFoods.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </section>
        )}

        {/* Personal Touch */}
        {(recommendations.length > 0 || loadingRecs) && (
          <section className="bg-muted/30 p-10 rounded-[2.5rem] border relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-headline font-black flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                Pick of the Day
              </h2>
              {loadingRecs && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommendations.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
