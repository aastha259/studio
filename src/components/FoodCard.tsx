
"use client"

import React from 'react';
import Image from 'next/image';
import { Star, ShoppingCart, Leaf, Beef } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/cart-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface FoodCardProps {
  food: {
    id: string;
    name: string;
    price: number;
    category: string;
    rating: number;
    imageURL: string;
    trending?: boolean;
    description?: string;
    isVeg?: boolean;
  };
}

export default function FoodCard({ food }: FoodCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleOrderNow = () => {
    if (!user) {
      // Preserve the current path to return to after login
      router.push('/login?callbackUrl=/menu');
      return;
    }
    addToCart(food);
  };

  return (
    <div className="group h-full">
      <Card className="relative h-full flex flex-col overflow-hidden transition-all duration-500 bg-white border border-border/40 shadow-sm hover:shadow-2xl hover:-translate-y-2 rounded-[2.5rem]">
        {/* Image Container */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted m-3 rounded-[2rem] shadow-md">
          <Image
            src={food.imageURL}
            alt={food.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60" />
          
          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              {food.trending && (
                <Badge className="bg-accent text-white border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest shadow-lg animate-pulse backdrop-blur-md">
                  Trending
                </Badge>
              )}
              <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center border-2 backdrop-blur-md shadow-sm",
                food.isVeg ? "bg-white/90 border-green-600 text-green-600" : "bg-white/90 border-red-600 text-red-600"
              )}>
                {food.isVeg ? <Leaf className="w-3 h-3" /> : <Beef className="w-3 h-3" />}
              </div>
            </div>
            <div className="ml-auto bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl shadow-sm border border-white/40 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-black text-foreground">{food.rating}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 pb-6 flex-1 flex flex-col">
          <div className="mb-4">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em] mb-1">
              {food.category}
            </p>
            <h3 className="font-headline text-lg font-black leading-tight text-foreground line-clamp-1">
              {food.name}
            </h3>
          </div>
          
          {food.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-6 font-medium leading-relaxed opacity-80">
              {food.description}
            </p>
          )}

          {/* Footer Section */}
          <div className="mt-auto pt-4 border-t border-dashed border-muted flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 opacity-60">Price</span>
              <span className="text-2xl font-headline font-black text-foreground">₹{food.price}</span>
            </div>
            
            <Button 
              onClick={handleOrderNow}
              className="flex-1 rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.05] active:scale-95 group/btn"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Order Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
