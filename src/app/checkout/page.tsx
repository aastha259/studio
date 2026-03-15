
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChefHat, 
  ArrowLeft,
  CheckCircle2,
  Package,
  CreditCard,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/auth-context';
import { useCart } from '@/lib/contexts/cart-context';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?callbackUrl=/checkout');
    if (!authLoading && user && items.length === 0 && !isOrdered) router.push('/menu');
  }, [user, authLoading, items.length, isOrdered, router]);

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsOrdered(true);
      clearCart();
    }, 2000);
  };

  if (isOrdered) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-headline font-black text-foreground">Order Placed!</h1>
            <p className="text-muted-foreground font-medium">Your delicious meal is being prepared with love. You'll receive updates on your order shortly.</p>
          </div>
          <div className="pt-8 flex flex-col gap-4">
            <Link href="/dashboard">
              <Button className="w-full h-14 rounded-2xl bg-primary text-lg font-black">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/cart" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-black tracking-tight hidden md:block">Bhartiya Swad</span>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" className="font-bold gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-headline font-black">Checkout</h1>

        <div className="space-y-6">
          {/* Shipping Section */}
          <Card className="rounded-[2.5rem] border shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 p-8 border-b">
              <CardTitle className="flex items-center gap-3 text-xl font-headline font-black">
                <MapPin className="w-6 h-6 text-primary" /> Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">Home</p>
                  <p className="text-muted-foreground mt-1">123, Palm Grove Residency, Cyber City, Bangalore - 560103</p>
                </div>
                <Button variant="outline" className="rounded-xl font-bold">Change</Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card className="rounded-[2.5rem] border shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 p-8 border-b">
              <CardTitle className="flex items-center gap-3 text-xl font-headline font-black">
                <CreditCard className="w-6 h-6 text-primary" /> Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-muted rounded flex items-center justify-center font-bold text-[10px]">VISA</div>
                  <div>
                    <p className="font-bold">Visa ending in 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/26</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl font-bold">Change</Button>
              </div>
            </CardContent>
          </Card>

          {/* Final Summary Card */}
          <Card className="rounded-[2.5rem] bg-foreground text-white overflow-hidden shadow-2xl">
            <CardContent className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white/70">
                  <span className="font-bold">Items Total</span>
                  <span className="font-black">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span className="font-bold">Delivery & Taxes</span>
                  <span className="font-black">₹54</span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-xl font-headline font-black">Total Payable</span>
                  <span className="text-3xl font-headline font-black text-primary">₹{totalPrice + 54}</span>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full h-16 rounded-2xl bg-primary text-white text-xl font-black shadow-xl shadow-primary/20"
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : (
                  "Confirm & Pay Now"
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-white/40">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">PCI-DSS Compliant Encryption</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
