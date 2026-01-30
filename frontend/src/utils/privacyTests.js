// Privacy Test Utilities - Fully Functional Browser Privacy Detection

// Helper to generate hash from string
const hashString = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 1. IP Address Detection
export const testIPAddress = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        // Also try to get IPv6
        let ipv6 = null;
        try {
            const v6Response = await fetch('https://api64.ipify.org?format=json');
            const v6Data = await v6Response.json();
            if (v6Data.ip !== data.ip) {
                ipv6 = v6Data.ip;
            }
        } catch (e) {
            // IPv6 not available
        }
        
        return {
            status: 'leak',
            summary: 'Your IP address is visible',
            details: {
                ipv4: data.ip,
                ipv6: ipv6,
                exposed: true
            }
        };
    } catch (error) {
        return {
            status: 'unknown',
            summary: 'Could not detect IP',
            details: { error: error.message }
        };
    }
};

// 2. WebRTC Leak Test
export const testWebRTC = () => {
    return new Promise((resolve) => {
        const ips = {
            local: [],
            public: [],
            ipv6: []
        };
        
        if (!window.RTCPeerConnection) {
            resolve({
                status: 'safe',
                summary: 'WebRTC not supported',
                details: { supported: false }
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
                summary: hasLeak ? 'WebRTC is leaking IPs' : 'WebRTC is not leaking IPs',
                details: {
                    supported: true,
                    localIPs: ips.local,
                    publicIPs: ips.public,
                    ipv6: ips.ipv6,
                    leaking: hasLeak
                }
            });
        }, 3000);
        
        pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            
            const candidate = event.candidate.candidate;
            const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
            const ipv6Regex = /([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){0,7}::[a-f0-9]{0,4}(:[a-f0-9]{1,4}){0,7})/i;
            
            const ipMatch = candidate.match(ipRegex);
            const ipv6Match = candidate.match(ipv6Regex);
            
            if (ipMatch) {
                const ip = ipMatch[0];
                if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
                    if (!ips.local.includes(ip)) ips.local.push(ip);
                } else {
                    if (!ips.public.includes(ip)) ips.public.push(ip);
                }
            }
            
            if (ipv6Match) {
                const ip = ipv6Match[0];
                if (!ips.ipv6.includes(ip)) ips.ipv6.push(ip);
            }
        };
    });
};

// 3. Canvas Fingerprinting - with randomization detection
export const testCanvas = async () => {
    try {
        const generateCanvasHash = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            
            // Draw various elements to create unique fingerprint
            ctx.textBaseline = 'top';
            ctx.font = "14px 'Arial'";
            ctx.fillStyle = '#f60';
            ctx.fillRect(0, 0, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Browseraintyourfriend', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Canvas Test', 4, 17);
            
            // Add some shapes
            ctx.beginPath();
            ctx.arc(100, 25, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#e74c3c';
            ctx.fill();
            
            const dataUrl = canvas.toDataURL();
            return await hashString(dataUrl);
        };
        
        // Generate hash twice to detect randomization
        const hash1 = await generateCanvasHash();
        const hash2 = await generateCanvasHash();
        
        const isRandomized = hash1 !== hash2;
        
        return {
            status: isRandomized ? 'safe' : 'leak',
            summary: isRandomized ? 'Canvas fingerprint is randomized (protected)' : 'Canvas fingerprint is unique',
            details: {
                hash: hash1.substring(0, 32) + '...',
                fullHash: hash1,
                supported: true,
                randomized: isRandomized,
                uniqueIdentifier: !isRandomized,
                protection: isRandomized ? 'Browser is randomizing canvas fingerprint' : 'No canvas protection detected'
            }
        };
    } catch (error) {
        return {
            status: 'unknown',
            summary: 'Canvas test failed',
            details: { error: error.message }
        };
    }
};

