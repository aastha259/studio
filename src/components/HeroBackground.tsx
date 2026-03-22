"use client"

import React, { useState, useEffect } from 'react';
import { Pizza, Utensils, Coffee, Heart, ShoppingBag, ChefHat } from 'lucide-react';
import dynamic from 'next/dynamic';

const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-[#FDFCFB]" />
});

export default function HeroBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Parallax layers config - Refined for minimalist periphery composition
  const layers = [
    {
      id: 'bg',
      factor: 0.15,
      elements: [
        { type: 'blob', color: 'bg-primary/5', size: 'w-96 h-96', pos: 'top-[-5%] left-[-5%]', animation: 'animate-float-slow' },
        { type: 'blob', color: 'bg-accent/5', size: 'w-[30rem] h-[30rem]', pos: 'bottom-[-10%] right-[-5%]', animation: 'animate-float-premium' },
      ],
      blur: 'blur-3xl'
    },
    {
      id: 'mid',
      factor: 0.4,
      elements: [
        { type: 'icon', icon: ChefHat, color: 'text-primary/5', size: 100, pos: 'top-[10%] left-[10%]', animation: 'animate-scale-soft' },
        { type: 'icon', icon: Heart, color: 'text-accent/5', size: 70, pos: 'bottom-[15%] right-[15%]', animation: 'animate-float-slow' },
      ],
      blur: 'blur-xl'
    },
    {
      id: 'fg',
      factor: 0.8,
      elements: [
        { type: 'icon', icon: Pizza, color: 'text-primary/10', size: 40, pos: 'top-[5%] right-[5%]', animation: 'animate-float-fast' },
        { type: 'icon', icon: Utensils, color: 'text-accent/10', size: 35, pos: 'bottom-[10%] left-[5%]', animation: 'animate-float-premium' },
      ],
      blur: 'blur-sm'
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#FDFCFB] transition-colors duration-500">
      <ThreeBackground />
      
      {layers.map((layer) => (
        <div 
          key={layer.id}
          className="absolute inset-0 preserve-3d transition-transform duration-500 ease-out"
          style={{ 
            transform: `translate3d(${mousePos.x * layer.factor}px, ${mousePos.y * layer.factor}px, 0)`,
            willChange: 'transform'
          }}
        >
          {layer.elements.map((el, idx) => (
            <div 
              key={idx} 
              className={`absolute ${el.pos} ${el.animation} ${layer.blur} transition-all duration-1000`}
            >
              {el.type === 'blob' ? (
                <div className={`${el.size} ${el.color} rounded-full opacity-40 animate-pulse-glow`} />
              ) : el.icon ? (
                <el.icon 
                  size={el.size} 
                  className={`${el.color} drop-shadow-sm`} 
                  style={{ filter: layer.blur === 'blur-sm' ? 'none' : `blur(${layer.factor * 2}px)` }}
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}

      {/* Subtle overlay to ensure maximum readability in the center */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FDFCFB]/20 z-0" />
    </div>
  );
}