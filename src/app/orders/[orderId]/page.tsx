
"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

import {
  ChefHat,
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Utensils,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useAuth } from "@/lib/contexts/auth-context"
import { cn, computeOrderStatus, STATUS_LABELS } from "@/lib/utils"

const TRACKING_STEPS = [
  { id: "placed", label: "Order Placed", icon: Clock, color: "bg-blue-500" },
  { id: "preparing", label: "Preparing Food", icon: Utensils, color: "bg-orange-500" },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck, color: "bg-indigo-500" },
  { id: "delivered", label: "Delivered", icon: CheckCircle2, color: "bg-green-500" }
]

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = params?.orderId as string

  const db = useFirestore()
  const { user, loading: authLoading } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const orderRef = useMemoFirebase(() => {
    if (!orderId) return null
    return doc(db, "orders", orderId)
  }, [db, orderId])

  const { data: order, isLoading: orderLoading, error } = useDoc(orderRef)

  const displayOrderId = order?.orderId || orderId || "Unknown"
  const totalAmount = order?.totalAmount ?? 0
  
  const statusKey = useMemo(() => {
    return computeOrderStatus(order?.createdAt);
  }, [order?.createdAt, currentTime])

  const currentStepIndex = useMemo(() => {
    return TRACKING_STEPS.findIndex(step => step.id === statusKey)
  }, [statusKey])

  if (authLoading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="font-headline font-bold text-muted-foreground">Connecting to tracking stream...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#FDFCFB]">
        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-headline font-black mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't locate the details for this order reference.</p>
        <Link href="/dashboard">
          <Button className="rounded-2xl h-12 px-8 font-bold bg-primary">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  if (order.userId !== user?.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] font-headline font-bold text-xl">
        Unauthorized Access
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-black hidden md:block">Bhartiya Swad</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="font-bold gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-5xl font-headline font-black tracking-tight">Track Your Meal</h1>
            <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[10px] font-black">
              Order ID: #{String(displayOrderId).slice(0, 16).toUpperCase()}
            </p>
          </div>
          <Badge className={cn(
            "rounded-full px-6 py-2 font-black text-sm uppercase border-none shadow-sm",
            TRACKING_STEPS[currentStepIndex]?.color || "bg-primary",
            "text-white"
          )}>
            {STATUS_LABELS[statusKey]}
          </Badge>
        </div>

        <Card className="border shadow-xl rounded-[3rem] overflow-hidden bg-white">
          <CardContent className="p-10 md:p-16">
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 hidden md:block" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 hidden md:block transition-all duration-1000" 
                style={{ width: `${(currentStepIndex / (TRACKING_STEPS.length - 1)) * 100}%` }}
              />

              {TRACKING_STEPS.map((step, index) => {
                const Icon = step.icon
                const isCompleted = index < currentStepIndex
                const isActive = index === currentStepIndex

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group w-full md:w-auto">
                    <div
                      className={cn(
                        "w-20 h-20 flex items-center justify-center rounded-[2rem] transition-all duration-500 border-4",
                        isCompleted ? "bg-green-500 border-green-100 text-white shadow-lg shadow-green-200" :
                        isActive ? `${step.color} border-white text-white shadow-2xl scale-110 ring-4 ring-primary/10` :
                        "bg-white border-muted text-muted-foreground grayscale opacity-40"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                    </div>
                    <div className="mt-6 text-center">
                      <p className={cn(
                        "font-headline font-black text-sm uppercase tracking-wider",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </p>
                      {isActive && <p className="text-[10px] text-primary font-black mt-1 animate-pulse">LIVE UPDATING</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 bg-muted/20 border-b">
              <CardTitle className="text-xl font-headline font-black">Order Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center group hover:bg-muted/5 p-2 rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border shadow-sm">
                        <img
                          src={item.imageURL || `https://picsum.photos/seed/${index}/200`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          alt={item.name}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight">{item.name}</p>
                        <p className="text-sm text-muted-foreground font-black uppercase tracking-widest mt-1">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-headline font-black text-xl text-primary">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-8 border-dashed" />
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Collection</p>
                  <p className="text-xs text-muted-foreground italic">Inclusive of taxes and delivery partner fees</p>
                </div>
                <p className="text-4xl font-headline font-black text-primary">₹{totalAmount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm rounded-[2.5rem] bg-white overflow-hidden h-fit">
            <CardHeader className="p-8 bg-primary text-white border-b">
              <CardTitle className="text-xl font-headline font-black">Support Info</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Delivery Partner</p>
                    <p className="font-bold text-foreground">Assigned & Navigating</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Est. Delivery</p>
                    <p className="font-bold text-foreground">25-35 Minutes</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl shadow-black/10">
                <p className="text-xs text-slate-100 font-bold leading-relaxed italic text-center">
                  "Your meal is being tracked in real-time using our standardized audit stream."
                </p>
              </div>
              
              <Button variant="outline" className="w-full h-12 rounded-2xl font-black border-primary text-primary hover:bg-primary hover:text-white transition-all">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
