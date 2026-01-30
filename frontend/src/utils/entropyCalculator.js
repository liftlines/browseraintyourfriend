// Entropy and Uniqueness Calculations
// Inspired by EFF Cover Your Tracks
// Uses more accurate bit values based on EFF's methodology

export const calculateEntropy = (results) => {
    const entropyMap = {
        // IP Address - ~18 bits based on global IP space usage
        ip: {
            baseBits: (details) => details?.exposed ? 18 : 0,
            description: 'Your IP address is highly identifying',
            leakImpact: 'high'
        },
        
        // WebRTC - Can leak local IPs even through VPN
        webrtc: {
            baseBits: (details) => {
                if (details?.leaking === false) return 0;
                return details?.localIPs?.length > 0 ? 8 : 0;
            },
            description: 'WebRTC can reveal local network information',
            leakImpact: 'high'
        },
        
        // Canvas - ~10 bits when unique, ~1.27 bits when randomized (EFF value)
        canvas: {
            baseBits: (details) => details?.randomized ? 1.27 : 10,
            description: 'Canvas rendering varies by hardware/software',
            leakImpact: 'high'
        },
        
        // WebGL - ~7.2 bits for renderer info, ~1.44 bits when randomized (EFF value)
        webgl: {
            baseBits: (details) => (details?.randomized || details?.spoofed) ? 1.44 : 7.2,
            description: 'GPU and driver information is identifying',
            leakImpact: 'medium'
        },
        
        // Browser Info - User agent ~3.5 bits, platform ~1.5 bits
        javascript: {
            baseBits: (details) => {
                let bits = 3.5; // User agent
                bits += 1.5; // Platform
                if (details?.hardwareConcurrencyRandomized) {
                    bits += 2.2; // Randomized HW concurrency still adds some
                } else {
                    bits += 2.1; // Normal HW concurrency
                }
                return bits;
            },
            description: 'Browser and OS details narrow down users',
            leakImpact: 'medium'
        },
        
        // Screen - ~6 bits based on EFF data
        screen: {
            baseBits: 6.2,
            description: 'Screen resolution helps identify device type',
            leakImpact: 'medium'
        },
        
        // Fonts - Variable based on count, EFF shows ~9 bits for 32 fonts
        fonts: {
            baseBits: (details) => {
                const count = details?.count || 0;
                // Roughly 0.3 bits per unique font detected
                return Math.min(count * 0.3, 10);
            },
            description: 'Installed fonts vary significantly between systems',
            leakImpact: 'high'
        },
        
        // Audio - ~2.15 bits when unique, ~1.62 bits when randomized (EFF value)
        audio: {
            baseBits: (details) => details?.randomized ? 1.62 : 2.15,
            description: 'Audio processing varies by hardware',
            leakImpact: 'low'
        },
        
        // Geolocation - Only counts if permission granted
        geolocation: {
            baseBits: (details) => details?.permissionState === 'granted' ? 15 : 0,
            description: 'Precise location is highly identifying',
            leakImpact: 'high'
        },
        
        // Timezone - ~6.5 bits based on EFF data
        timezone: {
            baseBits: 6.5,
            description: 'Timezone narrows location to a region',
            leakImpact: 'medium'
        },
        
        // DNT - ~1.7 bits when enabled (makes you more unique)
        dnt: {
            baseBits: (details) => details?.dntEnabled ? 1.7 : 0,
            description: 'DNT header ironically makes you more unique',
            leakImpact: 'low'
        },
        
        // Battery - ~0.5 bits when available
        battery: {
            baseBits: (details) => details?.supported && !details?.blocked ? 0.5 : 0,
            description: 'Battery level can correlate browsing sessions',
            leakImpact: 'low'
        },
        
        // Network - ~0.3 bits when available
        network: {
            baseBits: (details) => details?.supported ? 0.3 : 0,
            description: 'Connection type helps identify device',
            leakImpact: 'low'
        },
        
        // Client Hints - ~2 bits when available
        clientHints: {
            baseBits: (details) => details?.supported ? 2 : 0,
            description: 'Client hints provide detailed browser info',
            leakImpact: 'medium'
        },
        
        // Storage - ~0.3 bits (supercookie test)
        storage: {
            baseBits: 0.26,
            description: 'Storage APIs enable persistent tracking',
            leakImpact: 'low'
        },
        
        // Media Devices - ~1 bit
        media: {
            baseBits: (details) => details?.supported && !details?.blocked ? 1 : 0,
            description: 'Device configuration is identifying',
            leakImpact: 'low'
        },
        
        // Touch Support - ~0.9 bits
        touch: {
            baseBits: 0.92,
            description: 'Touch support reveals device type',
            leakImpact: 'low'
        },
        
        // Ad Blocker - ~0 bits (very common)
        adBlocker: {
            baseBits: 0,
            description: 'Ad blocker usage is common',
            leakImpact: 'low'
        },
        
        // HTTP Headers - ~2.7 bits for accept headers
        httpHeaders: {
            baseBits: 2.74,
            description: 'HTTP headers reveal browser preferences',
            leakImpact: 'low'
        }
    };
    
    let totalBits = 0;
    let fingerprintBits = 0; // Comparable to EFF (excludes server-side data like IP)
    const breakdown = {};
    
    Object.entries(results).forEach(([key, result]) => {
        if (!entropyMap[key]) return;
        
        const config = entropyMap[key];
        let bits = 0;
        
        // Only count bits if the test shows a leak or warning
        // For 'safe' status, it means the browser is protected
        if (result.status === 'leak' || result.status === 'warning') {
            if (typeof config.baseBits === 'function') {
                bits = config.baseBits(result.details);
            } else {
                bits = config.baseBits;
            }
        } else if (result.status === 'safe' && result.details?.randomized) {
            // Even randomized values add some bits (reduced)
            if (typeof config.baseBits === 'function') {
                bits = Math.max(config.baseBits(result.details) * 0.15, 0); // 15% of original
            }
        }
        
        breakdown[key] = {
            bits: Math.round(bits * 100) / 100,
            description: config.description,
            impact: config.leakImpact,
            protected: result.status === 'safe'
        };
        
        totalBits += bits;
        
        // Fingerprint bits excludes IP (server-side data) for EFF comparison
        if (key !== 'ip') {
            fingerprintBits += bits;
        }
    });
    
    return {
        totalBits: Math.round(totalBits * 100) / 100,
        fingerprintBits: Math.round(fingerprintBits * 100) / 100, // EFF-comparable
        breakdown,
        uniqueness: getUniquenessLevel(fingerprintBits), // Use fingerprint bits for level
        usersWithSameFingerprint: estimateMatchingUsers(fingerprintBits)
    };
};

