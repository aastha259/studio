"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if WebGL is supported
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported, disabling 3D background effects.');
      return;
    }

    const scene = new THREE.Scene();
    // Clean solid off-white background
    scene.background = new THREE.Color(0xFDFCFB); 
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        alpha: false, 
        antialias: true,
        powerPreference: "high-performance"
      });
    } catch (e) {
      console.warn('Failed to initialize THREE.WebGLRenderer:', e);
      return;
    }
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(-10, -10, 10);
    scene.add(pointLight);

    // Color Palette: Terracotta, Muted Yellow, Soft Peach
    const colors = [
      0xE2725B, // Terracotta
      0xE9C46A, // Muted Yellow
      0xF4A261, // Soft Peach
    ];

    const geometries = [
      new THREE.TorusGeometry(1, 0.35, 16, 100),
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.BoxGeometry(1.4, 0.7, 0.7), // Rectangular Prisms
    ];

    const items: THREE.Mesh[] = [];

    // Composition: Floating elements strictly at edges and corners
    const itemCount = 16;
    for (let i = 0; i < itemCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      
      const material = new THREE.MeshPhysicalMaterial({ 
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.95, // High roughness for matte clay look
        metalness: 0.05,
        transparent: true,
        opacity: 0.6,
        transmission: 0.05,
        thickness: 0.5
      });

      const mesh = new THREE.Mesh(geometry, material);
      
      // Logic to force elements to peripheries
      // We divide the screen into zones and avoid the center 60%
      const side = Math.random() > 0.5 ? 1 : -1;
      const vertical = Math.random() > 0.5 ? 1 : -1;
      
      // Position x: far left or far right
      const x = side * (10 + Math.random() * 8);
      // Position y: upper or lower half, but not too central
      const y = vertical * (6 + Math.random() * 6);
      // Depth
      const z = (Math.random() - 0.5) * 5 - 2;

      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.scale.setScalar(Math.random() * 0.7 + 0.5);
      
      scene.add(mesh);
      items.push(mesh);
    }

    camera.position.z = 15;

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      items.forEach((item, i) => {
        // Subtle, slow movement
        item.rotation.x += 0.0015;
        item.rotation.y += 0.0008;
        item.position.y += Math.sin(Date.now() * 0.0004 + i) * 0.004;
        item.position.x += Math.cos(Date.now() * 0.0002 + i) * 0.002;
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
      geometries.forEach(g => g.dispose());
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none bg-[#FDFCFB]" />;
}