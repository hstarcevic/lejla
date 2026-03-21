import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'
import { logger } from './utils/logger'

// Register service worker — auto-updates when new version is available
registerSW({
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Check for updates every 30 minutes
      setInterval(() => { registration.update() }, 30 * 60 * 1000)
    }
    logger.info('sw.registered', 'Service worker registered', { swUrl })
  },
  onOfflineReady() {
    logger.info('sw.offline', 'App ready to work offline')
  },
})

window.addEventListener('error', (event) => {
  logger.error('global.error', event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('global.unhandledrejection', String(event.reason), {
    type: typeof event.reason,
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
