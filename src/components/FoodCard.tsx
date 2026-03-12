"use client"

import React from 'react';
import Image from 'next/image';
import { Star, Plus, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/cart-context';
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
  };
}

export default function FoodCard({ food }: FoodCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="group h-full">
      <Card className="relative h-full flex flex-col overflow-hidden transition-all duration-500 bg-white border border-border/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 rounded-[2rem]">
        {/* Image Container */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={food.imageURL}
            alt={food.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          
          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            {food.trending && (
              <Badge className="bg-accent text-white border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-lg animate-pulse">
                Trending
              </Badge>
            )}
            <div className="ml-auto bg-white/90 backdrop-blur-sm px-2 py-1 rounded-xl shadow-sm border border-white/20 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-black text-foreground">{food.rating}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-4">
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3 className="font-headline text-lg font-black leading-tight text-foreground line-clamp-1">
                {food.name}
              </h3>
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              {food.category}
            </p>
          </div>
          
          {food.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-6 font-medium leading-relaxed">
              {food.description}
            </p>
          )}

          {/* Footer Section */}
          <div className="mt-auto pt-4 border-t border-dashed flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Price</span>
              <span className="text-2xl font-headline font-black text-foreground">₹{food.price}</span>
            </div>
            
            <Button 
              size="icon" 
              onClick={() => addToCart(food)}
              className="rounded-2xl w-12 h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95 group/btn"
            >
              <Plus className="w-6 h-6 transition-transform group-hover/btn:rotate-90" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
