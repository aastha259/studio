"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, User, Utensils, History, AlertCircle } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useAuth } from '@/lib/contexts/auth-context';
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { personalizedFoodRecommendations } from '@/ai/flows/personalized-food-recommendations-flow';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function AdminRecommendationsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  // Strict authorized email guard
  const isAuthorized = currentUser?.isAdmin && currentUser.email === 'pqr@admin.com';

  const usersQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'users');
  }, [db, isAuthorized]);
  const { data: users, error: usersError } = useCollection(usersQuery);

  const dishesQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'dishes');
  }, [db, isAuthorized]);
  const { data: dishes } = useCollection(dishesQuery);

  const generateForUser = async (userId: string, userName: string) => {
    if (!dishes) return;
    setLoadingMap(prev => ({ ...prev, [userId]: true }));
    
    try {
      // Fetch current recommendations to extract exclusion IDs for variety
      const recDocRef = doc(db, 'userRecommendations', userId);
      const recSnap = await getDoc(recDocRef);
      const currentIds = recSnap.exists() 
        ? recSnap.data().recommendations?.map((r: any) => r.id) || [] 
        : [];

      // Fetch real history for this user
      const orderRef = collection(db, 'orders');
      const q = query(orderRef, where('userId', '==', userId), limit(15));
      const orderSnap = await getDocs(q);
      
      const history: { name: string; category?: string }[] = [];
      orderSnap.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items.forEach((item: any) => {
            if (item.name) {
              history.push({
                name: item.name,
                category: dishes.find(d => d.id === item.dishId || d.name === item.name)?.category
              });
            }
          });
        }
      });

      const result = await personalizedFoodRecommendations({
        userFoodHistory: history,
        availableFoods: dishes.map(d => ({
          id: d.id,
          name: d.name,
          price: Number(d.price),
          category: d.category,
          rating: d.rating,
          image: d.image || d.imageURL,
          isVeg: d.isVeg,
          description: d.description
        })),
        recentlySeenIds: currentIds,
        entropy: Math.random()
      });

      // Persist to shared collection
      await setDoc(doc(db, 'userRecommendations', userId), {
        userId: userId,
        userName: userName,
        recommendations: result.recommendations,
        updatedAt: serverTimestamp()
      });

      toast({ title: "AI Sync Complete", description: `Personalized menu generated for ${userName}.` });
    } catch (e: any) {
      console.error("AI Recommendation failed", e);
      toast({ 
        variant: "destructive", 
        title: "Prediction Error", 
        description: "Failed to run AI prediction."
      });
    } finally {
      setLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-primary" />
          AI Recommendations
        </h1>
        <p className="text-muted-foreground">Preview and manage suggestions for your active customer base.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users?.map((user) => (
          <UserRecCard 
            key={user.id} 
            user={user} 
            dishes={dishes} 
            loading={loadingMap[user.id]} 
            onGenerate={() => generateForUser(user.id, user.displayName || 'Guest')} 
          />
        ))}
      </div>
    </div>
  );
}

function UserRecCard({ user, dishes, loading, onGenerate }: any) {
  const db = useFirestore();
  const recsRef = useMemoFirebase(() => doc(db, 'userRecommendations', user.id), [db, user.id]);
  const { data: recDoc } = useDoc(recsRef);

  const recommendations = recDoc?.recommendations || [];

  return (
    <Card className="border shadow-sm rounded-3xl overflow-hidden group hover:shadow-lg transition-all bg-white flex flex-col">
      <CardHeader className="bg-muted/30 p-8 pb-4 border-b border-primary/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-headline font-bold truncate">{user.displayName || 'Guest'}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">UID: {user.id.slice(0, 8)}</p>
          </div>
        </div>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-white border-none"
          onClick={onGenerate}
          disabled={loading || !dishes}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 mr-2" />
          )}
          {recommendations.length > 0 ? "Regenerate AI" : "Run Initial Prediction"}
        </Button>
      </CardHeader>
      <CardContent className="p-8 pt-6 flex-1 flex flex-col">
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Utensils className="w-3 h-3" />
              User's Smart Menu
            </h4>
            {recommendations.length > 0 && (
              <Badge className="rounded-full text-[10px] font-bold bg-primary/10 text-primary border-none">Shared State</Badge>
            )}
          </div>
          
          {recommendations.length > 0 ? (
            <ScrollArea className="flex-1 h-64 pr-4">
              <div className="space-y-4">
                {recommendations.map((food: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-2xl hover:bg-white hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border relative overflow-hidden">
                          <img src={food.image || food.imageURL} alt={food.name} className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{food.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{food.category}</p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-primary">₹{food.price}</p>
                    </div>
                    {food.reason && (
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter px-2">
                         AI: {food.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-30 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <History className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold">Pending Prediction</p>
              <p className="text-[10px]">Parity with user dashboard required</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}