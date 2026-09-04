import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

// register GSAP React hook once
gsap.registerPlugin(useGSAP)

// motion tokens (MASTER.md §6)
export const EASE = {
  out: 'power3.out',
  pop: 'back.out(1.4)',
  popBig: 'back.out(1.7)',
  inOut: 'power2.inOut',
} as const

export const DUR = {
  fast: 0.2,
  base: 0.35,
  slow: 0.5,
} as const

export const STAGGER = 0.045

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * True when we should NOT animate: user prefers reduced motion, OR the tab is
 * hidden at mount (rAF is throttled so a from/fromTo tween would freeze the
 * element invisible mid-flight). In both cases show content immediately.
 */
export function skipAnimation(): boolean {
  return (
    prefersReducedMotion() ||
    (typeof document !== 'undefined' && document.hidden)
  )
}

export { gsap, useGSAP }
