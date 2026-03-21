import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Computes the order status based on time elapsed since creation.
 * Logic:
 * < 1 min: Order Placed
 * 1-15 min: Preparing Food
 * 15-25 min: Out for Delivery
 * > 25 min: Delivered
 */
export function computeOrderStatus(createdAt: any): string {
  if (!createdAt) return "Order Placed";
  
  // Handle Firestore Timestamp or ISO string
  const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);

  if (diffInMinutes < 1) return "Order Placed";
  if (diffInMinutes < 15) return "Preparing Food";
  if (diffInMinutes < 25) return "Out for Delivery";
  return "Delivered";
}
