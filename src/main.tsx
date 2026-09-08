import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { DialogProvider } from '@/contexts/DialogContext'
import { AuthProvider } from '@/contexts/AuthContext'
import App from '@/App'
import '@/styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <DialogProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </DialogProvider>
    </SettingsProvider>
  </React.StrictMode>
)
