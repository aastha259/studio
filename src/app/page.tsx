"use client"

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChefHat, Truck, Clock, Heart } from 'lucide-react';
import ThreeBackground from '@/components/ThreeBackground';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden selection:bg-primary selection:text-white">
      <ThreeBackground />
      
      <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight">Bhartiya Swad</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium">Login</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">Sign Up</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 text-center max-w-4xl px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 animate-bounce">
          <span className="w-2 h-2 bg-primary rounded-full" />
          <span className="text-sm font-medium">New: Premium Thalis Available!</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-headline font-black mb-6 leading-tight tracking-tight">
          Taste of <span className="text-primary italic">India</span> at Your <span className="text-accent underline decoration-4 underline-offset-8">Doorstep</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Bhartiya Swad brings you the most authentic flavors from the streets of Mumbai to the heart of Delhi. Authentic, Fresh, and Delivered Fast.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/login">
            <Button size="lg" className="h-16 px-10 text-lg rounded-full shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 group">
              Order Now 
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-full backdrop-blur-sm border-2">
            View Menu
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24">
          {[
            { icon: ChefHat, label: "Top Chefs" },
            { icon: Truck, label: "Fast Delivery" },
            { icon: Clock, label: "24/7 Service" },
            { icon: Heart, label: "Fresh Food" }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-sm">{feature.label}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-6 text-sm text-muted-foreground/60 font-medium">
        © 2025 Bhartiya Swad. Made with ❤️ for Indian Food Lovers.
      </footer>
    </div>
  );
}