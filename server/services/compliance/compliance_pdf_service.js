/**
 * IRIS Digital OS - Compliance Form Generator Service
 * Goal: Generate official DHS and Federal PDF forms (F-01201, I-9, W-2).
 */

const fs = require('fs');
const path = require('path');
const PFMSMapper = require('./pfms_mapper');

class CompliancePDFService {
    constructor() {
        this.templateDir = path.join(__dirname, '../../assets/templates');
        // "Best guess" coordinates for official signatures
        this.SIGNATURE_COORDINATES = {
            'F-00075': {
                participant: { x: 80, y: 220, width: 150, height: 40, page: 'last' },
                agent: { x: 80, y: 150, width: 150, height: 40, page: 'last' }
            },
            'F-01022': {
                participant: { x: 100, y: 180, width: 150, height: 40, page: 'last' },
                guardian: { x: 300, y: 180, width: 150, height: 40, page: 'last' }
            },
            'default': { x: 50, y: 80, width: 150, height: 40, page: 'last' }
        };
    }

    /**
     * Generate a filled PDF for a specific Form.
     * @param {string} formType 'F-01201' | 'I-9' | 'W-2' | etc.
     * @param {Object} formData Raw intake data.
     */
    async generateFilledForm(formType, formData) {
        try {
            let PDFDocument;
            try {
                const pdflib = require('pdf-lib');
                PDFDocument = pdflib.PDFDocument;
            } catch (e) {
                console.warn('[COMPLIANCE_PDF] pdf-lib not found. Returning mock PDF buffer.');
                return Buffer.from('%PDF-1.4\n%ERROR: pdf-lib dependency missing.');
            }

            // Route to correct mapping
            let mappedData = {};
            if (formType === 'F-01201') {
                mappedData = PFMSMapper.mapToF01201(formData).fields;
            } else if (formType === 'F-82064') {
                mappedData = PFMSMapper.mapToF82064(formData).fields;
            } else if (formType === 'I-9') {
                mappedData = PFMSMapper.mapToI9(formData).fields;
            } else if (formType === 'W-2') {
                mappedData = PFMSMapper.mapToW2(formData).fields;
            } else if (formType === 'F-00075') {
                mappedData = PFMSMapper.mapToF00075(formData).fields;
            } else if (formType === 'F-01022') {
                mappedData = PFMSMapper.mapToF01022(formData).fields;
            } else if (formType === 'F-01309') {
                mappedData = PFMSMapper.mapToF01309(formData).fields;
            } else if (formType === 'F-01201A') {
                mappedData = PFMSMapper.mapToF01201A(formData).fields;
            } else if (formType === 'F-01293') {
                mappedData = PFMSMapper.mapToF01293(formData).fields;
            } else {
                throw new Error('Unknown compliance form type: ' + formType);
            }

            const templatePath = path.join(this.templateDir, `${formType}_template.pdf`);

            // If template doesn't exist, build a fallback manifest
            if (!fs.existsSync(templatePath)) {
                console.warn(`[COMPLIANCE_PDF] Template not found at ${templatePath}. Creating manifest document.`);
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([612, 792]);
                
                page.drawText(`Compliance Form: ${formType} (Template Missing)`, { x: 50, y: 700 });
                page.drawText('Form Field Data Mapping:', { x: 50, y: 680, size: 10 });
                
                let y = 660;
                for (const [key, val] of Object.entries(mappedData)) {
                    page.drawText(`${key}: ${val}`, { x: 50, y, size: 8 });
                    y -= 12;
                    if (y < 50) break;
                }
                
                return Buffer.from(await pdfDoc.save());
            }

            // Load official template and fill fields
            const templateBytes = fs.readFileSync(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
            const form = pdfDoc.getForm();

            for (const [boxId, value] of Object.entries(mappedData)) {
                try {
                    const field = form.getField(boxId);
                    if (field) {
                        if (field.constructor.name === 'PDFTextField') {
                            field.setText(String(value));
                        } else if (field.constructor.name === 'PDFCheckBox') {
                            if (value === 'YES' || value === true) field.check();
                        }
                    }
                } catch (err) { }
            }

            // Enhanced Signature Logic (Support for complex sign-offs)
            const signatures = formData.signatures || {};
            const coordMap = this.SIGNATURE_COORDINATES[formType] || { primary: this.SIGNATURE_COORDINATES.default };

            for (const [signerRole, signatureData] of Object.entries(signatures)) {
                if (signatureData && coordMap[signerRole]) {
                    try {
                        const signatureImage = await pdfDoc.embedPng(signatureData);
                        const coords = coordMap[signerRole];
                        const pages = pdfDoc.getPages();
                        const page = coords.page === 'last' ? pages[pages.length - 1] : pages[0];
                        
                        page.drawImage(signatureImage, { 
                            x: coords.x, 
                            y: coords.y, 
                            width: coords.width, 
                            height: coords.height 
                        });
                        console.log(`[COMPLIANCE_PDF] Embedded signature for ${signerRole} on ${formType}`);
                    } catch (sigErr) {
                        console.warn(`[COMPLIANCE_PDF] Failed to embed signature for ${signerRole}:`, sigErr.message);
                    }
                }
            }

            // Fallback for legacy calls
            if (formData.signatureData && !signatures.primary) {
                const signatureImage = await pdfDoc.embedPng(formData.signatureData);
                const lastPage = pdfDoc.getPages().pop();
                lastPage.drawImage(signatureImage, { x: 50, y: 80, width: 150, height: 40 });
            }

            return Buffer.from(await pdfDoc.save());
        } catch (error) {
            console.error('[COMPLIANCE_PDF] GENERATION_FAILED:', error);
            throw error;
        }
    }
}

module.exports = new CompliancePDFService();
