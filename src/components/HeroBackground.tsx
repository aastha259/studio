"use client"

import React, { useState, useEffect } from 'react';
import { Pizza, Utensils, Coffee, Heart, ShoppingBag, ChefHat } from 'lucide-react';
import dynamic from 'next/dynamic';

const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-background" />
});

export default function HeroBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Parallax layers config
  const layers = [
    {
      id: 'bg',
      factor: 0.2, // Movement intensity
      elements: [
        { type: 'blob', color: 'bg-primary/10', size: 'w-96 h-96', pos: 'top-[10%] left-[5%]', animation: 'animate-float-slow' },
        { type: 'blob', color: 'bg-accent/10', size: 'w-[30rem] h-[30rem]', pos: 'bottom-[10%] right-[5%]', animation: 'animate-float-premium' },
      ],
      blur: 'blur-3xl'
    },
    {
      id: 'mid',
      factor: 0.5,
      elements: [
        { type: 'blob', color: 'bg-primary/5', size: 'w-64 h-64', pos: 'top-[40%] right-[15%]', animation: 'animate-float-premium' },
        { type: 'icon', icon: ChefHat, color: 'text-primary/10', size: 120, pos: 'top-[20%] left-[20%]', animation: 'animate-scale-soft' },
        { type: 'icon', icon: Heart, color: 'text-accent/10', size: 80, pos: 'bottom-[30%] right-[30%]', animation: 'animate-float-slow' },
      ],
      blur: 'blur-xl'
    },
    {
      id: 'fg',
      factor: 1.2,
      elements: [
        { type: 'icon', icon: Pizza, color: 'text-primary/20', size: 48, pos: 'top-[15%] right-[25%]', animation: 'animate-float-fast' },
        { type: 'icon', icon: Utensils, color: 'text-accent/20', size: 40, pos: 'bottom-[20%] left-[25%]', animation: 'animate-float-premium' },
        { type: 'icon', icon: Coffee, color: 'text-primary/15', size: 56, pos: 'top-[60%] left-[15%]', animation: 'animate-float-fast' },
        { type: 'icon', icon: ShoppingBag, color: 'text-accent/15', size: 44, pos: 'bottom-[45%] right-[10%]', animation: 'animate-float-slow' },
      ],
      blur: 'blur-sm'
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-background transition-colors duration-500">
      <ThreeBackground />
      
      {layers.map((layer) => (
        <div 
          key={layer.id}
          className="absolute inset-0 preserve-3d transition-transform duration-300 ease-out"
          style={{ 
            transform: `translate3d(${mousePos.x * layer.factor}px, ${mousePos.y * layer.factor}px, 0)`,
            willChange: 'transform'
          }}
        >
          {layer.elements.map((el, idx) => (
            <div 
              key={idx} 
              className={`absolute ${el.pos} ${el.animation} ${layer.blur} transition-all duration-700`}
            >
              {el.type === 'blob' ? (
                <div className={`${el.size} ${el.color} rounded-full opacity-60 animate-pulse-glow`} />
              ) : el.icon ? (
                <el.icon 
                  size={el.size} 
                  className={`${el.color} drop-shadow-2xl`} 
                  style={{ filter: layer.blur === 'blur-sm' ? 'none' : `blur(${layer.factor * 4}px)` }}
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}

      {/* Dynamic Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background z-0" />
    </div>
  );
}