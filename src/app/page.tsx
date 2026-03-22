"use client"

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroBackground from '@/components/HeroBackground';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden selection:bg-primary selection:text-white bg-[#FDFCFB]">
      <HeroBackground />
      
      {/* Top Notification */}
      <div className="absolute top-6 left-0 w-full flex justify-center z-50 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/40 backdrop-blur-md rounded-full border border-black/5 shadow-sm animate-float-slow">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-[11px] font-bold text-foreground/80 tracking-tight">New: Premium Thalis Available!</span>
        </div>
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-primary rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <span className="font-headline text-xl font-black tracking-tight text-[#3D2B1F]">Bhartiya Swad</span>
        </div>
        
        <nav className="flex gap-10 items-center">
          <Link href="/menu">
            <span className="text-sm font-black text-primary hover:opacity-80 transition-opacity cursor-pointer">Explore Menu</span>
          </Link>
          <Link href="/login">
            <span className="text-sm font-black text-[#3D2B1F]/70 hover:text-primary transition-colors cursor-pointer">Login</span>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_10px_30px_rgba(229,92,10,0.3)] font-black px-8 rounded-2xl h-12 transition-all hover:scale-105">
              Sign Up
            </Button>
          </Link>
        </nav>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <h1 className="text-7xl md:text-[9rem] font-headline font-black text-[#3D2B1F] leading-[0.85] tracking-tighter">
            Taste of <span className="text-primary italic">India</span> at<br />
            Your <span className="relative">
              Doorstep
              <div className="absolute -bottom-4 left-0 w-full h-[12px] bg-accent/90 rounded-full" />
            </span>
          </h1>
          
          <p className="text-xl md:text-3xl text-[#3D2B1F]/60 max-w-3xl mx-auto leading-relaxed font-medium pt-4">
            Bhartiya Swad brings you the most authentic flavors from<br className="hidden md:block" /> 
            the streets of Mumbai to the heart of Delhi. Authentic,<br className="hidden md:block" /> 
            Fresh, and Delivered Fast.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-20 px-14 text-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(229,92,10,0.35)] bg-primary hover:bg-primary/90 group font-black transition-all hover:scale-105 active:scale-95 text-white">
                Start Your Order 
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </Link>
            <Link href="/menu" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-20 px-14 text-xl rounded-[2.5rem] border-none bg-white shadow-xl shadow-black/5 font-black hover:bg-white/80 transition-all hover:scale-105 active:scale-95 text-[#3D2B1F]">
                View Menu
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full p-12 flex flex-col items-center gap-4">
        <p className="text-[11px] text-[#3D2B1F]/30 font-black uppercase tracking-[0.5em]">
          © 2025 Bhartiya Swad. Pure Indian Taste.
        </p>
      </footer>

      {/* Decorative Icon */}
      <div className="fixed bottom-8 left-8 z-50">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-2xl group cursor-pointer transition-transform hover:scale-110">
          <span className="text-white font-headline font-black text-lg">N</span>
        </div>
      </div>
    </div>
  );
}
