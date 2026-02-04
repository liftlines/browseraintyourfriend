// Privacy Score Calculator
// Counts identifying items of information exposed by your browser

export const calculatePrivacyScore = (results) => {
    // Define what counts as an "item" of identifying information
    const itemsMap = {
        ip: {
            getItems: (details) => {
                if (!details) return 0;
                if (details.vpnDetected) return 0;
                return 3; // IP, location, ISP
            },
            maxItems: 3,
            description: 'IP address, location, and ISP'
        },
        
        webrtc: {
            getItems: (details) => {
                if (!details || !details.leaking) return 0;
                let items = 0;
                if (details.localIPs?.length > 0) items += 1;
                if (details.publicIPs?.length > 0) items += 1;
                return items;
            },
            maxItems: 2,
            description: 'Local and public IP addresses'
        },
        
        canvas: {
            getItems: (details) => {
                if (!details) return 0;
                if (details.randomized) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Canvas fingerprint'
        },
        
        webgl: {
            getItems: (details) => {
                if (!details) return 0;
                if (details.protected) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'GPU information'
        },
        
        audio: {
            getItems: (details) => {
                if (!details) return 0;
                if (details.randomized || details.blocked) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Audio fingerprint'
        },
        
        fonts: {
            getItems: (details) => {
                if (!details) return 0;
                return details.count > 0 ? 1 : 0;
            },
            maxItems: 1,
            description: 'Installed fonts'
        },
        
        javascript: {
            getItems: (details) => {
                if (!details) return 0;
                let items = 0;
                if (details.userAgent) items += 1;
                if (details.platform) items += 1;
                if (details.hardwareConcurrency && details.hardwareConcurrency !== 'Unknown') items += 1;
                return items;
            },
            maxItems: 3,
            description: 'Browser and system info'
        },
        
        screen: {
            getItems: () => 1,
            maxItems: 1,
            description: 'Screen resolution'
        },
        
        timezone: {
            getItems: () => 1,
            maxItems: 1,
            description: 'Timezone'
        },
        
        dnt: {
            getItems: () => 0, // Privacy-positive, not a leak
            maxItems: 0,
            description: 'Privacy signals'
        },
        
        storage: {
            getItems: (details) => {
                if (!details) return 0;
                return (details.localStorage || details.indexedDB) ? 1 : 0;
            },
            maxItems: 1,
            description: 'Storage APIs'
        },
        
        geolocation: {
            getItems: (details) => {
                if (!details) return 0;
                return details.permissionState === 'granted' ? 1 : 0;
            },
            maxItems: 1,
            description: 'Precise location'
        },
        
        media: {
            getItems: (details) => {
                if (!details || details.blocked) return 0;
                return details.total > 0 ? 1 : 0;
            },
            maxItems: 1,
            description: 'Media devices'
        },
        
        adBlocker: {
            getItems: () => 0, // Detection status, not a leak
            maxItems: 0,
            description: 'Ad blocker status'
        },
        
        clientHints: {
            getItems: (details) => {
                if (!details || !details.supported) return 0;
                return 1;
            },
            maxItems: 1,
            description: 'Client hints'
        }
    };
    
    let totalItems = 0;
    let maxPossibleItems = 0;
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
    });
    
    const privacyScore = maxPossibleItems > 0 
        ? Math.round(((maxPossibleItems - totalItems) / maxPossibleItems) * 100)
        : 100;
    
    return {
        totalItems,
        maxPossibleItems,
        privacyScore,
        breakdown,
        assessment: getAssessment(privacyScore),
        trackability: getTrackability(totalItems)
    };
};

const getAssessment = (score) => {
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
    if (items <= 3) {
        return {
            level: 'low',
            message: 'Hard to track - you blend in with many users',
            detail: `Only ${items} identifying items exposed`
        };
    }
    if (items <= 7) {
        return {
            level: 'medium',
            message: 'Moderately trackable - some unique characteristics',
            detail: `${items} identifying items exposed`
        };
    }
    if (items <= 12) {
        return {
            level: 'high',
            message: 'Easily trackable - many unique characteristics',
            detail: `${items} identifying items exposed`
        };
    }
    return {
        level: 'very-high',
        message: 'Very easily trackable - your browser is highly unique',
        detail: `${items} identifying items exposed`
    };
};

// Recommendations based on results
export const getRecommendations = (results, privacyData) => {
    const recommendations = [];
    
    if (results.ip?.status === 'leak') {
        recommendations.push({
            priority: 'high',
            title: 'Use a VPN',
            description: 'Your real IP address is exposed. A VPN hides your IP and location.',
            link: 'https://www.privacyguides.org/en/vpn/'
        });
    }
    
    if (results.webrtc?.status === 'leak') {
        recommendations.push({
            priority: 'high',
            title: 'Disable WebRTC',
            description: 'WebRTC leaks your IP even with a VPN. Disable it in browser settings.',
            link: 'https://browserleaks.com/webrtc#howto-disable-webrtc'
        });
    }
    
    if (results.canvas?.status === 'leak') {
        recommendations.push({
            priority: 'high',
            title: 'Use Canvas Protection',
            description: 'Your canvas fingerprint is unique. Use Brave browser or a blocker extension.',
            link: 'https://brave.com/'
        });
    }
    
    if (results.dnt?.status !== 'safe') {
        recommendations.push({
            priority: 'medium',
            title: 'Enable Privacy Signals',
            description: 'Enable Do Not Track or Global Privacy Control in settings.',
            link: 'https://globalprivacycontrol.org/'
        });
    }
    
    if (privacyData.privacyScore < 50) {
        recommendations.push({
            priority: 'high',
            title: 'Consider a Privacy Browser',
            description: 'Try Brave, Firefox with strict settings, or Tor Browser.',
            link: 'https://www.privacyguides.org/en/desktop-browsers/'
        });
    }
    
    return recommendations.sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.priority] - priority[b.priority];
    });
};

