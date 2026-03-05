export const analyzeSecurityHeaders = (headers: Record<string, string>) => {
    const securityHeaderChecks = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'permissions-policy',
        'strict-transport-security'
    ];

    const detectedHeaders: string[] = [];
    const missingHeaders: string[] = [];

    // Convert all headers to lowercase for reliable lookup
    const lowerCaseHeaders = Object.keys(headers).reduce((acc: Record<string, string>, key) => {
        acc[key.toLowerCase()] = headers[key] as string;
        return acc;
    }, {});

    securityHeaderChecks.forEach((headerKey) => {
        if (lowerCaseHeaders[headerKey]) {
            detectedHeaders.push(headerKey);
        } else {
            missingHeaders.push(headerKey);
        }
    });

    return {
        missingHeaders,
        detectedHeaders
    };
};
