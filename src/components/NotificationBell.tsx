
"use client"

import React, { useMemo } from 'react';
import { Bell, Check, Info, ShoppingBag } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/lib/contexts/auth-context';
import { collection, query, where, orderBy, limit, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const { user } = useAuth();
  const db = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db, user?.uid]);

  const { data: notifications } = useCollection(notificationsQuery);

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.read).length || 0;
  }, [notifications]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    if (!notifications || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      }
    });
    try {
      await batch.commit();
      toast.success("All notifications cleared");
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-all active:scale-90">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-accent text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 sm:w-96 rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl" align="end">
        <div className="bg-primary p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="font-headline font-black text-xl">Activity</h3>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Recent Notifications</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-white hover:bg-white/20 rounded-xl text-xs font-bold"
            >
              Clear All
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {notifications && notifications.length > 0 ? (
              notifications.map((n) => (
                <DropdownMenuItem 
                  key={n.id} 
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-colors mb-1",
                    !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    n.type === 'order' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {n.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm leading-tight", !n.read ? "font-black" : "font-medium text-muted-foreground")}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold">
                      {n.createdAt ? format(n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt), 'MMM dd, p') : 'Just now'}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 bg-accent rounded-full mt-2" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center opacity-30">
                <Bell className="w-12 h-12 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest">No notifications yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator className="bg-muted" />
        <div className="p-4 bg-muted/20 text-center">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">End of Stream</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
