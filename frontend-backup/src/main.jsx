import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { SkillProvider } from './context/SkillContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <SkillProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SkillProvider>
    </ToastProvider>
  </StrictMode>,
)
