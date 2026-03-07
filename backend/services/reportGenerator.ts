import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePDFReport = async (reportData: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // --- Header ---
        doc.fillColor('#444444').fontSize(20).text('APEX Performance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // --- Overview ---
        doc.fillColor('#10b981').fontSize(14).text('Executive Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#333333').fontSize(12);
        doc.text(`Target URL: ${reportData.url}`);
        doc.text(`Method: ${reportData.method}`);
        doc.text(`Overall Score: ${reportData.score}/100`);
        doc.text(`Grade: ${reportData.grade}`);
        doc.moveDown();

        // --- Metrics ---
        doc.fillColor('#3b82f6').fontSize(14).text('Performance Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#333333').fontSize(12);
        const m = reportData.metrics;
        doc.text(`Average Latency: ${Math.round(m.avgLatency)}ms`);
        doc.text(`P95 Latency: ${m.p95Latency}ms`);
        doc.text(`Throughput: ${m.throughput} RPS`);
        doc.text(`Error Rate: ${((m.failed / m.totalRequests) * 100).toFixed(1)}%`);
        doc.moveDown();

        // --- Payload & Bottlenecks ---
        doc.fillColor('#f59e0b').fontSize(14).text('Analysis & Diagnostics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Avg Payload Size: ${(m.avgSize / 1024).toFixed(2)} KB`);

        if (reportData.diagnosis?.issues?.length > 0) {
            doc.moveDown(0.5);
            doc.fillColor('#ef4444').text('Detected Issues:');
            reportData.diagnosis.issues.forEach((issue: string) => {
                doc.fillColor('#333333').text(`• ${issue}`, { indent: 20 });
            });
        }

        doc.moveDown();
        doc.fillColor('#10b981').text('Recommendations:');
        reportData.suggestions.forEach((s: string) => {
            doc.fillColor('#333333').text(`• ${s}`, { indent: 20 });
        });

        // --- Footer ---
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).text(
                `Page ${i + 1} of ${pageCount} - Confidential APEX Analysis`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
        }

        doc.end();
    });
};
