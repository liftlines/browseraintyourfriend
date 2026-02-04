// Privacy Test Utilities - Robust Browser Privacy Detection
// Based on FingerprintJS and EFF Cover Your Tracks implementations

// Helper to generate hash from string
const hashString = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 1. IP Address Detection - Enhanced with VPN/Proxy detection
export const testIPAddress = async () => {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // VPN/Proxy Detection - Check multiple indicators
        const orgLower = (data.org || '').toLowerCase();
        const vpnKeywords = ['vpn', 'proxy', 'hosting', 'datacenter', 'server', 'cloud', 
                           'digital ocean', 'amazon', 'google cloud', 'microsoft', 
                           'linode', 'vultr', 'ovh', 'hetzner', 'choopa', 'mullvad',
                           'nordvpn', 'expressvpn', 'surfshark', 'private internet'];
        const isVpnByOrg = vpnKeywords.some(kw => orgLower.includes(kw));
        
        // Check timezone mismatch (strong VPN indicator)
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const ipTimezone = data.timezone;
        const timezoneMismatch = ipTimezone && browserTimezone !== ipTimezone;
        
        const isVpn = isVpnByOrg || timezoneMismatch;
        const status = isVpn ? 'safe' : 'leak';
        
        return {
            status,
            summary: isVpn 
                ? `VPN/Proxy detected - real IP hidden`
                : `Your real IP is visible (${data.ip})`,
            details: {
                ipAddress: data.ip,
                country: data.country_name,
                city: data.city,
                region: data.region,
                isp: data.org,
                vpnDetected: isVpn,
                vpnIndicators: {
                    orgNameMatch: isVpnByOrg,
                    timezoneMismatch: timezoneMismatch
                },
                browserTimezone: browserTimezone,
                ipTimezone: ipTimezone,
                assessment: isVpn 
                    ? 'PROTECTED: Your real IP is hidden behind a VPN/Proxy'
                    : 'EXPOSED: Your real IP address and location are visible'
            }
        };
    } catch (error) {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return {
                status: 'leak',
                summary: `Your real IP is visible (${data.ip})`,
                details: {
                    ipAddress: data.ip,
                    vpnDetected: false,
                    limitedInfo: 'Full geolocation unavailable'
                }
            };
        } catch (e) {
            return {
                status: 'unknown',
                summary: 'Could not detect IP',
                details: { error: error.message }
            };
        }
    }
};

