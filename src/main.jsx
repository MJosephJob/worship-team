import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/globals.css'

// vite-plugin-pwa (registerType: 'autoUpdate') activates a new service worker
// as soon as it's found, but an already-open tab keeps running its old,
// already-loaded JS bundle until something reloads it — on iOS standalone,
// where tabs live for days, that stale bundle (with a stale baked-in API URL)
// is what produces persistent "Network error 404" toasts after a redeploy.
// Reload once when a new worker takes control, and actively check for
// updates whenever the app is foregrounded rather than waiting for the
// browser's own periodic check.
if ('serviceWorker' in navigator) {
  let refreshedOnce = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshedOnce) return
    refreshedOnce = true
    window.location.reload()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then(reg => reg?.update()).catch(() => {})
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <AuthProvider>
            <NotificationProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </NotificationProvider>
          </AuthProvider>
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