const getUniquenessLevel = (bits) => {
    if (bits >= 33) return { level: 'unique', label: 'Highly Identifiable', description: 'Your browser can be uniquely identified' };
    if (bits >= 20) return { level: 'rare', label: 'Easily Identifiable', description: 'Very few browsers share your fingerprint' };
    if (bits >= 15) return { level: 'uncommon', label: 'Somewhat Identifiable', description: 'Your fingerprint is fairly uncommon' };
    if (bits >= 10) return { level: 'common', label: 'Less Identifiable', description: 'Many browsers share similar fingerprints' };
    return { level: 'anonymous', label: 'Hard to Identify', description: 'Your browser blends in well with others' };
};

const estimateMatchingUsers = (bits) => {
    // Based on ~5 billion internet users and 2^bits uniqueness
    // We want to express this as "1 in X browsers" in simple terms
    const uniqueFingerprints = Math.pow(2, Math.min(bits, 50)); // Cap at 2^50 for display
    
    // Format large numbers in a readable way
    const formatNumber = (num) => {
        if (num >= 1000000000000000) return 'quadrillions';
        if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(0)} trillion`;
        if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} billion`;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)} million`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)} thousand`;
        return num.toFixed(0);
    };
    
    // For very high entropy (like 80 bits), just say unique
    if (bits >= 50) {
        return {
            ratio: Infinity,
            text: 'essentially unique worldwide',
            simple: 'Your browser is essentially unique - easily trackable',
            isGood: false
        };
    }
    
    if (bits >= 33) {
        return {
            ratio: uniqueFingerprints,
            text: `1 in ${formatNumber(uniqueFingerprints)} browsers`,
            simple: 'Your browser is essentially unique - easily trackable',
            isGood: false
        };
    }
    
    if (bits >= 20) {
        return {
            ratio: uniqueFingerprints,
            text: `1 in ${formatNumber(uniqueFingerprints)} browsers`,
            simple: 'Very few browsers look like yours - easy to track',
            isGood: false
        };
    }
    
    if (bits >= 15) {
        return {
            ratio: uniqueFingerprints,
            text: `1 in ${formatNumber(uniqueFingerprints)} browsers`,
            simple: 'Your browser stands out from most - trackable',
            isGood: false
        };
    }
    
    if (bits >= 10) {
        // Around 1000 matching browsers
        return {
            ratio: uniqueFingerprints,
            text: `1 in ${formatNumber(uniqueFingerprints)} browsers`,
            simple: 'Your browser looks like thousands of others - harder to track',
            isGood: true
        };
    }
    
    // Less than 10 bits - very common
    return {
        ratio: uniqueFingerprints,
        text: `1 in ${formatNumber(uniqueFingerprints)} browsers`,
        simple: 'Your browser looks like millions of others - very hard to track',
        isGood: true
    };
};

