import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from './context/ToastContext.jsx'
import { SkillProvider } from './context/SkillContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AppLayout from './Layouts/AppLayout.jsx'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
    const page = pages[`./Pages/${name}.jsx`]
    
    // Assign AppLayout as default layout, except for public/auth pages
    if (page.default.layout === undefined && !['LandingPage', 'LoginPage', 'RegisterPage'].includes(name)) {
      page.default.layout = pageComponent => <AppLayout>{pageComponent}</AppLayout>
    }
    return page
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ToastProvider>
        <SkillProvider>
          <AuthProvider>
            <App {...props} />
          </AuthProvider>
        </SkillProvider>
      </ToastProvider>
    )
  },
})
