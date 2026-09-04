import { useRef } from 'react'
import { Plus } from 'lucide-react'
import { gsap, useGSAP, EASE, skipAnimation } from '@/lib/motion'

interface Props {
  onClick: () => void
  label?: string
  children?: React.ReactNode
}

/** Floating action button with a GSAP pop-in (back.out). */
export function Fab({
  onClick,
  label = 'add',
  children = <Plus size={28} strokeWidth={2.5} />,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)

  useGSAP(
    () => {
      if (skipAnimation()) return
      gsap.fromTo(
        ref.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.45,
          ease: EASE.popBig,
          delay: 0.15,
          clearProps: 'scale',
        }
      )
    },
    { scope: ref }
  )

  return (
    <button ref={ref} className="fab" onClick={onClick} aria-label={label}>
      {children}
    </button>
  )
}
