const CompliancePDFService = require('./server/services/compliance/compliance_pdf_service');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function validate() {
    console.log("Starting PDF Mapping Validation...");
    
    const testData = {
        participant: {
            name: 'Alice Johnson',
            mciId: 'MCI-8834721',
            address: '123 Main St',
            city: 'Milwaukee',
            zip: '53202',
            phone: '414-555-0199'
        },
        worker: {
            name: 'John Doe',
            dob: '1990-05-15',
            ssn: '999-00-1234',
            address: '456 Oak Ave',
            city: 'Madison',
            zip: '53703',
            phone: '608-555-0122',
            email: 'john.doe@example.com'
        },
        signatures: {
            primary: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        }
    };

    try {
        const buffer = await CompliancePDFService.generateFilledForm('F-01201', testData);
        fs.writeFileSync('validation_result.pdf', buffer);
        console.log("PDF generated successfully: validation_result.pdf");

        // Verify content
        const pdfDoc = await PDFDocument.load(buffer);
        const form = pdfDoc.getForm();
        
        const firstName = form.getTextField('PHW_First Name').getText();
        const lastName = form.getTextField('PHW_Last Name').getText();
        const mci = form.getTextField('Master ClientIndex MCI').getText();

        console.log(`Validation Check:`);
        console.log(`- PHW_First Name: ${firstName} (Expected: JOHN)`);
        console.log(`- PHW_Last Name: ${lastName} (Expected: DOE)`);
        console.log(`- Master ClientIndex MCI: ${mci} (Expected: MCI-8834721)`);

        if (firstName === 'JOHN' && lastName === 'DOE' && mci === 'MCI-8834721') {
            console.log("SUCCESS: PDF fields mapped correctly.");
        } else {
            console.error("FAILURE: PDF fields do not match expected values.");
        }
    } catch (err) {
        console.error("Validation failed with error:", err);
    }
}

validate().catch(console.error);