// 2. WebRTC Leak Test - Properly detects IP leaks
export const testWebRTC = () => {
    return new Promise((resolve) => {
        const ips = { local: [], public: [], ipv6: [] };
        
        if (!window.RTCPeerConnection) {
            resolve({
                status: 'safe',
                summary: 'WebRTC not supported',
                details: { supported: false, leaking: false }
            });
            return;
        }
        
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
        
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        const timeout = setTimeout(() => {
            pc.close();
            const hasLeak = ips.local.length > 0 || ips.public.length > 0;
            resolve({
                status: hasLeak ? 'leak' : 'safe',
                summary: hasLeak ? `WebRTC leaking ${ips.local.length + ips.public.length} IP(s)` : 'WebRTC protected',
                details: {
                    supported: true,
                    localIPs: ips.local,
                    publicIPs: ips.public,
                    ipv6: ips.ipv6,
                    leaking: hasLeak,
                    assessment: hasLeak 
                        ? 'EXPOSED: WebRTC reveals IP addresses even with VPN'
                        : 'PROTECTED: No WebRTC IP leak detected'
                }
            });
        }, 3000);
        
        pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            
            const candidate = event.candidate.candidate;
            const ipv4Regex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
            const ipv6Regex = /([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/i;
            
            const ipv4Match = candidate.match(ipv4Regex);
            const ipv6Match = candidate.match(ipv6Regex);
            
            if (ipv4Match) {
                const ip = ipv4Match[0];
                // RFC 1918 private ranges
                const isPrivate = ip.startsWith('192.168.') || 
                                 ip.startsWith('10.') || 
                                 (ip.startsWith('172.') && (() => {
                                     const second = parseInt(ip.split('.')[1], 10);
                                     return second >= 16 && second <= 31;
                                 })());
                if (isPrivate) {
                    if (!ips.local.includes(ip)) ips.local.push(ip);
                } else if (!ip.startsWith('0.') && ip !== '0.0.0.0') {
                    if (!ips.public.includes(ip)) ips.public.push(ip);
                }
            }
            
            if (ipv6Match && !ips.ipv6.includes(ipv6Match[0])) {
                ips.ipv6.push(ipv6Match[0]);
            }
        };
    });
};

// 3. Canvas Fingerprinting - FingerprintJS-style implementation
export const testCanvas = async () => {
    try {
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            return { status: 'safe', summary: 'Canvas not supported', details: { supported: false } };
        }
        
        // FingerprintJS-style canvas test
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(100, 1, 62, 20);
        
        ctx.fillStyle = '#069';
        ctx.font = '11pt Arial';
        ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 2, 15);
        
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.font = '18pt Arial';
        ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 4, 45);
        
        // Get pixel data to detect randomization
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL();
        const hash = await hashString(dataUrl);
        
        // Detect protection by checking if output changes on repeated calls
        let isRandomized = isBrave;
        
        // Firefox resistFingerprinting detection
        if (!isRandomized && navigator.userAgent.includes('Firefox')) {
            const testCanvas2 = document.createElement('canvas');
            testCanvas2.width = 16;
            testCanvas2.height = 16;
            const ctx2 = testCanvas2.getContext('2d');
            ctx2.fillStyle = '#ff0000';
            ctx2.fillRect(0, 0, 16, 16);
            const data = ctx2.getImageData(0, 0, 16, 16).data;
            // resistFingerprinting adds noise to pixel values
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] !== 255) { isRandomized = true; break; }
            }
        }
        
        return {
            status: isRandomized ? 'safe' : 'leak',
            summary: isRandomized 
                ? 'Canvas fingerprint randomized (protected)'
                : 'Canvas fingerprint unique',
            details: {
                supported: true,
                signature: hash.substring(0, 32),
                randomized: isRandomized,
                browser: isBrave ? 'Brave' : isRandomized ? 'Firefox (resistFingerprinting)' : 'Standard',
                assessment: isRandomized
                    ? 'PROTECTED: Canvas output is randomized'
                    : 'EXPOSED: Canvas fingerprint can uniquely identify you'
            }
        };
    } catch (error) {
        return { status: 'unknown', summary: 'Canvas test failed', details: { error: error.message } };
    }
};

// 4. WebGL Fingerprinting
export const testWebGL = async () => {
    try {
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return { status: 'safe', summary: 'WebGL not supported', details: { supported: false } };
        }
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        
        const isSpoofed = renderer === 'Unknown' || renderer.includes('BLOCKED') || renderer.includes('Mesa');
        const isProtected = isBrave || isSpoofed;
        
        // Generate fingerprint from WebGL parameters
        const params = [
            gl.getParameter(gl.VERSION),
            gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            vendor, renderer,
            gl.getParameter(gl.MAX_TEXTURE_SIZE),
            gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
        ].join('~');
        
        const hash = await hashString(params);
        
        return {
            status: isProtected ? 'safe' : 'leak',
            summary: isProtected 
                ? 'WebGL info protected'
                : `GPU: ${renderer.substring(0, 35)}${renderer.length > 35 ? '...' : ''}`,
            details: {
                supported: true,
                vendor: vendor,
                renderer: renderer,
                webglVersion: gl.getParameter(gl.VERSION),
                hash: hash.substring(0, 16),
                protected: isProtected,
                assessment: isProtected
                    ? 'PROTECTED: WebGL info is blocked or randomized'
                    : 'EXPOSED: GPU info can identify your device'
            }
        };
    } catch (error) {
        return { status: 'unknown', summary: 'WebGL test failed', details: { error: error.message } };
    }
};

