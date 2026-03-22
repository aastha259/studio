"use client"

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChefHat, Truck, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroBackground from '@/components/HeroBackground';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden selection:bg-primary selection:text-white">
      <HeroBackground />
      
      <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight">Bhartiya Swad</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/menu">
            <Button variant="ghost" className="font-bold text-primary hover:bg-primary/5 rounded-full px-6">Explore Menu</Button>
          </Link>
          <div className="hidden sm:flex h-8 w-[1px] bg-border/50 mx-2" />
          <Link href="/login">
            <Button variant="ghost" className="font-medium hover:text-primary transition-colors">Login</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold px-8 rounded-full h-11">Sign Up</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 text-center max-w-5xl px-6 py-20">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/40 backdrop-blur-md rounded-full border border-white/20 mb-10 shadow-sm animate-bounce hover:bg-white/60 transition-colors cursor-default">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm font-black uppercase tracking-widest text-primary/80">New: Premium Thalis Available!</span>
        </div>
        
        <h1 className="text-6xl md:text-9xl font-headline font-black mb-8 leading-[0.95] tracking-tighter text-foreground">
          Taste of <span className="text-primary italic relative">India <div className="absolute -bottom-2 left-0 w-full h-2 bg-primary/10 rounded-full blur-sm -z-10" /></span><br/>
          at Your <span className="text-accent underline decoration-8 underline-offset-[12px] decoration-accent/20">Doorstep</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
          Experience authentic flavors from the streets of Mumbai to the heart of Delhi. Curated with love, delivered with precision.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/login">
            <Button size="lg" className="h-20 px-12 text-xl rounded-full shadow-[0_20px_50px_rgba(229,92,10,0.3)] bg-primary hover:bg-primary/90 group font-black transition-all hover:scale-105 active:scale-95">
              Start Your Order 
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
          <Link href="/menu">
            <Button size="lg" variant="outline" className="h-20 px-12 text-xl rounded-full backdrop-blur-md border-2 border-primary/20 font-black hover:bg-white hover:text-primary transition-all hover:scale-105 active:scale-95 shadow-lg">
              View Menu
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-32 max-w-4xl mx-auto">
          {[
            { icon: ChefHat, label: "Top Chefs", sub: "Master artisans" },
            { icon: Truck, label: "Fast Delivery", sub: "Under 30 mins" },
            { icon: Clock, label: "24/7 Service", sub: "Day or night" },
            { icon: Heart, label: "Fresh Food", sub: "Farm to table" }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center gap-3 group cursor-default">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-primary/5 flex items-center justify-center group-hover:-translate-y-3 transition-all duration-500 border border-border/50 group-hover:border-primary/20 group-hover:bg-primary/5">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-sm uppercase tracking-wider">{feature.label}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{feature.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <div className="px-6 py-2 bg-white/20 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl flex items-center gap-6">
          <p className="text-[10px] text-foreground/40 font-black uppercase tracking-[0.3em]">
            © 2025 Bhartiya Swad. Pure Indian Taste.
          </p>
          <div className="h-4 w-[1px] bg-foreground/10" />
          <div className="flex gap-4">
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: '1s' }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </footer>
    </div>
  );
}