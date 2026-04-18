const CompliancePDFService = require('./server/services/compliance/compliance_pdf_service');
const { query, run } = require('./server/database/database');

async function populateRealForms() {
    console.log("Starting form population...");
    
    // Alice Johnson
    const alice = { name: 'Alice Johnson', mciId: 'MCI-8834721', county: 'Milwaukee', ica: 'Connections', authorizedAmount: 48500, anniversaryDate: '2026-06-15' };
    // Robert Williams
    const robert = { name: 'Robert Williams', mciId: 'MCI-9912044', county: 'Dane', ica: 'TMG' };
    // Carmen Reyes
    const carmen = { name: 'Carmen Reyes', mciId: 'MCI-7741938', authorizedAmount: 35000, anniversaryDate: '2026-09-20' };

    const formsToGenerate = [
        { id: 'DOC-101', type: 'F-00075', data: alice },
        { id: 'DOC-102', type: 'F-01293', data: robert },
        { id: 'DOC-103', type: 'F-01309', data: alice },
        { id: 'DOC-104', type: 'F-01201A', data: carmen }
    ];

    for (const f of formsToGenerate) {
        try {
            console.log(`Generating ${f.type} for ${f.id}...`);
            const buffer = await CompliancePDFService.generateFilledForm(f.type, f.data);
            const base64 = buffer.toString('base64');
            await run("UPDATE documents SET content_base64 = ? WHERE id = ?", [base64, f.id]);
            console.log(`Updated ${f.id} with real PDF content.`);
        } catch (err) {
            console.error(`Failed to update ${f.id}:`, err.message);
        }
    }

    console.log("Form population complete.");
}

populateRealForms().catch(console.error);
