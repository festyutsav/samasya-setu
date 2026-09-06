import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/authStorage'
import './index.css'
import App from './App.jsx'

// Register Service Worker for PWA App installation & offline caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] Service worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
