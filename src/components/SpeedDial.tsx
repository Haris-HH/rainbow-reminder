import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import { gsap, useGSAP, EASE, skipAnimation } from '@/lib/motion'

export interface SpeedDialAction {
  key: string
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}

interface Props {
  actions: SpeedDialAction[]
  mainLabel?: string
}

/** MUI-style Speed Dial: FAB that fans out into labeled action buttons. */
export function SpeedDial({ actions, mainLabel = 'menu' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  // pop-in on mount, same feel as the plain Fab
  useGSAP(
    () => {
      if (skipAnimation()) return
      gsap.fromTo(
        fabRef.current,
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
    { scope: rootRef }
  )

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function run(action: SpeedDialAction) {
    if (action.disabled) return
    setOpen(false)
    action.onClick()
  }

  return (
    <>
      {open && (
        <div className="speed-dial-backdrop" onClick={() => setOpen(false)} />
      )}
      <div className={`speed-dial${open ? ' open' : ''}`} ref={rootRef}>
        <div className="speed-dial-actions">
          {actions.map((a, i) => (
            <div
              className="speed-dial-item"
              key={a.key}
              style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
            >
              <span className="speed-dial-label">{a.label}</span>
              <button
                type="button"
                className="speed-dial-action-btn"
                disabled={a.disabled}
                onClick={() => run(a)}
                aria-label={a.label}
                tabIndex={open ? 0 : -1}
              >
                {a.icon}
              </button>
            </div>
          ))}
        </div>
        <button
          ref={fabRef}
          type="button"
          className="fab speed-dial-fab"
          onClick={() => setOpen((o) => !o)}
          aria-label={mainLabel}
          aria-expanded={open}
        >
          {open ? <X size={26} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={2.5} />}
        </button>
      </div>
    </>
  )
}
