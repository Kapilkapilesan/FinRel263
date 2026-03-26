export const generateFingerprint = () => {
    if (typeof window === 'undefined') return 'server';

    const components = [
        navigator.userAgent,
        navigator.language,
        new Date().getTimezoneOffset().toString(),
        screen.colorDepth.toString(),
        screen.width + 'x' + screen.height,
        // Simple but effective fingerprint base
    ];

    // Basic hash function
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return 'fingerprint_' + Math.abs(hash).toString(16);
};

export const getDeviceToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('device_token');
};

export const setDeviceToken = (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('device_token', token);
};
