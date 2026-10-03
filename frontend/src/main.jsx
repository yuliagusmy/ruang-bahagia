import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useThemeStore } from './stores/themeStore.js'

// Standarisasi domain www ke non-www agar sesi login & localStorage selalu sinkron
if (window.location.hostname === 'www.ruangbahagia.web.id') {
  window.location.replace(`https://ruangbahagia.web.id${window.location.pathname}${window.location.search}${window.location.hash}`)
}

// Terapkan tema tersimpan ke DOM sebelum render (cegah flash of wrong theme)
useThemeStore.getState().initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
