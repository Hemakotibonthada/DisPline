import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './app.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the service worker for offline / installable PWA (production only,
// so it never caches stale modules during development).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed', err);
    });
  });
}
