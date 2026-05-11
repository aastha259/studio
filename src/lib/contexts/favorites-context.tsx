
"use client"

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import toast from 'react-hot-toast';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  toggleFavorite: (food: any) => Promise<void>;
  isLoading: boolean;
  isFavorited: (dishId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();

  const favQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid)
    );
  }, [db, user?.uid]);

  const { data: favorites, isLoading } = useCollection(favQuery);

  const favoriteIds = useMemo(() => {
    return new Set(favorites?.map(f => f.dishId) || []);
  }, [favorites]);

  const isFavorited = (dishId: string) => favoriteIds.has(dishId);

  const toggleFavorite = async (food: any) => {
    if (!user) {
      toast("Sign in to save favorites!", { icon: '❤️' });
      return;
    }

    const dishId = food.id || food.dishId;
    const favDocId = `${user.uid}_${dishId}`;
    const favRef = doc(db, 'favorites', favDocId);
    const currentlyFavorited = isFavorited(dishId);

    try {
      if (currentlyFavorited) {
        // Optimistic UI state is handled by the real-time listener reaction
        await deleteDoc(favRef);
        toast.success("Removed from favorites");
      } else {
        const favData = {
          userId: user.uid,
          dishId: dishId,
          name: food.name,
          price: food.price,
          image: food.image || food.imageURL || `https://picsum.photos/seed/${dishId}/400/400`,
          category: food.category || 'General',
          rating: food.rating || 4.5,
          isVeg: !!food.isVeg,
          createdAt: serverTimestamp()
        };
        await setDoc(favRef, favData);
        toast.success("Added to favorites ❤️");
      }
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: favRef.path,
        operation: currentlyFavorited ? 'delete' : 'write',
      }));
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isLoading, isFavorited }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
