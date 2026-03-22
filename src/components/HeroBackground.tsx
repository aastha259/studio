"use client"

import React, { useState, useEffect } from 'react';
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

  // Extremely minimalist background layers to frame the content
  const layers = [
    {
      id: 'far',
      factor: 0.15,
      elements: [
        { color: 'bg-primary/5', size: 'w-96 h-96', pos: 'top-[-10%] left-[-5%]' },
        { color: 'bg-accent/5', size: 'w-80 h-80', pos: 'bottom-[-10%] right-[-5%]' },
      ],
      blur: 'blur-3xl'
    },
    {
      id: 'mid',
      factor: 0.4,
      elements: [
        { color: 'bg-primary/5', size: 'w-64 h-64', pos: 'top-[20%] right-[-5%]' },
        { color: 'bg-accent/5', size: 'w-48 h-48', pos: 'bottom-[15%] left-[-5%]' },
      ],
      blur: 'blur-2xl'
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#FDFCFB]">
      <ThreeBackground />
      
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
              className={`absolute ${el.pos} ${layer.blur} opacity-30 transition-all duration-1000`}
            >
              <div className={`${el.size} ${el.color} rounded-full animate-pulse-glow`} />
            </div>
          ))}
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FDFCFB]/40 z-0" />
    </div>
  );
}
