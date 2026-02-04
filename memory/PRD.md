# Browser Privacy Inspector - Product Requirements Document

## Original Problem Statement
Build a web application inspired by `browserleaks.com` that automatically detects and displays browser privacy leaks upon visiting the site. Key requirements:
- Fully functional, conducting real privacy tests on the client-side
- Results simplified for non-technical users (yes/no for leaks, with option for details)
- Slick, minimalist design inspired by `logos.co`
- Incorporate concepts from `coveryourtracks.eff.org` like browser fingerprint uniqueness

## Core Features Implemented

### Privacy Tests (15 total - robust, high-entropy signals only)
Based on FingerprintJS and EFF Cover Your Tracks implementations:

1. **IP Address Detection** - Reveals IP, location, ISP with VPN/proxy detection
2. **WebRTC Leak Test** - Detects local/public IP leaks via WebRTC ICE candidates
3. **Canvas Fingerprint** - FingerprintJS-style implementation with emoji rendering
4. **WebGL Fingerprint** - GPU vendor/renderer information exposure
5. **Audio Fingerprint** - Proper OfflineAudioContext implementation with oscillator+compressor
6. **Font Detection** - CSS measurement-based font enumeration
7. **Browser Info** - User agent, platform, hardware concurrency
8. **Screen Info** - Resolution, color depth, pixel ratio
9. **Timezone** - System timezone detection
10. **Privacy Signals (DNT/GPC)** - Do Not Track and Global Privacy Control status
11. **Storage APIs** - LocalStorage, SessionStorage, IndexedDB availability
12. **Geolocation** - Permission state for GPS location
13. **Media Devices** - Camera/microphone enumeration
14. **Ad Blocker Detection** - Bait element detection method
15. **Client Hints** - UA-CH headers if supported

### Removed Tests (unreliable, low-entropy per research)
- ~~Battery API~~ - Low entropy (~1-2 bits), inconsistent across sessions
- ~~Touch Support~~ - Poor uniqueness (<5 bits), varies by OS updates
- ~~Network Info API~~ - Permission-blocked, generic outputs (<3 bits)
- ~~HTTP Headers~~ - Cannot be tested client-side accurately

## Technical Architecture

### Frontend Only (No Backend)
- **Framework**: React.js with Create React App (CRACO)
- **Styling**: TailwindCSS, shadcn/ui components
- **State**: React hooks (useState, useEffect, useCallback)

### Key Files
- `/app/frontend/src/utils/privacyTests.js` - Robust implementations of 15 tests
- `/app/frontend/src/utils/entropyCalculator.js` - "Identifying items" score calculation
- `/app/frontend/src/App.js` - Main app orchestration
- `/app/frontend/src/components/` - UI components

### External API
- `ipapi.co` - IP geolocation (client-side, no API key)
- Fallback: `api.ipify.org` for basic IP detection

## Completed Work

### Session 2025-02-02
- Initial build with 19 tests
- Fixed "bits → items" metric confusion
- Fixed prop passing issues

### Session 2025-02-04 (Current)
- **Major Refactor**: Rewrote all tests based on FingerprintJS/EFF research
- **Removed 4 unreliable tests**: Battery, Touch, Network, HTTP Headers
- **Improved Audio test**: Now uses proper OfflineAudioContext with oscillator and compressor (FingerprintJS method)
- **Improved Canvas test**: Better Firefox resistFingerprinting detection
- **Testing**: 100% pass rate on all test cases

## Research References
- FingerprintJS implementation: https://github.com/fingerprintjs/fingerprintjs
- EFF Cover Your Tracks: https://coveryourtracks.eff.org
- Common fingerprinting issues: Volatility, spoofing detection, browser anti-fingerprinting

## Known Limitations
- VPN detection is heuristic-based (org name, timezone mismatch)
- Canvas/WebGL protection detection relies on browser APIs
- IP geolocation depends on external API availability

## Future Enhancements (Backlog)
- [ ] Add comparison with EFF Cover Your Tracks scores
- [ ] Export results as PDF/JSON
- [ ] Historical tracking (compare scans over time)
- [ ] Browser-specific recommendations
- [ ] WebGL rendering fingerprint (draw-based, not just params)
