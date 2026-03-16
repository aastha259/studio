"use client"

import React, { useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useAuth } from "@/lib/contexts/auth-context"
import { cn } from "@/lib/utils"

const TRACKING_STEPS = [
  { id: "Order Placed", label: "Order Placed", icon: Clock, color: "bg-blue-500" },
  { id: "Preparing Food", label: "Preparing Food", icon: Utensils, color: "bg-orange-500" },
  { id: "Out for Delivery", label: "Out for Delivery", icon: Truck, color: "bg-indigo-500" },
  { id: "Delivered", label: "Delivered", icon: CheckCircle2, color: "bg-green-500" }
]

export default function OrderTrackingPage() {

  const params = useParams()
  const orderId = params?.orderId as string

  const db = useFirestore()
  const { user, loading: authLoading } = useAuth()

  const orderRef = useMemoFirebase(() => {
    if (!orderId) return null
    return doc(db, "orders", orderId)
  }, [db, orderId])

  const { data: order, isLoading: orderLoading, error } = useDoc(orderRef)

  const displayOrderId = order?.orderId || orderId || "Unknown"
  const displayTotalPrice = order?.totalPrice ?? 0
  const displayStatus = order?.orderStatus || "Order Placed"

  const currentStepIndex = useMemo(() => {
    return TRACKING_STEPS.findIndex(step => step.id === displayStatus)
  }, [displayStatus])


  if (authLoading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }


  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">

        <Package className="w-10 h-10 text-muted-foreground mb-4" />

        <h1 className="text-2xl font-bold mb-2">
          Order Not Found
        </h1>

        <Link href="/dashboard">
          <Button>
            Return to Dashboard
          </Button>
        </Link>

      </div>
    )
  }


  // Extra security check
  if (order.userId !== user?.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Unauthorized Access
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">

      {/* Header */}

      <nav className="sticky top-0 bg-white border-b px-6 py-4">

        <div className="max-w-7xl mx-auto flex justify-between items-center">

          <Link href="/dashboard" className="flex items-center gap-3">

            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ChefHat className="text-white w-6 h-6" />
            </div>

            <span className="font-bold text-xl hidden md:block">
              Bhartiya Swad
            </span>

          </Link>

          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>

        </div>

      </nav>


      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Title */}

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-4xl font-bold">
              Track Order
            </h1>

            <p className="text-muted-foreground">
              Order ID: #{String(displayOrderId).slice(0,12).toUpperCase()}
            </p>

          </div>

          <Badge>
            {displayStatus}
          </Badge>

        </div>


        {/* Tracking Steps */}

        <Card>

          <CardContent className="p-8">

            <div className="grid grid-cols-4 gap-6 text-center">

              {TRACKING_STEPS.map((step, index) => {

                const Icon = step.icon
                const active = index <= currentStepIndex

                return (

                  <div key={step.id} className="flex flex-col items-center">

                    <div
                      className={cn(
                        "w-14 h-14 flex items-center justify-center rounded-xl",
                        active ? `${step.color} text-white` : "bg-muted"
                      )}
                    >

                      {index < currentStepIndex
                        ? <CheckCircle2 />
                        : <Icon />
                      }

                    </div>

                    <p className="text-sm mt-2 font-medium">
                      {step.label}
                    </p>

                  </div>

                )

              })}

            </div>

          </CardContent>

        </Card>


        {/* Order Items */}

        <Card>

          <CardHeader>
            <CardTitle>Order Breakdown</CardTitle>
          </CardHeader>

          <CardContent>

            <div className="space-y-4">

              {Array.isArray(order.items) &&
                order.items.map((item:any, index:number)=> (

                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >

                    <div className="flex items-center gap-3">

                      <img
                        src={item.imageURL || `https://picsum.photos/seed/${index}/200`}
                        className="w-12 h-12 rounded-lg object-cover"
                        alt={item.foodName}
                      />

                      <div>
                        <p className="font-semibold">
                          {item.foodName}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>

                    </div>

                    <p className="font-bold">
                      ₹{item.subtotal}
                    </p>

                  </div>

                ))}

            </div>

            <Separator className="my-6" />

            <div className="flex justify-between font-bold text-lg">

              <span>Total</span>
              <span>₹{displayTotalPrice}</span>

            </div>

          </CardContent>

        </Card>

      </main>

    </div>
  )

}