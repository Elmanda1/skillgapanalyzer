import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from './context/ToastContext.jsx'
import { SkillProvider } from './context/SkillContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AppLayout from './Layouts/AppLayout.jsx'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.jsx')
    const page = pages[`./Pages/${name}.jsx`]

    // Assign AppLayout as default layout, except for public/auth pages
    return page().then(module => {
      const component = module.default
      if (component.layout === undefined && !['LandingPage', 'LoginPage', 'RegisterPage', 'ForgotPasswordPage'].includes(name)) {
        component.layout = pageComponent => <AppLayout>{pageComponent}</AppLayout>
      }
      return component
    })
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
