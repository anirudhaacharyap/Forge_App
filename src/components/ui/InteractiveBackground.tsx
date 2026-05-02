"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate offset based on center of screen
      // Multiplier controls the intensity of the parallax effect
      const x = (e.clientX / window.innerWidth - 0.5) * 30; 
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [shouldReduceMotion]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[var(--color-surface-bg)]">
      {/* The dotted pattern layer */}
      <motion.div
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
        }}
        transition={{ type: "spring", stiffness: 75, damping: 25, mass: 0.5 }}
        className="absolute inset-[-50px] w-[calc(100%+100px)] h-[calc(100%+100px)]"
        style={{
          backgroundImage: "radial-gradient(var(--color-border-dark) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Vignette effect to softly blend the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-surface-bg)_80%)] opacity-70" />
    </div>
  );
}
