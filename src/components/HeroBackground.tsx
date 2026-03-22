"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-[#FDFCFB]" />
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

  const layers = [
    {
      id: 'bg-blobs',
      factor: 0.15,
      elements: [
        { color: 'bg-primary/5', size: 'w-[600px] h-[600px]', pos: 'top-[-15%] left-[-10%]' },
        { color: 'bg-accent/5', size: 'w-[500px] h-[500px]', pos: 'bottom-[-10%] right-[-5%]' },
      ],
      blur: 'blur-3xl'
    },
    {
      id: 'mid-blobs',
      factor: 0.4,
      elements: [
        { color: 'bg-primary/5', size: 'w-[350px] h-[350px]', pos: 'top-[25%] right-[8%]' },
        { color: 'bg-accent/5', size: 'w-[300px] h-[300px]', pos: 'bottom-[20%] left-[10%]' },
      ],
      blur: 'blur-2xl'
    }
  ];

  const foodItems = [
    { id: 1, pos: 'top-[15%] left-[8%]', size: 'w-36 h-36', animation: 'animate-float-premium', factor: 0.8, imgId: 'hero-pizza' },
    { id: 2, pos: 'bottom-[15%] left-[12%]', size: 'w-44 h-44', animation: 'animate-float-slow', factor: 0.6, imgId: 'hero-dosa', delay: '1.5s' },
    { id: 3, pos: 'top-[20%] right-[10%]', size: 'w-32 h-32', animation: 'animate-float-premium', factor: 0.9, imgId: 'hero-burger', delay: '0.5s' },
    { id: 4, pos: 'bottom-[25%] right-[15%]', size: 'w-48 h-44', animation: 'animate-float-slow', factor: 0.5, imgId: 'hero-thali', delay: '2s' },
    { id: 5, pos: 'top-[50%] left-[4%]', size: 'w-28 h-28', animation: 'animate-float-premium', factor: 1.1, imgId: 'hero-samosa', delay: '3s' },
    { id: 6, pos: 'top-[65%] right-[5%]', size: 'w-32 h-32', animation: 'animate-float-slow', factor: 0.7, imgId: 'cat-fast-food', delay: '4s' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#FDFCFB]">
      <ThreeBackground />
      
      {/* Background Gradient Layers */}
      {layers.map((layer) => (
        <div 
          key={layer.id}
          className="absolute inset-0 preserve-3d transition-transform duration-1000 ease-out"
          style={{ 
            transform: `translate3d(${mousePos.x * layer.factor}px, ${mousePos.y * layer.factor}px, 0)`,
            willChange: 'transform'
          }}
        >
          {layer.elements.map((el, idx) => (
            <div 
              key={idx} 
              className={`absolute ${el.pos} ${layer.blur} opacity-40 transition-all duration-1000`}
            >
              <div className={`${el.size} ${el.color} rounded-full animate-pulse-glow`} />
            </div>
          ))}
        </div>
      ))}

      {/* Floating Food Elements Layer */}
      <div 
        className="absolute inset-0 preserve-3d transition-transform duration-700 ease-out"
        style={{ 
          transform: `translate3d(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px, 0)`,
          willChange: 'transform'
        }}
      >
        {foodItems.map((item) => {
          const imageData = PlaceHolderImages.find(img => img.id === item.imgId);
          if (!imageData) return null;

          return (
            <div 
              key={item.id}
              className={`absolute ${item.pos} ${item.animation} opacity-60 mix-blend-multiply transition-all duration-1000`}
              style={{ 
                animationDelay: (item as any).delay || '0s',
                transform: `translate3d(${mousePos.x * item.factor}px, ${mousePos.y * item.factor}px, 0)`
              }}
            >
              <div className={`${item.size} relative rounded-full overflow-hidden shadow-2xl border-4 border-white/20`}>
                <Image 
                  src={imageData.imageUrl}
                  alt={imageData.description}
                  fill
                  className="object-cover scale-110"
                  data-ai-hint={imageData.imageHint}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FDFCFB]/30 z-0" />
    </div>
  );
}