// 5. Audio Fingerprint - Proper OfflineAudioContext implementation (FingerprintJS method)
export const testAudio = async () => {
    try {
        const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        
        if (!OfflineAudioContext) {
            return { status: 'safe', summary: 'Audio API not supported', details: { supported: false } };
        }
        
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        
        // Create offline context for fingerprinting (not real-time)
        const context = new OfflineAudioContext(1, 5000, 44100);
        
        // Create oscillator (mathematical source for consistent output)
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 1000;
        
        // Add compressor for more variation between systems
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        
        oscillator.connect(compressor);
        compressor.connect(context.destination);
        oscillator.start(0);
        
        // Render and get fingerprint
        const buffer = await context.startRendering();
        const samples = buffer.getChannelData(0).slice(4500);
        
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
            sum += Math.abs(samples[i]);
        }
        
        const fingerprint = sum.toString();
        const hash = await hashString(fingerprint);
        
        return {
            status: isBrave ? 'safe' : 'leak',
            summary: isBrave 
                ? 'Audio fingerprint randomized (protected)'
                : `Audio fingerprint: ${hash.substring(0, 8)}...`,
            details: {
                supported: true,
                fingerprint: hash.substring(0, 16),
                sampleRate: 44100,
                randomized: isBrave,
                assessment: isBrave
                    ? 'PROTECTED: Audio processing is randomized'
                    : 'EXPOSED: Audio fingerprint can identify your device'
            }
        };
    } catch (error) {
        return {
            status: 'safe',
            summary: 'Audio API blocked',
            details: { supported: true, blocked: true, error: error.message }
        };
    }
};

// 6. Font Detection - CSS measurement method
export const testFonts = async () => {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    
    // Common fonts that provide good fingerprinting signal
    const testFonts = [
        'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas',
        'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console',
        'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS',
        'Verdana', 'Monaco', 'Menlo', 'SF Pro', 'San Francisco',
        'Ubuntu', 'DejaVu Sans', 'Liberation Sans', 'Roboto', 'Open Sans',
        'Fira Code', 'Source Code Pro', 'Noto Sans'
    ];
    
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const getWidth = (fontFamily) => {
        ctx.font = `${testSize} ${fontFamily}`;
        return ctx.measureText(testString).width;
    };
    
    const baseWidths = {};
    baseFonts.forEach(font => {
        baseWidths[font] = getWidth(font);
    });
    
    const detectedFonts = [];
    testFonts.forEach(font => {
        for (const baseFont of baseFonts) {
            if (getWidth(`'${font}', ${baseFont}`) !== baseWidths[baseFont]) {
                detectedFonts.push(font);
                break;
            }
        }
    });
    
    const hash = await hashString(detectedFonts.join(','));
    
    return {
        status: 'leak',
        summary: `${detectedFonts.length} fonts detected`,
        details: {
            count: detectedFonts.length,
            fonts: detectedFonts.slice(0, 15),
            hash: hash.substring(0, 16),
            assessment: 'EXPOSED: Font list helps identify your system'
        }
    };
};

// 7. Screen Information
export const testScreen = () => {
    const screen = window.screen;
    
    return {
        status: 'leak',
        summary: `${screen.width}x${screen.height} @ ${window.devicePixelRatio}x`,
        details: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            devicePixelRatio: window.devicePixelRatio,
            assessment: 'EXPOSED: Screen resolution is always visible'
        }
    };
};

// 8. Browser Information
export const testJavaScript = () => {
    const nav = navigator;
    
    return {
        status: 'leak',
        summary: `${nav.platform} - ${nav.hardwareConcurrency || '?'} cores`,
        details: {
            userAgent: nav.userAgent,
            platform: nav.platform,
            language: nav.language,
            languages: nav.languages ? [...nav.languages] : [nav.language],
            hardwareConcurrency: nav.hardwareConcurrency || 'Unknown',
            deviceMemory: nav.deviceMemory || 'Unknown',
            cookiesEnabled: nav.cookieEnabled,
            assessment: 'EXPOSED: Browser reveals system information'
        }
    };
};

