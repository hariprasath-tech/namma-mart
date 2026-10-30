import { useEffect, useState } from 'react';

export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  spring: { type: 'spring', stiffness: 380, damping: 28 } as const,
};

export const dur = {
  fast: 0.15,
  base: 0.28,
  slow: 0.5,
};

/**
 * Hook to respect user's prefers-reduced-motion OS/browser setting
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * Standard motion variants respecting reduced motion
 */
export const fadeInUp = (reduced = false) => ({
  initial: reduced ? { opacity: 1 } : { opacity: 0, y: 12 },
  animate: reduced ? { opacity: 1 } : { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: reduced ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: dur.fast } },
});

export const scaleIn = (reduced = false) => ({
  initial: reduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 },
  animate: reduced ? { opacity: 1 } : { opacity: 1, scale: 1, transition: { duration: dur.base, ease: ease.out } },
  exit: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, transition: { duration: dur.fast } },
});

export const slideInRight = (reduced = false) => ({
  initial: reduced ? { opacity: 1 } : { opacity: 0, x: 20 },
  animate: reduced ? { opacity: 1 } : { opacity: 1, x: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: reduced ? { opacity: 0 } : { opacity: 0, x: -16, transition: { duration: dur.fast } },
});
