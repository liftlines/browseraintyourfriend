// Privacy Score Calculator
// Counts identifying items of information exposed by your browser

export const calculatePrivacyScore = (results) => {
    // Define what counts as an "item" of identifying information
    // Each item is something that can help identify/track you
    const itemsMap = {
        ip: {
            getItems: (details) => {
                if (!details) return 0;
                // VPN = protected, no items exposed
                if (details.vpnDetected) return 0;
                // Real IP exposed = 3 items (IP, location, ISP)
                return 3;
            },
            maxItems: 3,
            description: 'IP address, location, and ISP'
        },
        
        webrtc: {
            getItems: (details) => {
                if (!details) return 0;
                if (details.leaking === false) return 0;
                let items = 0;
                if (details.localIPs?.length > 0) items += 1; // Local IP leaked
                if (details.publicIPs?.length > 0) items += 1; // Public IP leaked
                return items;
            },
            maxItems: 2,
            description: 'Local and public IP addresses'
        },
        
        canvas: {
            getItems: (details) => {
                if (!details) return 0;
                // Randomized = protected
                if (details.randomized) return 0;
                // Unique canvas fingerprint = 1 item
                return 1;
            },
            maxItems: 1,
            description: 'Unique canvas fingerprint'
        },
        
        webgl: {
            getItems: (details) => {
                if (!details) return 0;
                if (details.randomized || details.spoofed) return 0;
                // GPU info exposed = 1 item
                return 1;
            },
            maxItems: 1,
            description: 'GPU and graphics driver info'
        },
        
        javascript: {
            getItems: (details) => {
                if (!details) return 0;
                let items = 0;
                if (details.userAgent) items += 1; // User agent
                if (details.platform) items += 1; // Platform
                if (details.hardwareConcurrency && !details.hardwareConcurrencyRandomized) items += 1; // CPU cores
                if (details.deviceMemory && details.deviceMemory !== 'Unknown') items += 1; // Memory
                return items;
            },
            maxItems: 4,
            description: 'Browser and system information'
        },
        
        screen: {
            getItems: (details) => {
                if (!details) return 0;
                // Screen resolution is always exposed = 1 item
                return 1;
            },
            maxItems: 1,
            description: 'Screen resolution and color depth'
        },
        
        fonts: {
            getItems: (details) => {
                if (!details) return 0;
                // Font list exposed = 1 item
                return details.count > 0 ? 1 : 0;
            },
            maxItems: 1,
            description: 'Installed fonts list'
        },
        
        audio: {
            getItems: (details) => {
                if (!details) return 0;
                if (details.randomized || details.blocked) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Audio processing fingerprint'
        },
        
        geolocation: {
            getItems: (details) => {
                if (!details) return 0;
                // Only counts if permission granted
                if (details.permissionState === 'granted') return 1;
                return 0;
            },
            maxItems: 1,
            description: 'Precise GPS location'
        },
        
        timezone: {
            getItems: (details) => {
                // Timezone is always visible = 1 item
                return 1;
            },
            maxItems: 1,
            description: 'Timezone and locale'
        },
        
        dnt: {
            getItems: (details) => {
                // DNT enabled actually helps privacy, but it's info that's sent
                // We count it as 0 items since it's privacy-positive
                return 0;
            },
            maxItems: 0,
            description: 'Do Not Track signal'
        },
        
        battery: {
            getItems: (details) => {
                if (!details) return 0;
                if (!details.supported || details.blocked) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Battery status'
        },
        
        network: {
            getItems: (details) => {
                if (!details) return 0;
                if (!details.supported) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Network connection type'
        },
        
        clientHints: {
            getItems: (details) => {
                if (!details) return 0;
                if (!details.supported) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Client hints headers'
        },
        
        storage: {
            getItems: (details) => {
                // Storage APIs enable tracking = 1 item
                return 1;
            },
            maxItems: 1,
            description: 'Storage and cookies'
        },
        
        media: {
            getItems: (details) => {
                if (!details) return 0;
                if (!details.supported || details.blocked) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Media devices count'
        },
        
        touch: {
            getItems: (details) => {
                // Touch support is always visible = 1 item
                return 1;
            },
            maxItems: 1,
            description: 'Touch support'
        },
        
        adBlocker: {
            getItems: (details) => {
                // Ad blocker detection = 1 item of info
                return 1;
            },
            maxItems: 1,
            description: 'Ad blocker detection'
        },
        
        httpHeaders: {
            getItems: (details) => {
                // HTTP headers always sent = 1 item
                return 1;
            },
            maxItems: 1,
            description: 'HTTP header preferences'
        }
    };
    
    let totalItems = 0;
    let maxPossibleItems = 0;
    let protectedItems = 0;
    const breakdown = {};
    
    Object.entries(results).forEach(([key, result]) => {
        if (!itemsMap[key]) return;
        
        const config = itemsMap[key];
        const items = config.getItems(result.details);
        
        breakdown[key] = {
            items: items,
            maxItems: config.maxItems,
            protected: items === 0 && config.maxItems > 0,
            description: config.description
        };
        
        totalItems += items;
        maxPossibleItems += config.maxItems;
        if (items === 0 && config.maxItems > 0) {
            protectedItems += config.maxItems;
        }
    });
    
    // Calculate privacy score (0-100, higher is better)
    const privacyScore = maxPossibleItems > 0 
        ? Math.round(((maxPossibleItems - totalItems) / maxPossibleItems) * 100)
        : 100;
    
    return {
        totalItems,
        maxPossibleItems,
        protectedItems,
        privacyScore,
        breakdown,
        assessment: getAssessment(totalItems, privacyScore),
        trackability: getTrackability(totalItems)
    };
};

const getAssessment = (items, score) => {
    if (score >= 80) {
        return {
            level: 'good',
            label: 'Well Protected',
            description: 'Your browser reveals minimal identifying information'
        };
    }
    if (score >= 60) {
        return {
            level: 'moderate',
            label: 'Moderately Protected',
            description: 'Some identifying information is exposed'
        };
    }
    if (score >= 40) {
        return {
            level: 'poor',
            label: 'Poorly Protected',
            description: 'Significant identifying information is exposed'
        };
    }
    return {
        level: 'bad',
        label: 'Not Protected',
        description: 'Most identifying information is exposed'
    };
};

const getTrackability = (items) => {
    // Simple explanation of how trackable you are
    if (items <= 3) {
        return {
            level: 'low',
            message: 'Hard to track - you blend in with many other users',
            detail: `Only ${items} identifying items exposed`
        };
    }
    if (items <= 8) {
        return {
            level: 'medium',
            message: 'Moderately trackable - some unique characteristics visible',
            detail: `${items} identifying items exposed`
        };
    }
    if (items <= 15) {
        return {
            level: 'high',
            message: 'Easily trackable - many unique characteristics visible',
            detail: `${items} identifying items exposed`
        };
    }
    return {
        level: 'very-high',
        message: 'Very easily trackable - your browser has many unique identifiers',
        detail: `${items} identifying items exposed`
    };
};

// Protection recommendations based on results
export const getRecommendations = (results, privacyData) => {
    const recommendations = [];
    
    // Check IP
    if (results.ip?.status === 'leak') {
        recommendations.push({
            priority: 'high',
            title: 'Use a VPN',
            description: 'Your real IP address is exposed. A VPN will hide your IP and location from websites.',
            link: 'https://www.privacyguides.org/en/vpn/'
        });
    }
    
    // Check WebRTC
    if (results.webrtc?.status === 'leak' && results.webrtc?.details?.localIPs?.length > 0) {
        recommendations.push({
            priority: 'high',
            title: 'Disable WebRTC',
            description: 'WebRTC is leaking your local IP addresses, even if you use a VPN. Disable it in browser settings.',
            link: 'https://browserleaks.com/webrtc#howto-disable-webrtc'
        });
    }
    
    // Check Canvas
    if (results.canvas?.status === 'leak') {
        recommendations.push({
            priority: 'high',
            title: 'Use Canvas Protection',
            description: 'Your canvas fingerprint is unique. Use Brave browser or a canvas blocker extension.',
            link: 'https://brave.com/'
        });
    }
    
    // Check WebGL  
    if (results.webgl?.status === 'leak') {
        recommendations.push({
            priority: 'medium',
            title: 'Protect WebGL Info',
            description: 'Your GPU information is exposed. Brave browser can protect against this.',
            link: null
        });
    }
    
    // Check DNT/GPC
    if (results.dnt?.details?.dntEnabled === false && results.dnt?.details?.gpcEnabled === false) {
        recommendations.push({
            priority: 'medium',
            title: 'Enable Privacy Signals',
            description: 'Enable Do Not Track or Global Privacy Control in your browser settings.',
            link: 'https://globalprivacycontrol.org/'
        });
    }
    
    // General recommendation based on score
    if (privacyData.privacyScore < 50) {
        recommendations.push({
            priority: 'high',
            title: 'Consider a Privacy Browser',
            description: 'For better protection, consider Brave, Firefox with strict settings, or Tor Browser.',
            link: 'https://www.privacyguides.org/en/desktop-browsers/'
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
            what: "Your IP address is your unique identifier on the internet.",
            risk: "Reveals your location, ISP, and can be used to identify you across sessions.",
            protect: "Use a VPN or Tor to hide your real IP address."
        },
        webrtc: {
            what: "WebRTC enables real-time communication (video calls) in browsers.",
            risk: "Can leak your real IP address even when using a VPN.",
            protect: "Disable WebRTC in browser settings or use an extension."
        },
        canvas: {
            what: "Canvas fingerprinting creates a unique image based on your system.",
            risk: "Your browser's rendering is unique and can identify you.",
            protect: "Use Brave browser or canvas blocking extensions."
        },
        webgl: {
            what: "WebGL exposes your graphics card information.",
            risk: "GPU details help create a unique fingerprint of your device.",
            protect: "Brave browser can protect WebGL information."
        },
        javascript: {
            what: "JavaScript reveals browser and system details.",
            risk: "User agent, platform, and hardware info help identify your device.",
            protect: "Some browsers can spoof or limit this information."
        },
        screen: {
            what: "Your screen resolution is visible to websites.",
            risk: "Unusual resolutions make you more identifiable.",
            protect: "Using common resolutions reduces uniqueness."
        },
        fonts: {
            what: "Websites can detect which fonts you have installed.",
            risk: "Your font collection is often unique to your system.",
            protect: "Firefox can limit font enumeration."
        },
        audio: {
            what: "Audio fingerprinting measures how your device processes sound.",
            risk: "Audio characteristics vary by hardware and create a fingerprint.",
            protect: "Brave browser protects against audio fingerprinting."
        },
        geolocation: {
            what: "Geolocation API can request your precise GPS coordinates.",
            risk: "If granted, websites know your exact physical location.",
            protect: "Deny location requests unless absolutely necessary."
        },
        timezone: {
            what: "Your system timezone is visible to websites.",
            risk: "Reveals your general geographic region.",
            protect: "Tor Browser normalizes timezone to UTC."
        },
        dnt: {
            what: "Do Not Track signals your preference not to be tracked.",
            risk: "Most websites ignore this signal.",
            protect: "Enable Global Privacy Control (GPC) for legal backing."
        },
        battery: {
            what: "Battery API can reveal your device's charge status.",
            risk: "Can be used to correlate browsing sessions.",
            protect: "Most modern browsers have restricted this API."
        },
        network: {
            what: "Network API reveals your connection type.",
            risk: "Connection details help profile your device.",
            protect: "Limited protection available."
        },
        clientHints: {
            what: "Client Hints provide detailed browser info to servers.",
            risk: "Reveals browser version, platform, and device details.",
            protect: "Some browsers allow limiting client hints."
        },
        storage: {
            what: "Storage APIs allow websites to save data in your browser.",
            risk: "Enables persistent tracking across sessions.",
            protect: "Clear cookies and storage regularly."
        },
        media: {
            what: "Websites can count your cameras and microphones.",
            risk: "Device configuration helps identify your system.",
            protect: "Deny media access when not needed."
        },
        touch: {
            what: "Touch support indicates your device type.",
            risk: "Helps determine if you're on mobile, tablet, or desktop.",
            protect: "This is tied to your hardware."
        },
        adBlocker: {
            what: "Websites can detect if you use an ad blocker.",
            risk: "Ad blocker usage adds to your fingerprint.",
            protect: "Keep using it - privacy benefits outweigh fingerprinting."
        },
        httpHeaders: {
            what: "HTTP headers are sent with every request.",
            risk: "Language, encoding preferences reveal browser details.",
            protect: "Hard to change without breaking functionality."
        }
    };
    
    return explanations[testId] || {
        what: "This test checks a browser feature that can be used for tracking.",
        risk: "The information exposed can contribute to browser fingerprinting.",
        protect: "Consider using a privacy-focused browser."
    };
};

// Keep old function name for compatibility
export const calculateEntropy = calculatePrivacyScore;
