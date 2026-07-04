'use client';

import { useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt degrees (default 8) */
  max?: number;
  /** Shadow intensity multiplier (default 1) */
  shadowIntensity?: number;
}

/**
 * 3D tilt card — tracks mouse on desktop, uses perspective entrance on mobile.
 * Never uses useState for pointer tracking (uses motion values, no React re-renders).
 */
export function TiltCard({ children, className, max = 8, shadowIntensity = 1 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = { stiffness: 350, damping: 28, mass: 0.8 };
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-max, max]), springConfig);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [max, -max]), springConfig);
  const glowX   = useTransform(rawX, [-0.5, 0.5], [0, 100]);
  const glowY   = useTransform(rawY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || shouldReduce) return;
    const rect = ref.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {/* Dynamic glare overlay — follows cursor */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) =>
              `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.07) 0%, transparent 60%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}
