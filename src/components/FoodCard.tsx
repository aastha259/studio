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
  food: any;
  isFavorite: boolean;
}

export default function FoodCard({ food, isFavorite }: FoodCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);

  const favDocId = user ? `${user.uid}_${food.id}` : null;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast.success("Login to save favorites ❤️");
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const favRef = doc(db, 'favorites', favDocId!);

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        toast.success("Removed from favorites 🤍");
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          dishId: food.id,
          name: food.name,
          price: food.price,
          image: food.imageURL || food.image,
          category: food.category,
          rating: food.rating,
          isVeg: food.isVeg,
          createdAt: serverTimestamp()
        });
        toast.success("Added to favorites ❤️");
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleOrderNow = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsAdding(true);
    try {
      await addToCart({ ...food });
      toast.success("Added to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const displayImage = food.imageURL || food.image;

  return (
    <Card className="p-4">
      <div className="relative">
        <Image src={displayImage} alt={food.name} width={300} height={300} />

        <Button onClick={handleToggleFavorite}>
          <Heart className={cn(isFavorite && "fill-red-500 text-red-500")} />
        </Button>
      </div>

      <h3>{food.name}</h3>
      <p>₹{food.price}</p>

      <Button onClick={handleOrderNow} disabled={isAdding}>
        {isAdding ? <Loader2 className="animate-spin" /> : <Plus />}
        Add
      </Button>
    </Card>
  );
}