// Keep old function name for compatibility
export const calculateEntropy = calculatePrivacyScore;

// Explanations for each test
export const getTestExplanation = (testId) => {
    const explanations = {
        ip: {
            what: "Your IP address is your unique identifier on the internet.",
            risk: "Reveals your location, ISP, and can identify you across sessions.",
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
        audio: {
            what: "Audio fingerprinting measures how your device processes sound.",
            risk: "Audio characteristics vary by hardware and create a fingerprint.",
            protect: "Brave browser protects against audio fingerprinting."
        },
        fonts: {
            what: "Websites can detect which fonts you have installed.",
            risk: "Your font collection is often unique to your system.",
            protect: "Firefox can limit font enumeration."
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
        storage: {
            what: "Storage APIs allow websites to save data in your browser.",
            risk: "Enables persistent tracking across sessions.",
            protect: "Clear cookies and storage regularly."
        },
        geolocation: {
            what: "Geolocation API can request your precise GPS coordinates.",
            risk: "If granted, websites know your exact physical location.",
            protect: "Deny location requests unless absolutely necessary."
        },
        media: {
            what: "Websites can count your cameras and microphones.",
            risk: "Device configuration helps identify your system.",
            protect: "Deny media access when not needed."
        },
        adBlocker: {
            what: "Websites can detect if you use an ad blocker.",
            risk: "Ad blocker usage adds to your fingerprint.",
            protect: "Keep using it - privacy benefits outweigh fingerprinting."
        },
        clientHints: {
            what: "Client Hints provide detailed browser info to servers.",
            risk: "Reveals browser version, platform, and device details.",
            protect: "Some browsers allow limiting client hints."
        }
    };
    
    return explanations[testId] || {
        what: "This test checks a browser feature that can be used for tracking.",
        risk: "The information exposed can contribute to browser fingerprinting.",
        protect: "Consider using a privacy-focused browser."
    };
};
