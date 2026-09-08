import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, HelpCircle, Info } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'

interface ConfirmOpts {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface State extends ConfirmOpts {
  variant: 'confirm' | 'alert'
  resolve: (v: boolean) => void
}

interface DialogApi {
  confirm: (opts: ConfirmOpts | string) => Promise<boolean>
  alert: (message: string, title?: string) => Promise<void>
}

const DialogContext = createContext<DialogApi | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useSettings()
  const [state, setState] = useState<State | null>(null)

  const confirm = useCallback((opts: ConfirmOpts | string) => {
    const o = typeof opts === 'string' ? { message: opts } : opts
    return new Promise<boolean>((resolve) =>
      setState({ variant: 'confirm', ...o, resolve })
    )
  }, [])

  const alert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) =>
      setState({ variant: 'alert', message, title, resolve: () => resolve() })
    )
  }, [])

  function close(val: boolean) {
    state?.resolve(val)
    setState(null)
  }

  const isConfirm = state?.variant === 'confirm'
  const danger = isConfirm && state?.danger !== false

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {state && (
        <div
          className="modal-backdrop dialog-backdrop"
          onClick={() => close(false)}
        >
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`dialog-icon ${danger ? 'danger' : 'info'}`}>
              {danger ? (
                <AlertTriangle size={28} aria-hidden />
              ) : isConfirm ? (
                <HelpCircle size={28} aria-hidden />
              ) : (
                <Info size={28} aria-hidden />
              )}
            </div>
            {state.title && <h3>{state.title}</h3>}
            <p>{state.message}</p>
            <div className="dialog-actions">
              {isConfirm && (
                <button className="btn btn-ghost" onClick={() => close(false)}>
                  {state.cancelText ?? t('cancel')}
                </button>
              )}
              <button
                className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => close(true)}
                autoFocus
              >
                {state.confirmText ?? t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within DialogProvider')
  return ctx
}
