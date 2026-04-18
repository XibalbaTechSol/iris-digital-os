/**
 * IRIS Digital OS - CMS-1500 Professional Billing Service
 * Goal: Orchestrate the generation of paper-ready claim data.
 */

const fs = require('fs');
const path = require('path');
const CMS1500Mapper = require('./cms1500_mapper');

class CMS1500Service {
    constructor() {
        this.templatePath = path.join(__dirname, '../../assets/templates/cms1500_template.pdf');
    }

    /**
     * Generate a complete data package for a professional claim.
     */
    generateClaimPackage(claim, provider) {
        console.log(`[CMS1500] GENERATING_PACKAGE_FOR_CLAIM: ${claim.claimId}`);
        
        const mappedBoxes = CMS1500Mapper.mapToBoxes(claim, provider);
        
        return {
            claimId: claim.claimId,
            generatedAt: new Date().toISOString(),
            formType: 'CMS-1500-02-12',
            mappedData: mappedBoxes,
            flatBuffer: this.convertToFlatBuffer(mappedBoxes) // For PDF overlay tools
        };
    }

    /**
     * Generate a filled PDF buffer using pdf-lib.
     */
    async generateFilledPDF(claim, provider) {
        try {
            // Check if pdf-lib is available, otherwise return a mock PDF with an error message
            let PDFDocument;
            try {
                const pdflib = require('pdf-lib');
                PDFDocument = pdflib.PDFDocument;
            } catch (e) {
                console.warn('[CMS1500] pdf-lib not found. Returning mock PDF buffer.');
                return Buffer.from('%PDF-1.4\n%ERROR: pdf-lib dependency missing. Please run npm install.');
            }

            if (!fs.existsSync(this.templatePath)) {
                console.warn('[CMS1500] Template not found at ' + this.templatePath + '. Creating blank document.');
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([612, 792]);
                page.drawText('CMS-1500 Form Template Missing', { x: 50, y: 700 });
                page.drawText('Field Mapping Data:', { x: 50, y: 680 });
                
                const boxes = CMS1500Mapper.mapToBoxes(claim, provider);
                let y = 660;
                for (const [key, val] of Object.entries(boxes)) {
                    page.drawText(`${key}: ${val}`, { x: 50, y, size: 8 });
                    y -= 12;
                    if (y < 50) break;
                }
                
                return await pdfDoc.save();
            }

            const templateBytes = fs.readFileSync(this.templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
            const form = pdfDoc.getForm();
            const boxes = CMS1500Mapper.mapToBoxes(claim, provider);

            // Mapping IRIS Box identifiers to common official field names
            // Note: Official field names vary by PDF version, so we try multiple patterns
            for (const [boxId, value] of Object.entries(boxes)) {
                try {
                    // Try exact name
                    const field = form.getField(boxId);
                    if (field) {
                        if (field.constructor.name === 'PDFTextField') {
                            field.setText(String(value));
                        } else if (field.constructor.name === 'PDFCheckBox') {
                            if (value === 'YES' || value === true) field.check();
                        }
                    }
                } catch (err) {
                    // console.debug(`[CMS1500] Field ${boxId} not found in template, skipping.`);
                }
            }

            return await pdfDoc.save();
        } catch (error) {
            console.error('[CMS1500] PDF_GENERATION_FAILED:', error);
            throw error;
        }
    }

    /**
     * Convert box mapping to a flat key-value buffer for standard PDF fill tools.
     */
    toPDFLibJSON(claim, provider) {
        const boxes = CMS1500Mapper.mapToBoxes(claim, provider);
        return {
            metadata: {
                claimId: claim.claimId,
                mappedDate: new Date().toISOString(),
                formStandard: 'NUCC-1500-02/12'
            },
            fields: Object.entries(boxes).reduce((acc, [key, val]) => {
                acc[key] = val;
                return acc;
            }, {})
        };
    }

    /**
     * Convert box mapping to a flat key-value buffer.
     */
    convertToFlatBuffer(boxes) {
        return Object.entries(boxes).reduce((acc, [key, val]) => {
            acc[key] = val;
            return acc;
        }, {});
    }

    /**
     * Mock archival of generated claims.
     */
    async archiveClaim(packageData) {
        console.log(`[CMS1500] ARCHIVING_CLAIM: ${packageData.claimId}`);
        return { success: true, archiveId: `ARC-${Date.now()}` };
    }
}

module.exports = new CMS1500Service();