// 4. WebGL Fingerprinting - with randomization detection
export const testWebGL = async () => {
    try {
        const getWebGLFingerprint = async () => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return null;
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
            const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
            
            // Create a WebGL fingerprint by rendering
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}');
            gl.compileShader(vertexShader);
            
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, 'precision mediump float;void main(){gl_FragColor=vec4(1,0,0,1);}');
            gl.compileShader(fragmentShader);
            
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);
            
            const pixels = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            
            const hash = await hashString(canvas.toDataURL() + pixels.join(','));
            
            return {
                vendor,
                renderer,
                hash,
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maskedVendor: gl.getParameter(gl.VENDOR),
                maskedRenderer: gl.getParameter(gl.RENDERER),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
            };
        };
        
        const fp1 = await getWebGLFingerprint();
        if (!fp1) {
            return {
                status: 'safe',
                summary: 'WebGL not supported',
                details: { supported: false }
            };
        }
        
        const fp2 = await getWebGLFingerprint();
        const isRandomized = fp1.hash !== fp2.hash;
        
        return {
            status: isRandomized ? 'safe' : 'leak',
            summary: isRandomized 
                ? 'WebGL fingerprint is randomized (protected)' 
                : `GPU: ${fp1.renderer.substring(0, 40)}${fp1.renderer.length > 40 ? '...' : ''}`,
            details: {
                supported: true,
                randomized: isRandomized,
                unmaskedVendor: fp1.vendor,
                unmaskedRenderer: fp1.renderer,
                version: fp1.version,
                shadingLanguageVersion: fp1.shadingLanguageVersion,
                maxTextureSize: fp1.maxTextureSize,
                protection: isRandomized ? 'Browser is randomizing WebGL fingerprint' : 'No WebGL protection detected',
                exposes: isRandomized ? [] : ['GPU model', 'Driver version', 'Hardware capabilities']
            }
        };
    } catch (error) {
        return {
            status: 'unknown',
            summary: 'WebGL test failed',
            details: { error: error.message }
        };
    }
};

// 5. JavaScript / Browser Information
export const testJavaScript = () => {
    const nav = navigator;
    
    const details = {
        userAgent: nav.userAgent,
        platform: nav.platform,
        language: nav.language,
        languages: nav.languages ? [...nav.languages] : [nav.language],
        cookiesEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack || window.doNotTrack || nav.msDoNotTrack,
        hardwareConcurrency: nav.hardwareConcurrency || 'Unknown',
        maxTouchPoints: nav.maxTouchPoints || 0,
        deviceMemory: nav.deviceMemory || 'Unknown',
        pdfViewerEnabled: nav.pdfViewerEnabled,
        webdriver: nav.webdriver,
        plugins: Array.from(nav.plugins || []).map(p => p.name).slice(0, 10),
        mimeTypes: Array.from(nav.mimeTypes || []).map(m => m.type).slice(0, 10)
    };
    
    return {
        status: 'leak',
        summary: `${details.platform} - ${details.hardwareConcurrency} cores`,
        details
    };
};

// 6. Screen Information
export const testScreen = () => {
    const screen = window.screen;
    
    const details = {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.type || 'Unknown',
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
    };
    
    return {
        status: 'leak',
        summary: `${details.width}x${details.height} @ ${details.devicePixelRatio}x`,
        details
    };
};

// 7. Font Detection
export const testFonts = async () => {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
        'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
        'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Palatino Linotype',
        'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
        'Monaco', 'Menlo', 'Consolas', 'DejaVu Sans', 'Liberation Sans',
        'Helvetica', 'Helvetica Neue', 'SF Pro', 'Segoe UI', 'Roboto',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Open Sans'
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
        let detected = false;
        for (const baseFont of baseFonts) {
            const testWidth = getWidth(`'${font}', ${baseFont}`);
            if (testWidth !== baseWidths[baseFont]) {
                detected = true;
                break;
            }
        }
        if (detected) {
            detectedFonts.push(font);
        }
    });
    
    const hash = await hashString(detectedFonts.join(','));
    
    return {
        status: 'leak',
        summary: `${detectedFonts.length} fonts detected`,
        details: {
            count: detectedFonts.length,
            fonts: detectedFonts,
            hash: hash.substring(0, 16),
            uniqueIdentifier: true
        }
    };
};

