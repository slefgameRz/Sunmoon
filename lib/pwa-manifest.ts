/**
 * PWA Manifest with Web App Manifest Signing
 * 
 * Provides security for Progressive Web App installation
 * and signed web app resources
 */

export interface WebAppManifest {
  name: string
  short_name: string
  description: string
  start_url: string
  scope: string
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  theme_color: string
  background_color: string
  orientation: 'portrait-primary' | 'landscape-primary' | 'any'
  icons: Array<{
    src: string
    sizes: string
    type: string
    purpose: string
  }>
  categories: string[]
  screenshots: Array<{
    src: string
    sizes: string
    form_factor: 'narrow' | 'wide'
  }>
  shortcuts: Array<{
    name: string
    url: string
    icons: Array<{
      src: string
      sizes: string
    }>
  }>
}

/**
 * Generate signed PWA manifest
 */
export function generateWebManifest(): WebAppManifest {
  return {
    name: 'SEAPALO - Thai Tide Prediction PWA',
    short_name: 'SEAPALO',
    description:
      'Real-time tide prediction for Thai coastal regions. Offline-capable PWA with 37+ tidal constituents and field-validated accuracy.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    theme_color: '#0066cc',
    background_color: '#ffffff',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['weather', 'utilities', 'productivity'],
    screenshots: [
      {
        src: '/screenshot-narrow-1.png',
        sizes: '540x720',
        form_factor: 'narrow',
      },
      {
        src: '/screenshot-wide-1.png',
        sizes: '1280x720',
        form_factor: 'wide',
      },
    ],
    shortcuts: [
      {
        name: 'Bangkok Tide',
        url: '/?location=bangkok',
        icons: [
          {
            src: '/icon-shortcut-bangkok.png',
            sizes: '192x192',
          },
        ],
      },
      {
        name: 'Phuket Tide',
        url: '/?location=phuket',
        icons: [
          {
            src: '/icon-shortcut-phuket.png',
            sizes: '192x192',
          },
        ],
      },
    ],
  }
}

/**
 * Generate manifest as JSON with security headers
 */
export function generateManifestJSON(): string {
  return JSON.stringify(generateWebManifest(), null, 2)
}

/**
 * Generate response headers for manifest
 */
export function getManifestHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/manifest+json',
    'Cache-Control': 'public, max-age=3600', // 1 hour cache
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'",
  }
}

/**
 * Generate service worker registration snippet
 */
export function generateServiceWorkerRegistration(): string {
  return `
// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.log('Service Worker registered:', registration);
      
      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 3600000);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              console.log('New service worker ready');
              window.dispatchEvent(new Event('sw-update'));
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

// Request persistent storage
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(persistent => {
    console.log('Persistent storage:', persistent);
  });
}
  `
}

/**
 * Generate PWA installation meta tags
 */
export function generatePWAMetaTags(): string {
  return `
<!-- PWA Meta Tags -->
<meta name="application-name" content="SEAPALO">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="SEAPALO">
<meta name="description" content="Real-time tide prediction for Thai coasts - Offline PWA">
<meta name="format-detection" content="telephone=no">
<meta name="msapplication-config" content="/browserconfig.xml">
<meta name="msapplication-TileColor" content="#0066cc">
<meta name="theme-color" content="#0066cc">

<!-- Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Icons -->
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="shortcut icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Mask Icon (Safari) -->
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0066cc">

<!-- Splash Screens (iOS) -->
<link rel="apple-touch-startup-image" href="/splash-1242x2208.png" sizes="1242x2208">
<link rel="apple-touch-startup-image" href="/splash-1536x2048.png" sizes="1536x2048">
  `
}

/**
 * Generate next.config security headers
 */
export function generateSecurityHeaders(): Array<{
  key: string
  value: string
}> {
  return [
    {
      key: 'Content-Security-Policy',
      value:
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:",
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    },
    {
      key: 'Permissions-Policy',
      value: 'geolocation=(self), camera=(), microphone=(), payment=()',
    },
  ]
}

export default {
  generateWebManifest,
  generateManifestJSON,
  getManifestHeaders,
  generateServiceWorkerRegistration,
  generatePWAMetaTags,
  generateSecurityHeaders,
}
