/**
 * Response Size Analyzer
 * detects payload inefficiencies and provides optimization rules
 */
export const analyzePayloadSizes = (results: any[]) => {
    const sizes = results.map(r => r.size || 0);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);

    const suggestions: string[] = [];
    if (avgSize > 1024 * 1024) { // 1MB
        suggestions.push("Critical: Average payload size exceeds 1MB. Use pagination or field filtering.");
    } else if (avgSize > 300 * 1024) { // 300KB
        suggestions.push("Warning: Large payload detected. Ensure Gzip or Brotli compression is enabled.");
    }

    return {
        avgSize,
        maxSize,
        minSize,
        recommendations: suggestions
    };
};
