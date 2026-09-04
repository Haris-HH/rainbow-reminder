import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP, EASE, skipAnimation } from '@/lib/motion'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

const isDesktop = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(min-width: 768px)').matches

export function Modal({ open, title, onClose, children }: Props) {
  const [render, setRender] = useState(open)
  const backdrop = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)

  // mount when opened
  useEffect(() => {
    if (open && !render) setRender(true)
  }, [open, render])

  // enter animation
  useGSAP(
    () => {
      if (!render || skipAnimation()) return
      const desktop = isDesktop()
      gsap.fromTo(
        backdrop.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }
      )
      gsap.fromTo(
        sheet.current,
        {
          y: desktop ? 0 : '100%',
          scale: desktop ? 0.95 : 1,
          opacity: desktop ? 0 : 1,
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.42,
          ease: EASE.out,
          clearProps: 'transform',
        }
      )
    },
    { dependencies: [render], scope: backdrop }
  )

  // exit animation when parent sets open=false
  useEffect(() => {
    if (open || !render) return
    if (skipAnimation()) {
      setRender(false)
      return
    }
    const desktop = isDesktop()
    const tl = gsap.timeline({ onComplete: () => setRender(false) })
    tl.to(sheet.current, {
      y: desktop ? 0 : '100%',
      scale: desktop ? 0.95 : 1,
      opacity: desktop ? 0 : 1,
      duration: 0.28,
      ease: 'power2.in',
    }).to(backdrop.current, { opacity: 0, duration: 0.2 }, '<')
    return () => {
      tl.kill()
    }
  }, [open, render])

  // escape key
  useEffect(() => {
    if (!render) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [render, onClose])

  if (!render) return null

  return (
    <div className="modal-backdrop" ref={backdrop} onClick={onClose}>
      <div className="modal" ref={sheet} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}
