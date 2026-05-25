import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Authorized administrative emails for Bhartiya Swad.
 * Add new admin emails to this list to grant them access to the Management Console.
 */
export const ADMIN_EMAILS = [
  'pqr@admin.com',
  'admin@bhartiyaswad.com'
];

/**
 * Helper to check if an email belongs to the authorized admin list.
 */
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Computes the standardized order status key based on time elapsed since creation.
 * Returns: 'placed' | 'preparing' | 'out_for_delivery' | 'delivered'
 */
export function computeOrderStatus(createdAt: any): string {
  if (!createdAt) return "placed";
  
  // Handle Firestore Timestamp or ISO string
  const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);

  if (diffInMinutes < 1) return "placed";
  if (diffInMinutes < 15) return "preparing";
  if (diffInMinutes < 25) return "out_for_delivery";
  return "delivered";
}

/**
 * Maps standardized status keys to human-readable display labels.
 */
export const STATUS_LABELS: Record<string, string> = {
  placed: "Order Placed",
  preparing: "Preparing Food",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered"
};
