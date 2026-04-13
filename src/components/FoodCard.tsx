"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, Leaf, Beef, Plus, Heart, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/cart-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface FoodCardProps {
  food: {
    id: string;
    name: string;
    price: number;
    description?: string;
    category?: string;
    rating?: number;
    imageURL?: string;
    image?: string;
    isVeg?: boolean;
  };
  isFavorite?: boolean;
}

export default function FoodCard({ food, isFavorite = false }: FoodCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const displayImage = food.imageURL || food.image || `https://picsum.photos/seed/${food.id}/400/400`;
  const favDocId = user ? `${user.uid}_${food.id}` : null;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast("Sign in to save your favorites!", { icon: '❤️' });
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsFavoriting(true);
    const favRef = doc(db, 'favorites', favDocId!);

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        toast.success("Removed from favorites");
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          dishId: food.id,
          name: food.name,
          price: food.price,
          image: displayImage,
          category: food.category || 'General',
          rating: food.rating || 4.5,
          isVeg: !!food.isVeg,
          createdAt: serverTimestamp()
        });
        toast.success("Added to favorites ❤️");
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      toast.error("Action failed. Please try again.");
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      localStorage.setItem("pendingCartItem", JSON.stringify(food));
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsAdding(true);
    try {
      await addToCart({ ...food, id: food.id });
      toast.success(`${food.name} added to basket`);
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="group relative bg-white border border-primary/5 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image 
          src={displayImage} 
          alt={food.name} 
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <Badge className={cn(
            "rounded-full px-3 py-1 border-none shadow-lg text-[10px] font-black uppercase tracking-tighter transition-all",
            food.isVeg ? "bg-green-500 text-white" : "bg-red-500 text-white"
          )}>
            {food.isVeg ? <Leaf className="w-3 h-3 mr-1" /> : <Beef className="w-3 h-3 mr-1" />}
            {food.isVeg ? 'Veg' : 'Non-Veg'}
          </Badge>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleToggleFavorite}
            disabled={isFavoriting}
            className={cn(
              "h-10 w-10 rounded-2xl backdrop-blur-md transition-all active:scale-90",
              isFavorite 
                ? "bg-white text-red-500 shadow-xl" 
                : "bg-white/40 text-white hover:bg-white hover:text-red-500"
            )}
          >
            {isFavoriting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            )}
          </Button>
        </div>

        {food.rating && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl flex items-center gap-1 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-black text-foreground">{food.rating}</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{food.category?.replace('_', ' ')}</p>
          <h3 className="text-xl font-headline font-black text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">{food.name}</h3>
          {food.description && (
            <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
              {food.description}
            </p>
          )}
        </div>

        <div className="pt-2 mt-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Price</span>
            <span className="text-2xl font-headline font-black text-foreground">₹{food.price}</span>
          </div>
          
          <Button 
            onClick={handleAddToCart}
            disabled={isAdding}
            className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-black h-12 px-6 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 group/btn"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                <span className="text-sm">Add</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