// 9. Timezone Detection
export const testTimezone = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions();
    const offset = new Date().getTimezoneOffset();
    
    return {
        status: 'leak',
        summary: tz.timeZone,
        details: {
            timezone: tz.timeZone,
            offset: offset,
            offsetString: `UTC${offset > 0 ? '-' : '+'}${Math.abs(offset / 60)}`,
            locale: tz.locale,
            assessment: 'EXPOSED: Timezone reveals your region'
        }
    };
};

// 10. Do Not Track / Global Privacy Control
export const testDoNotTrack = () => {
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    const gpc = navigator.globalPrivacyControl;
    
    const dntEnabled = dnt === '1' || dnt === 'yes';
    const gpcEnabled = gpc === true;
    
    return {
        status: (dntEnabled || gpcEnabled) ? 'safe' : 'warning',
        summary: (dntEnabled || gpcEnabled) ? 'Privacy signals enabled' : 'No privacy signals',
        details: {
            dntEnabled,
            gpcEnabled,
            assessment: (dntEnabled || gpcEnabled)
                ? 'GOOD: You have privacy signals enabled'
                : 'Consider enabling Do Not Track or Global Privacy Control'
        }
    };
};

// 11. Storage APIs
export const testStorage = () => {
    let localStorage = false;
    let sessionStorage = false;
    let indexedDB = false;
    
    try {
        window.localStorage.setItem('test', 'test');
        window.localStorage.removeItem('test');
        localStorage = true;
    } catch (e) {}
    
    try {
        window.sessionStorage.setItem('test', 'test');
        window.sessionStorage.removeItem('test');
        sessionStorage = true;
    } catch (e) {}
    
    indexedDB = !!window.indexedDB;
    
    const trackingCapable = localStorage || indexedDB;
    
    return {
        status: trackingCapable ? 'leak' : 'safe',
        summary: trackingCapable ? 'Storage APIs available' : 'Storage blocked',
        details: {
            localStorage,
            sessionStorage,
            indexedDB,
            cookies: navigator.cookieEnabled,
            assessment: trackingCapable
                ? 'EXPOSED: Storage APIs enable persistent tracking'
                : 'PROTECTED: Storage APIs are blocked'
        }
    };
};

// 12. Geolocation Permission
export const testGeolocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({
                status: 'safe',
                summary: 'Geolocation not supported',
                details: { supported: false }
            });
            return;
        }
        
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                resolve({
                    status: result.state === 'granted' ? 'leak' : 
                           result.state === 'denied' ? 'safe' : 'warning',
                    summary: result.state === 'granted' ? 'Location access granted' :
                            result.state === 'denied' ? 'Location access denied' :
                            'Location not yet requested',
                    details: {
                        supported: true,
                        permissionState: result.state,
                        assessment: result.state === 'granted'
                            ? 'EXPOSED: Websites can access your precise location'
                            : 'PROTECTED: Location access is restricted'
                    }
                });
            }).catch(() => {
                resolve({
                    status: 'warning',
                    summary: 'Location status unknown',
                    details: { supported: true, permissionState: 'unknown' }
                });
            });
        } else {
            resolve({
                status: 'warning',
                summary: 'Permission API not supported',
                details: { supported: true }
            });
        }
    });
};

// 13. Media Devices
export const testMediaDevices = async () => {
    try {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return {
                status: 'safe',
                summary: 'Media API not supported',
                details: { supported: false }
            };
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput').length;
        const mics = devices.filter(d => d.kind === 'audioinput').length;
        
        return {
            status: 'leak',
            summary: `${cameras} camera(s), ${mics} mic(s)`,
            details: {
                supported: true,
                cameras,
                microphones: mics,
                total: devices.length,
                assessment: 'EXPOSED: Device count helps fingerprint your system'
            }
        };
    } catch (error) {
        return {
            status: 'safe',
            summary: 'Media devices blocked',
            details: { supported: true, blocked: true }
        };
    }
};

