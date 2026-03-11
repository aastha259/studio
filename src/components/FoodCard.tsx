"use client"

import React from 'react';
import Image from 'next/image';
import { Star, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/contexts/cart-context';

interface FoodCardProps {
  food: {
    id: string;
    name: string;
    price: number;
    category: string;
    rating: number;
    imageURL: string;
    trending?: boolean;
  };
}

export default function FoodCard({ food }: FoodCardProps) {
  const { addToCart } = useCart();

  return (
    <div className="perspective-1000 group">
      <Card className="relative h-full overflow-hidden transition-all duration-500 bg-card border-none shadow-xl group-hover:rotate-x-12 group-hover:-rotate-y-12 group-hover:scale-105 group-hover:shadow-2xl preserve-3d">
        {food.trending && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full shadow-lg">
            TRENDING
          </div>
        )}
        
        <div className="relative w-full h-48 overflow-hidden bg-muted">
          <Image
            src={food.imageURL}
            alt={food.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-headline text-lg font-bold leading-tight group-hover:translate-z-20 transition-transform">
              {food.name}
            </h3>
            <div className="flex items-center bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-400 text-sm font-bold">
              <Star className="w-3 h-3 fill-current mr-1" />
              {food.rating}
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm mb-4">{food.category}</p>
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-xl font-headline font-bold text-primary">₹{food.price}</span>
            <Button 
              size="sm" 
              onClick={() => addToCart(food)}
              className="rounded-full w-10 h-10 p-0 shadow-lg hover:shadow-primary/50 transition-all"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}