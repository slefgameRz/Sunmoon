# SEAPALO Developer's Guide

## Project Overview

**SEAPALO** (Smart Early-Alert Predictive Analysis for Local Oceans) is a production-grade Progressive Web App for Thai tide prediction with offline capability, sub-meter accuracy, and PDPA compliance.

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS + Radix UI
- **Package Manager**: pnpm

### Backend Services
- **API**: Next.js API Routes (serverless)
- **Database**: Optional (phase 6+)
- **Cache**: Browser IndexedDB + Service Worker

### External APIs
- **Weather**: OpenWeatherMap (real-time)
- **Tides**: Stormglass (extremes + validation)
- **Astronomy**: astronomy-engine (lunar calculations)
- **Tidal Model**: FES2022 (optional, phase 2+)

### DevOps
- **Hosting**: Vercel (or custom)
- **Version Control**: Git
- **CDN**: Cloudflare (recommended)
- **Monitoring**: Sentry (optional)

## Project Structure

```
seapalo/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Radix UI components
│   ├── tide-animation.tsx
│   ├── location-selector.tsx
│   ├── confidence-indicator.tsx
│   ├── offline-indicator.tsx
│   ├── tide-graph-advanced.tsx
│   └── field-testing-dashboard.tsx
├── pages/                # Next.js pages/API
│   └── api/             # API routes
│       ├── predict.ts   # Prediction endpoint
│       ├── status.ts    # Status endpoint
│       └── tiles/       # Tile endpoints
├── lib/                 # Utility libraries
│   ├── constituents.ts                   # 37 tidal constituents
│   ├── harmonic-engine.ts               # Harmonic synthesis
│   ├── tide-service.ts                  # Tide service integration
│   ├── tile-manager.ts                  # Tile caching
│   ├── tide-prediction-api.ts           # Unified API
│   ├── worldtides-client.ts            # WorldTides integration
│   ├── fes2022-generator.ts            # Tile generation
│   ├── performance-profiler.ts         # Metrics collection
│   ├── device-optimizer.ts             # Device profiling
│   ├── query-cache.ts                  # Query caching
│   ├── field-validation.ts             # Field testing
│   ├── security-manager.ts             # PDPA compliance
│   ├── pwa-manifest.ts                 # PWA manifest
│   └── utils.ts                        # Utilities
├── hooks/               # React hooks
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   └── use-performance-monitoring.ts
├── public/              # Static files
│   ├── manifest.json   # PWA manifest
│   └── service-worker.js  # Service Worker
├── styles/             # CSS
├── pages/              # API routes
│   └── api/
├── .env.local         # Local env variables
├── next.config.mjs    # Next.js config
├── tsconfig.json      # TypeScript config
└── package.json       # Dependencies

```

## Setup & Installation

### Prerequisites
- Node.js 18+
- pnpm 8+
- Git

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/seapalo/seapalo.git
cd seapalo

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env.local
# Edit with your API keys

# 4. Run development server
pnpm dev

# 5. Visit http://localhost:3000
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_OPENWEATHER_API_KEY=xxx
NEXT_PUBLIC_STORMGLASS_API_KEY=xxx

# Optional
NEXT_PUBLIC_WORLDTIDES_API_KEY=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
```

## Core Concepts

### 37 Tidal Constituents

```typescript
// Primary constituents (semidiurnal)
M2 (lunar principal): 1.932 cycles/day
S2 (solar principal): 2.0 cycles/day
N2 (lunar elliptic): 1.896 cycles/day

// Secondary constituents (diurnal)
K1 (solar-lunar): 1.003 cycles/day
O1 (lunar principal): 0.929 cycles/day

// Plus 32 more shallow-water and long-period constituents
```

### Harmonic Synthesis Formula

```
η(t) = MSL + Σ[H_i × f_i × cos(ω_i × t + φ_i + κ_i)]

Where:
- MSL: Mean Sea Level
- H: Amplitude
- f: Nodal factor
- ω: Angular frequency
- φ: Phase lag
- κ: Nodal correction
```

### 3-Tier Data Fallback

```
1st: Tile data (precomputed, high accuracy)
2nd: Harmonic synthesis (fast, good accuracy)
3rd: API data (most recent, network required)
4th: Offline cache (no network available)
```

## Development Workflow

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# ...implement your feature...

# 3. Run tests
pnpm test

# 4. Run linter
pnpm lint

# 5. Format code
pnpm format

# 6. Commit with message
git add .
git commit -m "✨ Feature: Your feature description"

# 7. Push and create PR
git push origin feature/your-feature
```

### Commit Message Format

```
<type>(<scope>): <description>

Types:
✨ feat     - New feature
🐛 fix      - Bug fix
⚡ perf     - Performance improvement
♻️ refactor - Code refactoring
📚 docs     - Documentation
🧪 test    - Tests
🎨 style   - Style fixes
🚀 deploy  - Deployment

Examples:
✨ feat(harmonic): Add K2 constituent
🐛 fix(cache): Resolve IndexedDB leak
```

