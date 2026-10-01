import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useThemeStore } from './stores/themeStore.js'

// Terapkan tema tersimpan ke DOM sebelum render (cegah flash of wrong theme)
useThemeStore.getState().initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