// Protection recommendations based on results
export const getRecommendations = (results, entropy) => {
    const recommendations = [];
    
    // High priority recommendations
    if (results.webrtc?.status === 'leak' && results.webrtc?.details?.localIPs?.length > 0) {
        recommendations.push({
            priority: 'high',
            title: 'Disable WebRTC',
            description: 'WebRTC is leaking your local IP addresses. Use a browser extension like WebRTC Leak Shield or disable WebRTC in browser settings.',
            link: 'https://browserleaks.com/webrtc#howto-disable-webrtc'
        });
    }
    
    if (results.canvas?.status === 'leak') {
        recommendations.push({
            priority: 'high',
            title: 'Use Canvas Fingerprint Protection',
            description: 'Consider using Brave browser or a canvas blocker extension. These can randomize canvas fingerprints.',
            link: 'https://brave.com/'
        });
    }
    
    if (results.dnt?.details?.dntEnabled === false && results.dnt?.details?.gpcEnabled === false) {
        recommendations.push({
            priority: 'medium',
            title: 'Enable Global Privacy Control',
            description: 'Enable GPC in your browser settings to signal tracking opt-out to websites.',
            link: 'https://globalprivacycontrol.org/'
        });
    }
    
    if (results.storage?.status === 'leak') {
        recommendations.push({
            priority: 'medium',
            title: 'Manage Storage and Cookies',
            description: 'Consider using browser settings to block third-party cookies or use containers.',
            link: null
        });
    }
    
    // General recommendations based on entropy
    if (entropy.totalBits > 25) {
        recommendations.push({
            priority: 'high',
            title: 'Consider a Privacy-Focused Browser',
            description: 'Browsers like Brave, Firefox with strict settings, or Tor Browser can significantly reduce fingerprinting.',
            link: 'https://www.privacyguides.org/en/desktop-browsers/'
        });
    }
    
    // Add VPN recommendation if IP is exposed
    if (results.ip?.status === 'leak') {
        recommendations.push({
            priority: 'medium',
            title: 'Use a VPN or Tor',
            description: 'A VPN can mask your real IP address. For maximum privacy, consider Tor Browser.',
            link: 'https://www.privacyguides.org/en/vpn/'
        });
    }
    
    return recommendations.sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.priority] - priority[b.priority];
    });
};