## Testing

### Unit Tests

```bash
pnpm test:unit

# Run specific file
pnpm test:unit lib/harmonic-engine.test.ts

# Watch mode
pnpm test:unit --watch
```

### Integration Tests

```bash
pnpm test:integration

# Specific test
pnpm test:integration pages/api/predict.test.ts
```

### Performance Tests

```bash
pnpm test:perf

# Profile specific function
pnpm test:perf lib/harmonic-engine.perf.ts
```

## Performance Profiling

### Memory Profiling

```typescript
import { performanceProfiler } from '@/lib/performance-profiler'

performanceProfiler.mark('my-operation')
// ...do work...
performanceProfiler.measure('my-operation', 'computation')

console.log(performanceProfiler.getStats())
```

### Device Profiling

```typescript
import { deviceOptimizer } from '@/lib/device-optimizer'

const profile = deviceOptimizer.detectDevice()
console.log(profile)
// { deviceType: 'mobile', memoryAvailable: 512, cpuCores: 4, ... }

const settings = deviceOptimizer.optimizeSettings()
console.log(settings)
// { maxCacheSize: 25, tileBatchSize: 2, ... }
```

### API Response Time

```typescript
// Automatically tracked by tidePredictionAPI
const predictions = await tidePredictionAPI.getPredictions({...})
console.log(predictions.responseTime) // milliseconds
```

## Debugging

### Browser DevTools

```javascript
// Access in console
window.tidePredictionAPI.getStats()
window.performanceProfiler.export()
window.deviceOptimizer.getProfile()
window.fieldValidationManager.generateReport()
```

### Service Worker Debugging

```javascript
// In Chrome DevTools
// 1. Go to DevTools > Application > Service Workers
// 2. Inspect active service worker
// 3. Check cache storage
// 4. Monitor network requests
```

### Offline Testing

```javascript
// Simulate offline in DevTools
// 1. DevTools > Network
// 2. Check "Offline"
// 3. Test functionality

// Or programmatically
navigator.onLine // true/false
```

## Deployment

### Development

```bash
pnpm dev
# Runs on http://localhost:3000
# Hot reload enabled
# TypeScript checking
```

### Staging

```bash
pnpm build
pnpm start
# Production build, local
# No hot reload
```

### Production (Vercel)

```bash
# Configure Vercel
vercel link

# Deploy
git push origin main
# Automatically deploys via git hook

# Manual deploy
vercel deploy --prod
```

### Custom Server

```bash
# Build Docker image
docker build -t seapalo .

# Run container
docker run -p 3000:3000 seapalo

# Push to registry
docker push your-registry/seapalo:latest
```

## Monitoring & Logging

### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error)
```

### Performance Monitoring

```typescript
// Built-in performance tracking
const response = await tidePredictionAPI.getPredictions({...})
console.log(`Response time: ${response.responseTime}ms`)
```

### Analytics (Optional)

```typescript
// Track user actions
gtag.event('prediction_requested', {
  location: 'Bangkok',
  dataSource: 'api'
})
```

## Troubleshooting

### Issue: Predictions returning old data

```typescript
// Clear cache
predictionQueryCache.clear()
tileManager.getStats() // Check cache size
```

### Issue: Service Worker not updating

```javascript
// Force update
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update())
})
```

### Issue: Performance degradation

```typescript
// Check device profile
const profile = deviceOptimizer.detectDevice()
if (profile.memoryAvailable < 256) {
  // Reduce cache size, increase intervals
}
```

### Issue: PDPA compliance error

```typescript
// Check user consent
const hasConsent = securityManager.hasConsent(userId, 'location')
if (!hasConsent) {
  // Request consent before tracking
}
```

## Best Practices

### Code Quality
- Use TypeScript strict mode
- Follow SOLID principles
- Avoid prop drilling (use context)
- Memoize expensive components

### Performance
- Lazy load routes
- Use React.memo() for pure components
- Profile before optimizing
- Monitor bundle size

### Security
- Validate all inputs
- Sanitize user data
- Use HTTPS only
- Rotate secrets regularly

### Testing
- Aim for 80%+ coverage
- Test edge cases
- Mock external APIs
- Test offline scenarios

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tidal Science
- [NOAA Tidal Predictions](https://tides.noaa.gov)
- [IHO Tidal Constituents](https://www.iho.int)
- [FES2022 Model](https://www.aviso.altimetry.fr)

### Tools
- [pnpm](https://pnpm.io)
- [Vercel CLI](https://vercel.com/cli)
- [Docker](https://www.docker.com)

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

See CONTRIBUTING.md for details.

## Support

- **Issues**: GitHub Issues
- **Email**: dev@seapalo.app
- **Chat**: GitHub Discussions

---

**Happy coding! 🌊**
