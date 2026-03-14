
"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, User, Utensils, History } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { personalizedFoodRecommendations } from '@/ai/flows/personalized-food-recommendations-flow';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminRecommendationsPage() {
  const db = useFirestore();
  const [activeRecs, setActiveRecs] = useState<Record<string, any[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: users } = useCollection(usersQuery);

  const dishesQuery = useMemoFirebase(() => collection(db, 'dishes'), [db]);
  const { data: dishes } = useCollection(dishesQuery);

  const generateForUser = async (userId: string, userName: string) => {
    setLoadingMap(prev => ({ ...prev, [userId]: true }));
    try {
      const mockHistory = [
        { name: 'Paneer Butter Masala', category: 'NORTH_INDIAN' },
        { name: 'Masala Dosa', category: 'SOUTH_INDIAN' }
      ];

      const result = await personalizedFoodRecommendations({
        userFoodHistory: mockHistory,
        availableFoods: dishes?.map(d => ({
          id: d.id,
          name: d.name,
          price: d.price,
          category: d.category,
          rating: d.rating,
          imageURL: d.image
        })) || []
      });

      setActiveRecs(prev => ({ ...prev, [userId]: result.recommendations }));
    } catch (e) {
      console.error("AI Recommendation failed", e);
    } finally {
      setLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-primary" />
          AI Recommendations
        </h1>
        <p className="text-muted-foreground">Preview generated suggestions for your active customer base.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users?.map((user) => (
          <Card key={user.id} className="border shadow-sm rounded-3xl overflow-hidden group hover:shadow-lg transition-all bg-white flex flex-col">
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
                className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => generateForUser(user.id, user.displayName)}
                disabled={loadingMap[user.id] || !dishes}
              >
                {loadingMap[user.id] ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                Run Prediction
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-6 flex-1 flex flex-col">
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Utensils className="w-3 h-3" />
                    Recommended for User
                  </h4>
                  {activeRecs[user.id] && (
                    <Badge variant="outline" className="rounded-full text-[10px] font-bold">AI Gen</Badge>
                  )}
                </div>
                
                {activeRecs[user.id] ? (
                  <ScrollArea className="flex-1 h-64 pr-4">
                    <div className="space-y-3">
                      {activeRecs[user.id].map((food, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/20 border rounded-2xl hover:bg-white hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border relative overflow-hidden">
                              <img src={food.imageURL} alt={food.name} className="object-cover w-full h-full" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{food.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium">{food.category}</p>
                            </div>
                          </div>
                          <p className="text-xs font-black text-primary">₹{food.price}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-30 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <History className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold">Pending AI Prediction</p>
                    <p className="text-[10px]">Click 'Run Prediction' to start</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
