// Entropy and Uniqueness Calculations
// Inspired by EFF Cover Your Tracks

// Approximate entropy bits based on how unique each value is
// Higher bits = more identifying = more unique

export const calculateEntropy = (results) => {
    const entropyMap = {
        // IP Address - Very unique (typically 32 bits for IPv4)
        ip: {
            baseBits: 18,
            description: 'Your IP address is highly identifying',
            leakImpact: 'high'
        },
        
        // WebRTC - Can leak local IPs even through VPN
        webrtc: {
            baseBits: (details) => details?.localIPs?.length > 0 ? 12 : 0,
            description: 'WebRTC can reveal local network information',
            leakImpact: 'high'
        },
        
        // Canvas - Very unique fingerprint
        canvas: {
            baseBits: 10,
            description: 'Canvas rendering varies by hardware/software',
            leakImpact: 'high'
        },
        
        // WebGL - GPU-specific
        webgl: {
            baseBits: 8,
            description: 'GPU and driver information is identifying',
            leakImpact: 'medium'
        },
        
        // Browser Info - Moderately unique
        javascript: {
            baseBits: 6,
            description: 'Browser and OS details narrow down users',
            leakImpact: 'medium'
        },
        
        // Screen - Less unique but contributes
        screen: {
            baseBits: 4,
            description: 'Screen resolution helps identify device type',
            leakImpact: 'low'
        },
        
        // Fonts - Can be very unique
        fonts: {
            baseBits: (details) => {
                const count = details?.count || 0;
                if (count > 20) return 10;
                if (count > 10) return 6;
                return 3;
            },
            description: 'Installed fonts vary significantly between systems',
            leakImpact: 'high'
        },
        
        // Audio - Unique fingerprint
        audio: {
            baseBits: 6,
            description: 'Audio processing varies by hardware',
            leakImpact: 'medium'
        },
        
        // Geolocation - If granted, very identifying
        geolocation: {
            baseBits: (details) => details?.permissionState === 'granted' ? 15 : 0,
            description: 'Precise location is highly identifying',
            leakImpact: 'high'
        },
        
        // Timezone - Somewhat identifying (based on EFF ~6 bits)
        timezone: {
            baseBits: 6,
            description: 'Timezone narrows location to a region',
            leakImpact: 'medium'
        },
        
        // DNT - Actually adds uniqueness since most don't enable it
        dnt: {
            baseBits: (details) => details?.dntEnabled ? 2 : 0,
            description: 'DNT header ironically makes you more unique',
            leakImpact: 'low'
        },
        
        // Battery - Can be identifying
        battery: {
            baseBits: (details) => details?.supported ? 3 : 0,
            description: 'Battery level can correlate browsing sessions',
            leakImpact: 'low'
        },
        
        // Network - Moderately identifying
        network: {
            baseBits: (details) => details?.supported ? 3 : 0,
            description: 'Connection type helps identify device',
            leakImpact: 'low'
        },
        
        // Client Hints - Modern fingerprinting
        clientHints: {
            baseBits: (details) => details?.supported ? 5 : 0,
            description: 'Client hints provide detailed browser info',
            leakImpact: 'medium'
        },
        
        // Storage - Enables tracking
        storage: {
            baseBits: 2,
            description: 'Storage APIs enable persistent tracking',
            leakImpact: 'medium'
        },
        
        // Media Devices - Can be unique
        media: {
            baseBits: (details) => {
                const total = (details?.audioinput || 0) + (details?.videoinput || 0);
                return total > 2 ? 4 : 2;
            },
            description: 'Device configuration is identifying',
            leakImpact: 'low'
        },
        
        // Touch Support - Device type indicator
        touch: {
            baseBits: 1,
            description: 'Touch support reveals device type',
            leakImpact: 'low'
        },
        
        // Ad Blocker - Makes you more unique if detected
        adBlocker: {
            baseBits: (details) => details?.adBlockerDetected ? 2 : 0,
            description: 'Ad blocker usage is somewhat rare',
            leakImpact: 'low'
        },
        
        // HTTP Headers - Language and accept headers
        httpHeaders: {
            baseBits: 3,
            description: 'HTTP headers reveal browser preferences',
            leakImpact: 'low'
        }
    };
    
    let totalBits = 0;
    const breakdown = {};
    
    Object.entries(results).forEach(([key, result]) => {
        if (!entropyMap[key]) return;
        
        const config = entropyMap[key];
        let bits = 0;
        
        if (result.status === 'leak' || result.status === 'warning') {
            if (typeof config.baseBits === 'function') {
                bits = config.baseBits(result.details);
            } else {
                bits = config.baseBits;
            }
        }
        
        breakdown[key] = {
            bits,
            description: config.description,
            impact: config.leakImpact
        };
        
        totalBits += bits;
    });
    
    return {
        totalBits,
        breakdown,
        uniqueness: getUniquenessLevel(totalBits),
        usersWithSameFingerprint: estimateMatchingUsers(totalBits)
    };
};

const getUniquenessLevel = (bits) => {
    if (bits >= 33) return { level: 'unique', label: 'Unique', description: 'Your browser has a unique fingerprint' };
    if (bits >= 20) return { level: 'rare', label: 'Nearly Unique', description: 'Only a handful of browsers match yours' };
    if (bits >= 15) return { level: 'uncommon', label: 'Uncommon', description: 'Your fingerprint is somewhat rare' };
    if (bits >= 10) return { level: 'common', label: 'Common', description: 'Many browsers share similar fingerprints' };
    return { level: 'anonymous', label: 'Anonymous', description: 'Your browser blends in with others' };
};

const estimateMatchingUsers = (bits) => {
    // Rough estimate: 2^bits represents uniqueness
    // With ~5 billion internet users, calculate probability
    const uniqueFingerprints = Math.pow(2, bits);
    const totalUsers = 5000000000; // 5 billion
    const matchingUsers = Math.max(1, Math.round(totalUsers / uniqueFingerprints));
    
    if (matchingUsers === 1) return 'unique among all browsers';
    if (matchingUsers < 100) return `1 in ${uniqueFingerprints.toLocaleString()} browsers`;
    if (matchingUsers < 10000) return `about ${matchingUsers.toLocaleString()} others`;
    if (matchingUsers < 1000000) return `about ${Math.round(matchingUsers / 1000)}K others`;
    return `about ${Math.round(matchingUsers / 1000000)}M others`;
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
            risk: "Timezone reveals your general geographic region.",
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
        }
    };
    
    return explanations[testId] || {
        what: "This test checks a browser feature that can be used for tracking.",
        risk: "The information exposed can contribute to browser fingerprinting.",
        protect: "Consider using a privacy-focused browser."
    };
};
