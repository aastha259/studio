
"use client"

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChefHat, 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  CreditCard,
  Utensils,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const TRACKING_STEPS = [
  { id: 'Pending', label: 'Order Placed', icon: Clock, color: 'bg-blue-500' },
  { id: 'Preparing', label: 'Preparing Food', icon: Utensils, color: 'bg-orange-500' },
  { id: 'Out for Delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-indigo-500' },
  { id: 'Delivered', label: 'Delivered', icon: CheckCircle2, color: 'bg-green-500' },
];

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: authLoading } = useAuth();

  const orderRef = useMemoFirebase(() => {
    if (!orderId) return null;
    return doc(db, 'orders', orderId as string);
  }, [db, orderId]);

  const { data: order, isLoading: orderLoading } = useDoc(orderRef);

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const index = TRACKING_STEPS.findIndex(step => step.id === order.status);
    return index === -1 ? 0 : index;
  }, [order]);

  if (authLoading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="font-headline font-bold text-muted-foreground">Locating your meal...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] p-6 text-center">
        <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-headline font-black mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">The order ID you requested doesn't exist or you don't have permission to view it.</p>
        <Link href="/dashboard">
          <Button className="rounded-2xl h-14 px-8 bg-primary font-bold">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-black tracking-tight hidden md:block">Bhartiya Swad</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="font-bold gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-headline font-black tracking-tight">Track Order</h1>
            <p className="text-muted-foreground font-medium mt-1">Order ID: <span className="font-mono text-primary font-bold">#{order.id.slice(0, 12).toUpperCase()}</span></p>
          </div>
          <Badge className={cn(
            "h-10 px-6 rounded-full font-black text-xs uppercase tracking-widest",
            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
          )}>
            {order.status || 'Processing'}
          </Badge>
        </div>

        {/* Real-time Tracking Stepper */}
        <Card className="rounded-[3rem] border shadow-2xl overflow-hidden bg-white">
          <CardContent className="p-10 md:p-16">
            <div className="relative">
              {/* Desktop Stepper */}
              <div className="hidden md:flex justify-between items-start">
                {TRACKING_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx <= currentStepIndex;
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">
                      <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-700",
                        isActive ? `${step.color} text-white shadow-xl scale-110` : 'bg-muted/30 text-muted-foreground'
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                      </div>
                      <div className="mt-6 text-center">
                        <p className={cn("font-headline font-black text-sm transition-colors", isActive ? 'text-foreground' : 'text-muted-foreground')}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1 animate-pulse">In Progress</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Line (Desktop) */}
              <div className="hidden md:block absolute top-8 left-0 w-full h-1 bg-muted/20 -z-0">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-in-out" 
                  style={{ width: `${(currentStepIndex / (TRACKING_STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {/* Mobile Stepper */}
              <div className="md:hidden space-y-8">
                {TRACKING_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.id} className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        isActive ? `${step.color} text-white shadow-lg` : 'bg-muted/30 text-muted-foreground'
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-headline font-black transition-colors", isActive ? 'text-foreground' : 'text-muted-foreground')}>
                          {step.label}
                        </p>
                        {isCurrent && <p className="text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse">Your current status</p>}
                      </div>
                      {idx < currentStepIndex && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Breakdown & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items & Summary */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2.5rem] border shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-muted/20 p-8 border-b">
                <CardTitle className="text-xl font-headline font-black flex items-center gap-3">
                  <Package className="w-6 h-6 text-primary" /> Order Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center overflow-hidden">
                          <img src={item.imageURL || `https://picsum.photos/seed/${item.dishId}/400/400`} alt={item.foodName} className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{item.foodName}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-black text-primary">₹{item.subtotal}</p>
                    </div>
                  ))}
                </div>
                
                <Separator className="border-dashed" />
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Items Total</span>
                    <span>₹{order.totalAmount - 54}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Delivery & Surcharge</span>
                    <span className="text-green-600">₹54</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-lg font-headline font-black">Grand Total</span>
                    <span className="text-3xl font-headline font-black text-primary">₹{order.totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-accent/5 p-8 rounded-[2.5rem] border border-accent/10 flex items-start gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <div className="space-y-1">
                <p className="font-headline font-black text-accent uppercase tracking-widest text-xs">Hygiene Check</p>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Your food is being prepared in a sanitized environment with frequent temperature checks.
                </p>
              </div>
            </div>
          </div>

          {/* Logistics & Payment */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-muted/20 p-8 border-b">
                <CardTitle className="text-lg font-headline font-black flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" /> Delivery Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Customer</p>
                  <p className="font-bold text-foreground text-sm">{order.deliveryDetails?.name || user?.displayName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Contact</p>
                  <p className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Phone className="w-3 h-3 text-muted-foreground" /> {order.deliveryDetails?.phone || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Destination</p>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                    "{order.deliveryDetails?.address || 'Address not available'}"
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-muted/20 p-8 border-b">
                <CardTitle className="text-lg font-headline font-black flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" /> Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Method</span>
                  <Badge variant="outline" className="font-black text-[10px] uppercase">{order.paymentMethod}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Status</span>
                  <Badge className={cn(
                    "font-black text-[10px] uppercase border-none",
                    order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  )}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="pt-4 flex items-center justify-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Transaction</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
