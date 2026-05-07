
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  ChefHat, 
  Sparkles, 
  Utensils,
  Loader2,
  Flame,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Home,
  Heart,
  MessageSquare,
  Lock,
  ChevronRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import ChangePasswordForm from '@/components/ChangePasswordForm';
import NotificationBell from '@/components/NotificationBell';
import { personalizedFoodRecommendations } from '@/ai/flows/personalized-food-recommendations-flow';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import UserNav from '@/components/UserNav';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { items, removeFromCart, updateQuantity, totalPrice, totalQuantity } = useCart();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, mounted]);

  // Subscription to Favorites for Heart Toggles
  const favQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(collection(db, 'favorites'), where('userId', '==', user.uid));
  }, [db, user?.uid]);
  const { data: favorites } = useCollection(favQuery);
  const favoriteIds = useMemo(() => new Set(favorites?.map(f => f.dishId)), [favorites]);

  // Shared Source of Truth for Recommendations
  const recsRef = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return doc(db, 'userRecommendations', user.uid);
  }, [db, user?.uid]);
  const { data: persistedRecs, isLoading: recsFetching } = useDoc(recsRef);

  const dishesQuery = useMemoFirebase(() => {
    return query(collection(db, 'dishes'), limit(150));
  }, [db]);
  const { data: allDishes } = useCollection(dishesQuery);

  const trendingQuery = useMemoFirebase(() => {
    return query(collection(db, 'dishes'), orderBy('totalOrders', 'desc'), limit(4));
  }, [db]);
  const { data: trendingDishes } = useCollection(trendingQuery);

  const generateRecommendations = async () => {
    if (!user?.uid || !allDishes || allDishes.length === 0) return;
    
    setLoadingRecs(true);
    try {
      const currentIds = persistedRecs?.recommendations?.map((r: any) => r.id) || [];
      const orderRef = collection(db, 'orders');
      const q = query(orderRef, where('userId', '==', user.uid), limit(20));
      const orderSnap = await getDocs(q);
      
      const history: { name: string; category?: string }[] = [];
      orderSnap.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((item: any) => {
            if (item.name) {
              const matchedDish = allDishes.find(d => d.id === item.dishId || d.name === item.name);
              history.push({ name: item.name, category: matchedDish?.category });
            }
          });
        }
      });

      const entropy = Math.random();
      const result = await personalizedFoodRecommendations({
        userFoodHistory: history,
        availableFoods: allDishes.map(f => ({
          id: f.id,
          name: f.name,
          price: Number(f.price),
          category: f.category,
          rating: f.rating,
          image: f.image || f.imageURL,
          isVeg: f.isVeg,
          description: f.description
        })),
        recentlySeenIds: currentIds,
        entropy: entropy
      });
      
      await setDoc(doc(db, 'userRecommendations', user.uid), {
        userId: user.uid,
        userName: user.displayName,
        recommendations: result.recommendations,
        entropy: entropy,
        updatedAt: serverTimestamp()
      });

      toast.success("Curated your menu!");
    } catch (e) {
      console.error("AI Error:", e);
      toast.error("Failed to update AI menu.");
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (mounted && user && allDishes && allDishes.length > 0 && persistedRecs === null && !recsFetching && !loadingRecs) {
      generateRecommendations();
    }
  }, [user?.uid, allDishes, persistedRecs, recsFetching, mounted]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin text-primary" />
          <p className="font-headline font-bold text-muted-foreground">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const recommendations = persistedRecs?.recommendations || [];

  const sidebarLinks = [
    { name: 'Dashboard', href: '/dashboard', active: true, icon: Home },
    { name: 'Full Menu', href: '/menu', active: false, icon: Utensils },
    { name: 'My Orders', href: '/orders', active: false, icon: ShoppingBag },
    { name: 'Favorites', href: '/favorites', active: false, icon: Heart },
    { name: 'Support', href: '/contact', active: false, icon: MessageSquare },
    { name: 'Security', href: '#security', active: false, icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-2xl font-black tracking-tight hidden md:block text-foreground">Bhartiya Swad</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative p-2 rounded-full hover:bg-primary/5 group transition-all active:scale-90">
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
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 animate-in fade-in">
                      <Utensils className="w-20 h-20 mb-6" />
                      <p className="font-black text-xl italic text-center">Your basket is waiting <br/>to be filled!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-primary/10 transition-all group hover:bg-white hover:shadow-sm">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white relative border shadow-sm transition-transform group-hover:scale-105">
                            <img src={item.imageURL || ''} alt={item.name} className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-sm">{item.name}</h4>
                            <p className="text-primary font-black text-lg">₹{item.price}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-colors"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-black">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-full border-primary/20 hover:bg-primary hover:text-white transition-colors"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => {
                            removeFromCart(item.id);
                            toast.success("Removed from basket");
                          }} className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
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
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Payable</span>
                        <span className="text-3xl font-headline font-black text-primary">₹{totalPrice}</span>
                      </div>
                    </div>
                    <Link href="/cart" className="w-full">
                      <Button className="w-full h-16 bg-primary text-xl font-black rounded-3xl shadow-xl shadow-primary/20 group overflow-hidden active:scale-95 transition-all text-white border-none">
                        View Cart <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3 pl-4 border-l">
              <UserNav />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex">
        <aside className="w-64 hidden lg:flex flex-col sticky top-24 h-[calc(100vh-6rem)] py-8 pr-8 animate-in slide-in-from-left-4 duration-700">
          <nav className="space-y-2">
            {sidebarLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start h-12 rounded-2xl px-6 font-bold transition-all gap-3",
                    link.active ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary hover:text-white" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 md:p-12 space-y-24 min-w-0">
          <section className="bg-muted/30 p-12 md:p-16 rounded-[4rem] border border-primary/5 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest border border-primary/5">
                  <Zap className="w-3 h-3 fill-primary" />
                  AI-Powered Recommendations
                </div>
                <h2 className="text-4xl font-headline font-black text-foreground">Smart Menu Curator</h2>
                <p className="text-muted-foreground font-medium max-w-lg">Personalized picks based on your unique flavor profile.</p>
              </div>
              <Button 
                onClick={generateRecommendations}
                disabled={loadingRecs || recsFetching}
                className="h-16 px-8 rounded-2xl bg-white hover:bg-muted/50 text-foreground border-2 border-primary/10 font-black text-lg shadow-xl active:scale-95 group"
              >
                {loadingRecs ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6 text-primary mr-2" /> Refresh Suggestions</>}
              </Button>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {(loadingRecs || recsFetching) ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded-[2.5rem] animate-pulse" />)
              ) : recommendations.length > 0 ? (
                recommendations.map((dish: any, i: number) => (
                  <div key={dish.id} className="animate-in fade-in zoom-in duration-700" style={{ animationDelay: `${i * 150}ms` }}>
                    <FoodCard food={dish} isFavorite={favoriteIds.has(dish.id)} />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center opacity-50">
                  <Utensils className="w-16 h-16 mb-4" />
                  <p className="font-black text-xl">Curating your first suggestions...</p>
                </div>
              )}
            </div>
          </section>

          {trendingDishes && trendingDishes.length > 0 && (
            <section className="space-y-10">
              <h2 className="text-4xl font-headline font-black flex items-center gap-4 text-foreground">
                <Flame className="w-10 h-10 text-accent animate-pulse" /> Hot & Trending
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {trendingDishes.map((dish) => (
                  <FoodCard key={dish.id} food={{...dish, imageURL: dish.image}} isFavorite={favoriteIds.has(dish.id)} />
                ))}
              </div>
            </section>
          )}

          <section id="security" className="max-w-2xl mx-auto w-full space-y-10">
            <h2 className="text-4xl font-headline font-black flex items-center gap-4">
              <Lock className="w-10 h-10 text-primary" /> Account Security
            </h2>
            <ChangePasswordForm />
          </section>
        </main>
      </div>

      <footer className="bg-white border-t py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <ChefHat className="text-primary w-8 h-8" />
            <span className="font-headline text-xl font-black">Bhartiya Swad</span>
          </div>
          <p className="text-xs text-muted-foreground font-bold">© 2025 Bhartiya Swad. Delivering authentic taste.</p>
        </div>
      </footer>
    </div>
  );
}
