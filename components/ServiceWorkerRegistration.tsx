'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Actively purge any legacy poisoned caches (e.g. aptsaas-cache-v1, sylvia-cache-v1)
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name !== 'sylvia-cache-v3') {
              console.log('[PWA] Purging outdated cache:', name);
              caches.delete(name);
            }
          });
        });
      }

      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for service worker updates immediately
            registration.update();
          })
          .catch((err) => {
            console.warn('[PWA] ServiceWorker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