// 8. Audio Fingerprint - Simplified to avoid autoplay restrictions
export const testAudio = async () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            return {
                status: 'safe',
                summary: 'AudioContext not supported',
                details: { supported: false }
            };
        }
        
        // Create context but don't start it - just check capabilities
        const context = new AudioContext();
        
        // Get audio context properties that can be used for fingerprinting
        const details = {
            supported: true,
            sampleRate: context.sampleRate,
            state: context.state,
            baseLatency: context.baseLatency,
            outputLatency: context.outputLatency,
            channelCount: context.destination.channelCount,
            maxChannelCount: context.destination.maxChannelCount,
            numberOfInputs: context.destination.numberOfInputs,
            numberOfOutputs: context.destination.numberOfOutputs
        };
        
        // Generate hash from these properties
        const hash = await hashString(JSON.stringify(details));
        
        // Close context
        await context.close();
        
        return {
            status: 'leak',
            summary: `Sample rate: ${details.sampleRate}Hz`,
            details: {
                ...details,
                hash: hash.substring(0, 16),
                uniqueIdentifier: true,
                note: 'Audio properties can uniquely identify your device'
            }
        };
    } catch (error) {
        return {
            status: 'warning',
            summary: 'Audio API blocked',
            details: { 
                supported: true, 
                blocked: true,
                error: error.message,
                note: 'Browser blocked audio fingerprinting'
            }
        };
    }
};

// 9. Geolocation Test
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
        
        // Check permissions
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                resolve({
                    status: result.state === 'granted' ? 'leak' : 
                           result.state === 'denied' ? 'safe' : 'warning',
                    summary: result.state === 'granted' ? 'Location access granted' :
                            result.state === 'denied' ? 'Location access denied' :
                            'Location permission not set',
                    details: {
                        supported: true,
                        permissionState: result.state,
                        canTrack: result.state === 'granted'
                    }
                });
            }).catch(() => {
                resolve({
                    status: 'warning',
                    summary: 'Location permission unknown',
                    details: { supported: true, permissionState: 'unknown' }
                });
            });
        } else {
            resolve({
                status: 'warning',
                summary: 'Permission API not supported',
                details: { supported: true, permissionState: 'unknown' }
            });
        }
    });
};

// 10. Timezone Detection
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
            calendar: tz.calendar
        }
    };
};

// 11. Do Not Track
export const testDoNotTrack = () => {
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    const gpc = navigator.globalPrivacyControl;
    
    const dntEnabled = dnt === '1' || dnt === 'yes';
    const gpcEnabled = gpc === true;
    
    return {
        status: (dntEnabled || gpcEnabled) ? 'safe' : 'leak',
        summary: (dntEnabled || gpcEnabled) ? 'Privacy signals enabled' : 'No privacy signals',
        details: {
            doNotTrack: dnt,
            dntEnabled,
            globalPrivacyControl: gpc,
            gpcEnabled,
            recommendation: !dntEnabled && !gpcEnabled ? 'Consider enabling DNT or GPC' : null
        }
    };
};

// 12. Battery Status
export const testBattery = async () => {
    try {
        if (!navigator.getBattery) {
            return {
                status: 'safe',
                summary: 'Battery API not supported',
                details: { supported: false }
            };
        }
        
        const battery = await navigator.getBattery();
        
        return {
            status: 'leak',
            summary: `${Math.round(battery.level * 100)}% ${battery.charging ? '(charging)' : ''}`,
            details: {
                supported: true,
                level: battery.level,
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime,
                canTrack: true
            }
        };
    } catch (error) {
        return {
            status: 'safe',
            summary: 'Battery API blocked',
            details: { supported: false, blocked: true }
        };
    }
};

