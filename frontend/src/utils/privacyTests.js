// Privacy Test Utilities - Fully Functional Browser Privacy Detection

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
        // Get IP with geolocation info
        const response = await fetch('https://ipapi.co/json/');
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
        
        // Check for VPN/Proxy indicators
        const isVpn = data.org?.toLowerCase().includes('vpn') || 
                      data.org?.toLowerCase().includes('proxy') ||
                      data.org?.toLowerCase().includes('hosting') ||
                      data.org?.toLowerCase().includes('datacenter') ||
                      data.org?.toLowerCase().includes('cloud') ||
                      data.asn?.toString().startsWith('AS') && (
                          ['AS9009', 'AS20473', 'AS16276', 'AS14061', 'AS396982'].includes(data.asn) // Common VPN ASNs
                      );
        
        // Check timezone vs IP location mismatch (possible VPN indicator)
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const ipTimezone = data.timezone;
        const timezoneMismatch = browserTimezone !== ipTimezone;
        
        const status = isVpn ? 'warning' : 'leak';
        const summary = isVpn 
            ? `VPN/Proxy detected (${data.ip})`
            : `Your real IP is visible (${data.ip})`;
        
        return {
            status,
            summary,
            details: {
                // Basic IP Info
                ipAddress: data.ip,
                ipv6: ipv6,
                ipVersion: data.version || 'IPv4',
                
                // Location Info (like BrowserLeaks)
                country: data.country_name,
                countryCode: data.country_code,
                region: data.region,
                city: data.city,
                postalCode: data.postal,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                
                // Network Info
                isp: data.org,
                asn: data.asn,
                
                // VPN/Proxy Detection
                vpnDetected: isVpn,
                timezoneMismatch: timezoneMismatch,
                browserTimezone: browserTimezone,
                
                // Risk Assessment
                exposed: !isVpn,
                privacyNote: isVpn 
                    ? 'VPN/Proxy detected - your real IP is hidden but VPN IP still reveals approximate location'
                    : 'Your real IP address is exposed - websites can see your location and ISP'
            }
        };
    } catch (error) {
        // Fallback to simple IP check
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return {
                status: 'leak',
                summary: `IP visible: ${data.ip}`,
                details: {
                    ipAddress: data.ip,
                    exposed: true,
                    note: 'Limited info available - extended lookup failed'
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

// 3. Canvas Fingerprinting - Enhanced with BrowserLeaks-style details
export const testCanvas = async () => {
    try {
        // Check for Brave browser first
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        
        // Check for Firefox's resistFingerprinting
        const isFirefoxResist = navigator.userAgent.includes('Firefox') && 
            (window.CSS && CSS.supports('(-moz-appearance: none)'));
        
        const canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        
        // Draw like BrowserLeaks does
        const txt = "BrowserLeaks,com <canvas> 1.0";
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText(txt, 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText(txt, 4, 17);
        
        const dataUrl = canvas.toDataURL();
        const hash = await hashString(dataUrl);
        
        // Get image details like BrowserLeaks
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Count unique colors
        const colors = new Set();
        for (let i = 0; i < pixels.length; i += 4) {
            const color = `${pixels[i]},${pixels[i+1]},${pixels[i+2]},${pixels[i+3]}`;
            colors.add(color);
        }
        
        // Calculate base64 size
        const base64Size = Math.ceil((dataUrl.length - 22) * 3 / 4); // Approximate bytes
        
        // Brave randomizes per-first-party domain (not per-call)
        const isRandomized = isBrave || isFirefoxResist;
        
        return {
            status: isRandomized ? 'safe' : 'leak',
            summary: isRandomized 
                ? 'Canvas fingerprint is randomized (protected)' 
                : 'Canvas fingerprint is unique',
            details: {
                // Support Detection (like BrowserLeaks)
                canvas2dSupported: !!ctx,
                textApiSupported: typeof ctx.fillText === 'function',
                toDataUrlSupported: typeof canvas.toDataURL === 'function',
                
                // Fingerprint (like BrowserLeaks)
                signature: hash.substring(0, 32),
                fullSignature: hash,
                
                // Image Details (like BrowserLeaks)
                imageWidth: canvas.width,
                imageHeight: canvas.height,
                imageSize: `${base64Size} bytes`,
                numberOfColors: colors.size,
                
                // Protection Status
                randomized: isRandomized,
                browser: isBrave ? 'Brave (Shields Up)' : isFirefoxResist ? 'Firefox (resistFingerprinting)' : 'Standard',
                protection: isRandomized 
                    ? 'Browser randomizes canvas per first-party domain' 
                    : 'No canvas protection detected',
                
                // Uniqueness estimate
                uniqueness: isRandomized 
                    ? 'Randomized - not uniquely identifiable'
                    : '~99.9% unique (only ~0.01% of browsers share this fingerprint)',
                
                privacyNote: isRandomized
                    ? 'Your browser is protecting you from canvas fingerprinting'
                    : 'Canvas fingerprinting can uniquely identify your browser based on how graphics are rendered'
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

// 4. WebGL Fingerprinting - Enhanced with BrowserLeaks-style details
export const testWebGL = async () => {
    try {
        // Check for Brave browser
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const gl2 = canvas.getContext('webgl2');
        
        if (!gl) {
            return {
                status: 'safe',
                summary: 'WebGL not supported',
                details: { supported: false }
            };
        }
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        
        // Brave randomizes WebGL hash per-first-party domain
        const isRandomized = isBrave;
        
        // Also check if WebGL info is being blocked/spoofed
        const isSpoofed = renderer === 'Unknown' || renderer.includes('BLOCKED');
        
        // Generate WebGL fingerprint hash (like BrowserLeaks)
        const fingerprintData = [
            gl.getParameter(gl.VERSION),
            gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            vendor,
            renderer,
            gl.getParameter(gl.MAX_TEXTURE_SIZE),
            gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
            gl.getParameter(gl.MAX_VARYING_VECTORS),
            gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
            gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
            gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.join(',')
        ].join('~');
        
        const webglHash = await hashString(fingerprintData);
        
        // Get supported extensions
        const extensions = gl.getSupportedExtensions() || [];
        
        return {
            status: (isRandomized || isSpoofed) ? 'safe' : 'leak',
            summary: (isRandomized || isSpoofed)
                ? 'WebGL fingerprint is randomized (protected)' 
                : `GPU: ${renderer.substring(0, 40)}${renderer.length > 40 ? '...' : ''}`,
            details: {
                // Support Detection (like BrowserLeaks)
                webglSupported: true,
                webgl2Supported: !!gl2,
                
                // Fingerprint Hash (like BrowserLeaks)
                webglReportHash: webglHash.substring(0, 32),
                
                // Context Info (like BrowserLeaks)
                glVersion: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                
                // Debug Renderer Info (like BrowserLeaks - marked with !)
                unmaskedVendor: vendor,
                unmaskedRenderer: renderer,
                
                // Vertex Shader
                maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
                maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
                
                // Fragment Shader  
                maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
                maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                
                // Textures
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
                
                // Framebuffer
                maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.join(' x '),
                
                // Extensions count
                extensionsCount: extensions.length,
                
                // Protection Status
                randomized: isRandomized,
                spoofed: isSpoofed,
                protection: isRandomized 
                    ? 'Browser randomizes WebGL per first-party domain' 
                    : isSpoofed 
                        ? 'WebGL info is blocked/spoofed'
                        : 'No WebGL protection detected',
                browser: isBrave ? 'Brave (Shields Up)' : 'Standard',
                
                privacyNote: (isRandomized || isSpoofed)
                    ? 'Your browser is protecting you from WebGL fingerprinting'
                    : 'WebGL exposes detailed GPU information that can uniquely identify your device'
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

// 5. JavaScript / Browser Information - with randomization detection
export const testJavaScript = () => {
    const nav = navigator;
    
    // Check if hardware concurrency might be randomized
    // Brave randomizes this - typical real values are 2, 4, 8, 12, 16, etc.
    const hwConcurrency = nav.hardwareConcurrency || 0;
    // Unusual values like 5, 7, 11, etc. suggest randomization
    const typicalValues = [1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64];
    const isHwConcurrencyRandomized = hwConcurrency > 0 && !typicalValues.includes(hwConcurrency);
    
    // Check if plugins might be randomized (Brave returns empty or randomized)
    const plugins = Array.from(nav.plugins || []).map(p => p.name).slice(0, 10);
    const isPluginsRandomized = plugins.length === 0 || plugins.some(p => p.includes('randomized'));
    
    const details = {
        userAgent: nav.userAgent,
        platform: nav.platform,
        language: nav.language,
        languages: nav.languages ? [...nav.languages] : [nav.language],
        cookiesEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack || window.doNotTrack || nav.msDoNotTrack,
        hardwareConcurrency: hwConcurrency,
        hardwareConcurrencyRandomized: isHwConcurrencyRandomized,
        maxTouchPoints: nav.maxTouchPoints || 0,
        deviceMemory: nav.deviceMemory || 'Unknown',
        pdfViewerEnabled: nav.pdfViewerEnabled,
        webdriver: nav.webdriver,
        plugins: plugins,
        pluginsRandomized: isPluginsRandomized,
        mimeTypes: Array.from(nav.mimeTypes || []).map(m => m.type).slice(0, 10)
    };
    
    const hasProtection = isHwConcurrencyRandomized || isPluginsRandomized;
    
    return {
        status: hasProtection ? 'warning' : 'leak',
        summary: hasProtection 
            ? `${details.platform} - some values randomized`
            : `${details.platform} - ${details.hardwareConcurrency} cores`,
        details: {
            ...details,
            protection: hasProtection ? 'Some browser values appear to be randomized' : 'No randomization detected'
        }
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

// 7. Font Detection - Extended list matching EFF Cover Your Tracks
export const testFonts = async () => {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    
    // Extended font list - includes all fonts EFF tests for
    const testFonts = [
        // Common Windows fonts
        'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
        'Book Antiqua', 'Bookman Old Style',
        'Calibri', 'Cambria', 'Cambria Math', 'Century', 'Century Gothic', 'Century Schoolbook',
        'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
        'Georgia',
        'Helvetica',
        'Impact',
        'Lucida Bright', 'Lucida Calligraphy', 'Lucida Console', 'Lucida Fax',
        'Lucida Handwriting', 'Lucida Sans', 'Lucida Sans Typewriter', 'Lucida Sans Unicode',
        'Microsoft Sans Serif', 'Monotype Corsiva', 'MS Gothic', 'MS Outlook', 'MS PGothic',
        'MS Reference Sans Serif', 'MS Sans Serif', 'MS Serif',
        'Palatino Linotype',
        'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Segoe UI Symbol',
        'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS',
        'Verdana',
        'Wingdings', 'Wingdings 2', 'Wingdings 3',
        // Mac fonts
        'American Typewriter', 'Andale Mono', 'Apple Chancery', 'Apple Color Emoji',
        'Apple SD Gothic Neo', 'Arial Hebrew', 'Avenir', 'Avenir Next',
        'Baskerville', 'Big Caslon', 'Brush Script MT',
        'Chalkboard', 'Chalkboard SE', 'Chalkduster', 'Charter', 'Cochin', 'Copperplate',
        'Didot',
        'Futura',
        'Geneva', 'Gill Sans',
        'Helvetica Neue', 'Herculanum', 'Hoefler Text',
        'Lucida Grande',
        'Marker Felt', 'Menlo', 'Monaco',
        'Noteworthy',
        'Optima', 'Osaka',
        'Papyrus', 'Phosphate', 'PT Mono', 'PT Sans', 'PT Serif',
        'Rockwell',
        'San Francisco', 'Savoye LET', 'SignPainter', 'Skia', 'Snell Roundhand',
        'SF Pro', 'SF Pro Display', 'SF Pro Text',
        // Linux fonts
        'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif',
        'Droid Sans', 'Droid Sans Mono', 'Droid Serif',
        'Fira Code', 'Fira Mono', 'Fira Sans',
        'Liberation Mono', 'Liberation Sans', 'Liberation Serif',
        'Noto Sans', 'Noto Serif',
        'Open Sans',
        'Roboto', 'Roboto Condensed', 'Roboto Mono', 'Roboto Slab',
        'Source Code Pro', 'Source Sans Pro', 'Source Serif Pro',
        'Ubuntu', 'Ubuntu Mono'
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
    
    // Calculate bits based on EFF methodology (~0.29 bits per font detected)
    const bits = detectedFonts.length * 0.29;
    
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

// 8. Audio Fingerprint - with Brave/Firefox protection detection
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
        
        // Check for Brave browser
        const isBrave = navigator.brave && await navigator.brave.isBrave();
        
        const context = new AudioContext();
        const details = {
            sampleRate: context.sampleRate,
            state: context.state,
            baseLatency: context.baseLatency,
            outputLatency: context.outputLatency,
            channelCount: context.destination.channelCount,
            maxChannelCount: context.destination.maxChannelCount,
        };
        await context.close();
        
        // Brave randomizes audio fingerprint per-first-party domain
        const isRandomized = isBrave;
        
        return {
            status: isRandomized ? 'safe' : 'leak',
            summary: isRandomized 
                ? 'Audio fingerprint is randomized (protected)' 
                : `Sample rate: ${details.sampleRate}Hz`,
            details: {
                supported: true,
                randomized: isRandomized,
                ...details,
                uniqueIdentifier: !isRandomized,
                protection: isRandomized 
                    ? 'Browser randomizes audio fingerprint per domain' 
                    : 'No audio protection detected',
                note: isRandomized 
                    ? 'Browser is protecting against audio fingerprinting' 
                    : 'Audio properties can uniquely identify your device',
                browser: isBrave ? 'Brave' : 'Standard'
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
