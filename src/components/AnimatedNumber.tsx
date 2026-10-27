import React, { useState, useEffect, useRef } from 'react';

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: (val: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Spring-Physics / Smooth Odometer Animated Number Component.
 * Smoothly rolls up numbers when values, classes, or sliders change.
 * Minimal, lightweight, fluid, and respects user motion preferences.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals,
  prefix = '',
  suffix = '',
  duration = 380,
  format,
  className,
  style
}) => {
  // Infer decimal places if not explicitly provided
  const resolvedDecimals = decimals !== undefined
    ? decimals
    : Number.isInteger(value)
      ? 0
      : (value.toString().split('.')[1]?.length ?? 1);

  const [displayValue, setDisplayValue] = useState<number>(value);
  const currentValRef = useRef<number>(value);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // If browser prefers reduced motion, skip animation
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(value);
      currentValRef.current = value;
      return;
    }

    const startValue = currentValRef.current;
    const targetValue = value;
    const delta = targetValue - startValue;

    // If change is negligible, update directly
    if (Math.abs(delta) < 0.0001) {
      setDisplayValue(targetValue);
      currentValRef.current = targetValue;
      return;
    }

    const startTime = performance.now();

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth cubic-out easing (fluid spring deceleration)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValue + delta * ease;

      currentValRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        currentValRef.current = targetValue;
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [value, duration]);

  const formattedOutput = format
    ? format(displayValue)
    : `${prefix}${displayValue.toFixed(resolvedDecimals)}${suffix}`;

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        transition: 'color 0.15s ease',
        ...style
      }}
    >
      {formattedOutput}
    </span>
  );
};