// 13. Network Information
export const testNetwork = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
        return {
            status: 'safe',
            summary: 'Network API not supported',
            details: { supported: false }
        };
    }
    
    return {
        status: 'leak',
        summary: `${connection.effectiveType || 'Unknown'} connection`,
        details: {
            supported: true,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
            type: connection.type
        }
    };
};

// 14. Client Hints
export const testClientHints = async () => {
    const hints = {};
    
    // Check for user agent data
    if (navigator.userAgentData) {
        hints.brands = navigator.userAgentData.brands;
        hints.mobile = navigator.userAgentData.mobile;
        hints.platform = navigator.userAgentData.platform;
        
        try {
            const highEntropyValues = await navigator.userAgentData.getHighEntropyValues([
                'architecture', 'bitness', 'model', 'platformVersion', 'fullVersionList'
            ]);
            hints.highEntropy = highEntropyValues;
        } catch (e) {
            hints.highEntropyError = e.message;
        }
        
        return {
            status: 'leak',
            summary: 'Client Hints available',
            details: {
                supported: true,
                ...hints
            }
        };
    }
    
    return {
        status: 'safe',
        summary: 'Client Hints not supported',
        details: { supported: false }
    };
};

// 15. Storage APIs
export const testStorage = () => {
    const storage = {
        localStorage: false,
        sessionStorage: false,
        indexedDB: false,
        cookies: false
    };
    
    // Test localStorage
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        storage.localStorage = true;
    } catch (e) {
        // localStorage not available
    }
    
    // Test sessionStorage
    try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        storage.sessionStorage = true;
    } catch (e) {
        // sessionStorage not available
    }
    
    // Test IndexedDB
    storage.indexedDB = !!window.indexedDB;
    
    // Test cookies
    storage.cookies = navigator.cookieEnabled;
    
    const trackingCapable = Object.values(storage).some(v => v);
    
    return {
        status: trackingCapable ? 'leak' : 'safe',
        summary: trackingCapable ? 'Storage APIs available' : 'Storage APIs blocked',
        details: storage
    };
};

// 16. Media Devices
export const testMediaDevices = async () => {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return {
                status: 'safe',
                summary: 'Media Devices API not supported',
                details: { supported: false }
            };
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const grouped = {
            audioinput: devices.filter(d => d.kind === 'audioinput').length,
            audiooutput: devices.filter(d => d.kind === 'audiooutput').length,
            videoinput: devices.filter(d => d.kind === 'videoinput').length
        };
        
        return {
            status: 'leak',
            summary: `${grouped.videoinput} cameras, ${grouped.audioinput} mics`,
            details: {
                supported: true,
                ...grouped,
                total: devices.length,
                canFingerprint: true
            }
        };
    } catch (error) {
        return {
            status: 'safe',
            summary: 'Media Devices blocked',
            details: { supported: true, blocked: true }
        };
    }
};

// 17. Touch Support
export const testTouchSupport = () => {
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const touchEvent = 'ontouchstart' in window;
    const touchEventSupported = window.TouchEvent !== undefined;
    
    const hasTouch = maxTouchPoints > 0 || touchEvent;
    
    return {
        status: 'leak',
        summary: hasTouch ? `Touch enabled (${maxTouchPoints} points)` : 'No touch support',
        details: {
            maxTouchPoints,
            touchEventSupported: touchEventSupported,
            onTouchStartSupported: touchEvent,
            hasTouch,
            note: 'Touch support helps identify device type'
        }
    };
};

