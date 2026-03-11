
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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    // If we've finished loading and there's no user, or the user is not an admin, redirect.
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
  
  // Prevent flashing content before redirect
  if (!user || !user.isAdmin) return null;

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Sales Analytics', href: '/admin/sales', icon: BarChart3 },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Database', href: '/admin/database', icon: Database },
    { name: 'Recommendations', href: '/admin/recommendations', icon: Sparkles },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen shadow-xl z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <span className="font-headline text-xl font-bold">Admin Hub</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 rounded-xl px-4 transition-all group",
                    isActive 
                      ? "bg-primary/10 text-primary font-bold" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                  {item.name}
                  {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="bg-muted/50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Authenticated As</p>
            <p className="text-sm font-black truncate">{user.displayName || user.email}</p>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:bg-destructive/5 rounded-xl h-12"
            onClick={() => { logout(); router.push('/'); }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