// Get explanation for each test
export const getTestExplanation = (testId) => {
    const explanations = {
        ip: {
            what: "Your IP address is like your home address on the internet. Every website you visit can see it.",
            risk: "Websites can determine your approximate location, ISP, and potentially identify you across sessions.",
            protect: "Use a VPN or Tor to mask your real IP address."
        },
        webrtc: {
            what: "WebRTC is a technology for real-time communication in browsers (video calls, etc.).",
            risk: "Even with a VPN, WebRTC can leak your real local and public IP addresses.",
            protect: "Disable WebRTC in browser settings or use an extension to block it."
        },
        canvas: {
            what: "Canvas fingerprinting draws invisible graphics to identify your unique rendering.",
            risk: "The way your browser renders graphics is unique to your hardware/software combination.",
            protect: "Use Brave browser or canvas-blocking extensions to randomize this fingerprint."
        },
        webgl: {
            what: "WebGL provides information about your graphics card and driver.",
            risk: "Your GPU model and driver version create a relatively unique identifier.",
            protect: "Some browsers like Brave can spoof WebGL information."
        },
        javascript: {
            what: "JavaScript can access many details about your browser and system.",
            risk: "User agent, platform, plugins, and more create a detailed profile.",
            protect: "Use browser extensions to spoof or block some of this information."
        },
        screen: {
            what: "Your screen resolution and display settings are visible to websites.",
            risk: "Unusual screen sizes or configurations can help identify your device.",
            protect: "Using common resolutions reduces uniqueness."
        },
        fonts: {
            what: "Websites can detect which fonts are installed on your system.",
            risk: "Your font collection is often unique, especially with custom fonts installed.",
            protect: "Firefox and some extensions can limit font enumeration."
        },
        audio: {
            what: "Audio processing characteristics vary between devices.",
            risk: "The way your device processes audio creates a fingerprint.",
            protect: "Brave browser provides audio fingerprint protection."
        },
        geolocation: {
            what: "The Geolocation API can request your precise GPS coordinates.",
            risk: "If granted, websites know your exact physical location.",
            protect: "Deny location requests unless absolutely necessary."
        },
        timezone: {
            what: "Your system timezone is visible to websites.",
            risk: "Timezone reveals your general geographic region and adds ~6 bits of identifying information.",
            protect: "Tor Browser normalizes timezone to UTC."
        },
        dnt: {
            what: "Do Not Track is a browser setting requesting sites not to track you.",
            risk: "Ironically, enabling DNT can make you more unique since few users enable it.",
            protect: "Consider using Global Privacy Control (GPC) instead or in addition."
        },
        battery: {
            what: "The Battery API exposes your device's charge level and status.",
            risk: "Battery state can correlate browsing sessions and identify devices.",
            protect: "Most modern browsers have restricted this API."
        },
        network: {
            what: "Network information includes connection type and speed.",
            risk: "Connection details help identify your network environment.",
            protect: "Limited protection available; use VPN for network-level privacy."
        },
        clientHints: {
            what: "Client Hints are a modern replacement for user-agent strings.",
            risk: "They provide detailed browser and device information in a structured format.",
            protect: "Some browsers allow limiting client hints headers."
        },
        storage: {
            what: "Storage APIs (localStorage, cookies, IndexedDB) allow persistent data.",
            risk: "Trackers use storage to maintain identifiers across sessions.",
            protect: "Clear storage regularly or use containers/private browsing."
        },
        media: {
            what: "Websites can enumerate your cameras and microphones.",
            risk: "Device count and types contribute to fingerprinting.",
            protect: "Deny media access when not needed."
        },
        touch: {
            what: "Touch support indicates whether your device has a touchscreen.",
            risk: "This helps trackers determine your device type (mobile, tablet, desktop).",
            protect: "Limited protection available - this is tied to your hardware."
        },
        adBlocker: {
            what: "Websites can detect if you're using an ad blocker.",
            risk: "While ad blockers improve privacy, their detection adds to your fingerprint.",
            protect: "Keep using an ad blocker - the privacy benefits outweigh fingerprinting concerns."
        },
        httpHeaders: {
            what: "HTTP headers are sent with every request, revealing browser preferences.",
            risk: "Language, encoding preferences, and other headers help identify you.",
            protect: "Browser language is hard to spoof without breaking usability."
        }
    };
    
    return explanations[testId] || {
        what: "This test checks a browser feature that can be used for tracking.",
        risk: "The information exposed can contribute to browser fingerprinting.",
        protect: "Consider using a privacy-focused browser."
    };
};