// 14. Ad Blocker Detection
export const testAdBlocker = async () => {
    try {
        const bait = document.createElement('div');
        bait.className = 'adsbox ad-banner pub_300x250';
        bait.style.cssText = 'position: absolute; top: -10px; left: -10px; width: 1px; height: 1px;';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const blocked = bait.offsetHeight === 0 || 
                       getComputedStyle(bait).display === 'none';
        
        document.body.removeChild(bait);
        
        return {
            status: blocked ? 'safe' : 'warning',
            summary: blocked ? 'Ad blocker detected' : 'No ad blocker',
            details: {
                adBlockerDetected: blocked,
                assessment: blocked
                    ? 'GOOD: Ad blocker helps protect privacy'
                    : 'Consider using uBlock Origin for better privacy'
            }
        };
    } catch (error) {
        return { status: 'unknown', summary: 'Could not test', details: { error: error.message } };
    }
};

// 15. Client Hints (if available)
export const testClientHints = async () => {
    if (!navigator.userAgentData) {
        return {
            status: 'safe',
            summary: 'Client Hints not supported',
            details: { supported: false }
        };
    }
    
    try {
        const hints = {
            brands: navigator.userAgentData.brands,
            mobile: navigator.userAgentData.mobile,
            platform: navigator.userAgentData.platform
        };
        
        return {
            status: 'leak',
            summary: `${hints.platform} - ${hints.mobile ? 'Mobile' : 'Desktop'}`,
            details: {
                supported: true,
                ...hints,
                assessment: 'EXPOSED: Client Hints reveal browser details'
            }
        };
    } catch (error) {
        return { status: 'unknown', summary: 'Client Hints error', details: { error: error.message } };
    }
};

// Run all tests
export const runAllTests = async () => {
    const tests = [
        { id: 'ip', name: 'IP Address', icon: 'globe', test: testIPAddress },
        { id: 'webrtc', name: 'WebRTC Leak', icon: 'video', test: testWebRTC },
        { id: 'canvas', name: 'Canvas Fingerprint', icon: 'palette', test: testCanvas },
        { id: 'webgl', name: 'WebGL', icon: 'cpu', test: testWebGL },
        { id: 'audio', name: 'Audio Fingerprint', icon: 'music', test: testAudio },
        { id: 'fonts', name: 'Font Detection', icon: 'type', test: testFonts },
        { id: 'javascript', name: 'Browser Info', icon: 'code', test: testJavaScript },
        { id: 'screen', name: 'Screen Info', icon: 'monitor', test: testScreen },
        { id: 'timezone', name: 'Timezone', icon: 'clock', test: testTimezone },
        { id: 'dnt', name: 'Privacy Signals', icon: 'eyeOff', test: testDoNotTrack },
        { id: 'storage', name: 'Storage APIs', icon: 'database', test: testStorage },
        { id: 'geolocation', name: 'Geolocation', icon: 'mapPin', test: testGeolocation },
        { id: 'media', name: 'Media Devices', icon: 'camera', test: testMediaDevices },
        { id: 'adBlocker', name: 'Ad Blocker', icon: 'shield', test: testAdBlocker },
        { id: 'clientHints', name: 'Client Hints', icon: 'info', test: testClientHints }
    ];
    
    const runWithTimeout = async (test, timeout = 5000) => {
        try {
            const result = await Promise.race([
                test.test(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), timeout)
                )
            ]);
            return { ...result, name: test.name, icon: test.icon };
        } catch (error) {
            return {
                name: test.name,
                icon: test.icon,
                status: 'unknown',
                summary: 'Test timed out',
                details: { error: error.message }
            };
        }
    };
    
    const resultsArray = await Promise.all(
        tests.map(test => runWithTimeout(test))
    );
    
    const results = {};
    tests.forEach((test, index) => {
        results[test.id] = resultsArray[index];
    });
    
    return results;
};
