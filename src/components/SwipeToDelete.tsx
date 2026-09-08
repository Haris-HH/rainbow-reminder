import { useRef, useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  onDelete: () => void
  label: string
  children: ReactNode
}

const ACTION_W = 120

/**
 * ปัดซ้ายเพื่อเผยปุ่มลบ (touch + mouse). ปล่อยให้ scroll แนวตั้งทำงานปกติ
 * และกัน click ทะลุไปยัง content เมื่อเพิ่งลาก
 */
export function SwipeToDelete({ onDelete, label, children }: Props) {
  const [tx, setTx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const base = useRef(0)
  const mode = useRef<'idle' | 'h' | 'v'>('idle')
  const moved = useRef(false)

  function down(e: React.PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    startX.current = e.clientX
    startY.current = e.clientY
    base.current = tx
    mode.current = 'idle'
    moved.current = false
  }

  function move(e: React.PointerEvent) {
    if (mode.current === 'v') return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (mode.current === 'idle') {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      // แนวตั้ง = ปล่อยให้ scroll ; แนวนอน = เริ่ม swipe
      mode.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (mode.current === 'v') return
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      setDragging(true)
    }
    moved.current = true
    setTx(Math.max(-ACTION_W + 24, Math.min(0, base.current + dx)))
  }

  function up() {
    if (mode.current === 'h') {
      setTx((cur) => (cur < (-ACTION_W  + 24) / 2 ? (-ACTION_W + 24) : 0))
    }
    mode.current = 'idle'
    setDragging(false)
  }

  function onClickCapture(e: React.MouseEvent) {
    // เพิ่งลาก → กัน click ทะลุไป row / ปุ่ม ข้างใน
    if (moved.current) {
      e.stopPropagation()
      e.preventDefault()
      moved.current = false
    }
  }

  const actionOpacity = Math.min(1, -tx / (ACTION_W * 0.55))

  return (
    <div className="swipe-wrap">
      <button
        type="button"
        className="swipe-action"
        style={{ width: ACTION_W, opacity: actionOpacity }}
        onClick={() => {
          setTx(0)
          onDelete()
        }}
        aria-label={label}
        tabIndex={tx < 0 ? 0 : -1}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginLeft: 15 }}>
          <Trash2 size={18} aria-hidden />
          <span>{label}</span>
        </div>
      </button>
      <div
        className="swipe-front"
        style={{
          transform: `translateX(${tx}px)`,
          transition: dragging ? 'none' : 'transform 0.22s ease',
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  )
}
