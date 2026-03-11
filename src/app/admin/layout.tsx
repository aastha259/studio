
"use client"

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Database, 
  Sparkles, 
  LogOut,
  ChefHat,
  ChevronRight,
  Bell,
  Search,
  User as UserIcon,
  ShoppingBag,
  Store,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user || !user.isAdmin) {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  
  if (!user || !user.isAdmin) return null;

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Sales Analytics', href: '/admin/sales', icon: BarChart3 },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Database Management', href: '/admin/database', icon: Database },
    { name: 'Recommendations', href: '/admin/recommendations', icon: Sparkles },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Restaurants', href: '/admin/restaurants', icon: Store },
  ];

  return (
    <div className="flex min-h-screen bg-[#FDFBF9]">
      {/* Fixed Left Sidebar */}
      <aside className="w-72 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen shadow-sm z-30">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-lg font-black leading-tight">Bhartiya Swad</span>
            <span className="text-[10px] uppercase tracking-tighter font-bold text-primary">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 rounded-xl px-4 transition-all group",
                    isActive 
                      ? "bg-primary text-white font-bold hover:bg-primary hover:text-white" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                  <span className="text-sm">{item.name}</span>
                  {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:bg-destructive/5 rounded-xl h-12 px-4"
            onClick={() => { logout(); router.push('/'); }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-bold">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-20 bg-white border-b sticky top-0 z-20 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6 flex-1">
            <div className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </div>
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search analytics, customers, orders..." 
                className="pl-10 h-11 bg-muted/30 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white"></span>
            </Button>
            
            <div className="flex items-center gap-3 pl-6 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black">{user.displayName || 'Administrator'}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Global Admin</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} />
                <AvatarFallback><UserIcon /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