// 18. Ad Blocker Detection
export const testAdBlocker = async () => {
    try {
        // Try to create a bait element that ad blockers typically block
        const bait = document.createElement('div');
        bait.className = 'adsbox ad-banner ad-placement pub_300x250 textAd';
        bait.style.cssText = 'position: absolute; top: -10px; left: -10px; width: 1px; height: 1px;';
        bait.innerHTML = '&nbsp;';
        document.body.appendChild(bait);
        
        // Wait a moment for ad blocker to act
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const blocked = bait.offsetHeight === 0 || 
                       bait.offsetWidth === 0 || 
                       bait.clientHeight === 0 ||
                       getComputedStyle(bait).display === 'none' ||
                       getComputedStyle(bait).visibility === 'hidden';
        
        document.body.removeChild(bait);
        
        return {
            status: blocked ? 'safe' : 'leak',
            summary: blocked ? 'Ad blocker detected' : 'No ad blocker detected',
            details: {
                adBlockerDetected: blocked,
                note: blocked 
                    ? 'Using an ad blocker helps protect privacy but can make you more unique'
                    : 'Consider using an ad blocker like uBlock Origin'
            }
        };
    } catch (error) {
        return {
            status: 'unknown',
            summary: 'Could not test',
            details: { error: error.message }
        };
    }
};

// 19. HTTP Headers Info (what can be inferred)
export const testHttpHeaders = () => {
    // We can't directly access HTTP headers from JS, but we can infer some
    const acceptLanguage = navigator.languages ? navigator.languages.join(', ') : navigator.language;
    const encoding = 'gzip, deflate, br'; // Standard modern browsers
    
    return {
        status: 'leak',
        summary: `Language: ${navigator.language}`,
        details: {
            acceptLanguage,
            inferredAccept: 'text/html, application/xhtml+xml, */*',
            inferredEncoding: encoding,
            connection: 'keep-alive',
            note: 'HTTP headers are sent with every request and reveal browser preferences'
        }
    };
};

// Run all tests in parallel with timeout protection
export const runAllTests = async () => {
    const tests = [
        { id: 'ip', name: 'IP Address', icon: 'globe', test: testIPAddress },
        { id: 'webrtc', name: 'WebRTC', icon: 'video', test: testWebRTC },
        { id: 'canvas', name: 'Canvas Fingerprint', icon: 'palette', test: testCanvas },
        { id: 'webgl', name: 'WebGL', icon: 'cpu', test: testWebGL },
        { id: 'javascript', name: 'Browser Info', icon: 'code', test: testJavaScript },
        { id: 'screen', name: 'Screen Info', icon: 'monitor', test: testScreen },
        { id: 'fonts', name: 'Font Detection', icon: 'type', test: testFonts },
        { id: 'audio', name: 'Audio Fingerprint', icon: 'music', test: testAudio },
        { id: 'geolocation', name: 'Geolocation', icon: 'mapPin', test: testGeolocation },
        { id: 'timezone', name: 'Timezone', icon: 'clock', test: testTimezone },
        { id: 'dnt', name: 'Do Not Track', icon: 'eyeOff', test: testDoNotTrack },
        { id: 'battery', name: 'Battery Status', icon: 'battery', test: testBattery },
        { id: 'network', name: 'Network Info', icon: 'wifi', test: testNetwork },
        { id: 'clientHints', name: 'Client Hints', icon: 'info', test: testClientHints },
        { id: 'storage', name: 'Storage APIs', icon: 'database', test: testStorage },
        { id: 'media', name: 'Media Devices', icon: 'camera', test: testMediaDevices },
        { id: 'touch', name: 'Touch Support', icon: 'hand', test: testTouchSupport },
        { id: 'adBlocker', name: 'Ad Blocker', icon: 'shield', test: testAdBlocker },
        { id: 'httpHeaders', name: 'HTTP Headers', icon: 'fileText', test: testHttpHeaders }
    ];
    
    // Helper to run test with timeout
    const runWithTimeout = async (test, timeout = 5000) => {
        try {
            const result = await Promise.race([
                test.test(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), timeout)
                )
            ]);
            return {
                ...result,
                name: test.name,
                icon: test.icon
            };
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
    
    // Run all tests in parallel
    const resultsArray = await Promise.all(
        tests.map(test => runWithTimeout(test))
    );
    
    // Convert to object
    const results = {};
    tests.forEach((test, index) => {
        results[test.id] = resultsArray[index];
    });
    
    return results;
};
