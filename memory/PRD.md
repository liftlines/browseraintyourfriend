# Browser Privacy Inspector - Product Requirements Document

## Original Problem Statement
Build a web application inspired by `browserleaks.com` that automatically detects and displays browser privacy leaks upon visiting the site. Key requirements:
- Fully functional, conducting real privacy tests on the client-side
- Results simplified for non-technical users (yes/no for leaks, with option for details)
- Slick, minimalist design inspired by `logos.co`
- Incorporate concepts from `coveryourtracks.eff.org` like browser fingerprint uniqueness

## Core Features Implemented

### Privacy Tests (19 total)
1. **IP Address Detection** - Reveals IP, location, ISP, with VPN/proxy detection
2. **WebRTC Leak Test** - Detects local/public IP leaks via WebRTC
3. **Canvas Fingerprint** - Unique browser fingerprint from graphics rendering
4. **WebGL Fingerprint** - GPU information exposure
5. **Browser Info (JavaScript)** - User agent, platform, hardware info
6. **Screen Info** - Resolution, color depth, pixel ratio
7. **Font Detection** - Installed fonts enumeration
8. **Audio Fingerprint** - Audio processing characteristics
9. **Geolocation** - Permission state for GPS location
10. **Timezone** - System timezone detection
11. **Do Not Track** - DNT/GPC signal status
12. **Battery Status** - Battery API exposure
13. **Network Info** - Connection type and speed
14. **Client Hints** - UA-CH headers
15. **Storage APIs** - Local/session storage, IndexedDB, cookies
16. **Media Devices** - Camera/microphone enumeration
17. **Touch Support** - Touch capability detection
18. **Ad Blocker** - Ad blocker presence detection
19. **HTTP Headers** - Inferred header information

### UI Components
- **Hero Section**: Privacy Score (0-100%), Exposed/Protected/Warnings counts, "Identifying items exposed" metric
- **Privacy Assessment Card**: Trackability assessment, score bar, exposed information breakdown
- **Results Grid**: Individual test cards with detailed information
- **Recommendations Card**: Prioritized privacy recommendations with logos.co CTA
- **Header**: Re-scan button, branding
- **Footer**: Links and credits

## Technical Architecture

### Frontend Only (No Backend)
- **Framework**: React.js with Create React App (CRACO)
- **Styling**: TailwindCSS, shadcn/ui components
- **State**: React hooks (useState, useEffect, useCallback)
- **Routing**: React Router (single page)

### Key Files
- `/app/frontend/src/App.js` - Main app orchestration
- `/app/frontend/src/utils/privacyTests.js` - All 19 privacy test implementations
- `/app/frontend/src/utils/entropyCalculator.js` - "Identifying items" score calculation
- `/app/frontend/src/components/` - UI components

### External API
- `ipapi.co` - IP geolocation (client-side, no API key)
- Fallback: `api.ipify.org` for basic IP detection

## Completed Work

### Session 2025-02-02
- **P0 Fix**: Completed "bits of entropy" → "identifying items" refactoring
  - Updated `App.js` to pass `privacyData` prop correctly
  - Fixed toast notification to show "X identifying items exposed"
  - Verified `Hero.jsx` and `UniquenessCard.jsx` work with new data structure
- **P1 Fix**: Test logic audit and corrections
  - Fixed WebRTC private IP detection for 172.16-31.x.x range (was incorrectly matching all 172.x)
  - Improved Firefox `resistFingerprinting` detection in canvas test (now uses pixel comparison instead of CSS check)
- **Testing**: 100% pass rate on all 10 test cases

## Known Limitations
- VPN detection is heuristic-based (org name, ASN, timezone mismatch)
- Firefox `resistFingerprinting` detection works but may have edge cases
- Canvas/WebGL protection detection relies on Brave API which may not be available in all browsers

## Future Enhancements (Backlog)
- [ ] Modularize `privacyTests.js` (currently 1000+ lines)
- [ ] Add comparison feature with EFF Cover Your Tracks scores
- [ ] Export results as PDF/JSON
- [ ] Historical tracking (compare scans over time)
- [ ] Browser-specific recommendations
