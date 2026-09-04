import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, EASE, DUR, STAGGER, skipAnimation } from '@/lib/motion'

interface Props {
  children: ReactNode
  className?: string
  /** re-run the reveal when these change (e.g. data loaded) */
  deps?: unknown[]
}

/**
 * Staggered entrance for its DIRECT children (MASTER.md motion).
 * from { opacity:0, y:16 } -> stagger power3.out. Respects reduced-motion.
 */
export function Reveal({ children, className, deps = [] }: Props) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (skipAnimation()) return
      const el = scope.current
      if (!el || !el.children.length) return
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: DUR.base,
          ease: EASE.out,
          stagger: STAGGER,
          clearProps: 'transform',
        }
      )
    },
    { scope, dependencies: deps }
  )

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}
