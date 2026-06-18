import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Load production console guards early to silence noisy dev logs in production builds
import './utils/disableConsole';

createRoot(document.getElementById("root")!).render(
  // Temporarily disable StrictMode to prevent context initialization issues during development
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/offline-sw.js');
  });
}
