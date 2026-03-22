"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn("WebGL not supported, falling back to static background.");
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFDFCFB); // Clean solid off-white
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        alpha: false, 
        antialias: true,
        powerPreference: "high-performance"
      });
    } catch (e) {
      return;
    }
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Soft Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Clay Palette
    const palette = {
      yellow: 0xE9C46A,    // Soft Yellow
      peach: 0xF4A261,     // Peach
      terracotta: 0xE2725B // Terracotta
    };

    const createClayMaterial = (color: number) => {
      return new THREE.MeshPhysicalMaterial({ 
        color: color,
        roughness: 1,      // Full matte clay texture
        metalness: 0,
        reflectivity: 0,
        clearcoat: 0,
      });
    };

    const geometries = [
      new THREE.TorusGeometry(1, 0.35, 16, 100),
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.BoxGeometry(1.5, 1, 0.8) // Rectangular Prism
    ];

    const colors = [palette.yellow, palette.peach, palette.terracotta];
    const items: THREE.Mesh[] = [];

    // Distribution: Strictly at edges and corners (outer 40% of view)
    const itemCount = 12;
    for (let i = 0; i < itemCount; i++) {
      const geo = geometries[i % geometries.length];
      const color = colors[i % colors.length];
      const mesh = new THREE.Mesh(geo, createClayMaterial(color));
      
      // Calculate edge positions
      const side = Math.random() > 0.5 ? 1 : -1;
      const vertical = Math.random() > 0.5 ? 1 : -1;
      
      // Push to corners/edges (X: 12-18 range, Y: 8-12 range)
      const x = side * (12 + Math.random() * 6);
      const y = vertical * (8 + Math.random() * 4);
      const z = (Math.random() - 0.5) * 5;

      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.scale.setScalar(Math.random() * 0.4 + 0.7);
      
      scene.add(mesh);
      items.push(mesh);
    }

    camera.position.z = 15;

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.0002;
      items.forEach((item, i) => {
        item.rotation.x += 0.002;
        item.rotation.y += 0.001;
        // Subtle edge-floating drift
        item.position.y += Math.sin(time + i) * 0.002;
        item.position.x += Math.cos(time * 0.5 + i) * 0.001;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none bg-[#FDFCFB]" />;
}
