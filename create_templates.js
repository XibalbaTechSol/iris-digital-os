const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createTemplates() {
    const templateDir = path.join(__dirname, 'server/assets/templates');
    if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
    }

    // 1. F-01201 Template
    const pdf1 = await PDFDocument.create();
    const page1 = pdf1.addPage([612, 792]);
    const form1 = pdf1.getForm();
    
    page1.drawText('DHS F-01201: IRIS Worker Set-Up', { x: 50, y: 750, size: 20 });
    
    // Add some fields
    const nameField = form1.createTextField('PARTICIPANT_NAME');
    nameField.addToPage(page1, { x: 50, y: 700, width: 200, height: 20 });
    page1.drawText('Participant Name:', { x: 50, y: 725, size: 10 });

    const mciField = form1.createTextField('PARTICIPANT_MCI');
    mciField.addToPage(page1, { x: 300, y: 700, width: 200, height: 20 });
    page1.drawText('Participant MCI:', { x: 300, y: 725, size: 10 });

    const workerField = form1.createTextField('WORKER_NAME');
    workerField.addToPage(page1, { x: 50, y: 650, width: 200, height: 20 });
    page1.drawText('Worker Name:', { x: 50, y: 675, size: 10 });

    const ssnField = form1.createTextField('WORKER_SSN');
    ssnField.addToPage(page1, { x: 300, y: 650, width: 200, height: 20 });
    page1.drawText('Worker SSN:', { x: 300, y: 675, size: 10 });

    fs.writeFileSync(path.join(templateDir, 'F-01201_template.pdf'), await pdf1.save());

    // 2. F-00075 Template
    const pdf2 = await PDFDocument.create();
    const page2 = pdf2.addPage([612, 792]);
    const form2 = pdf2.getForm();
    
    page2.drawText('DHS F-00075: IRIS Authorization', { x: 50, y: 750, size: 20 });
    
    const pNameField = form2.createTextField('PARTICIPANT_NAME');
    pNameField.addToPage(page2, { x: 50, y: 700, width: 200, height: 20 });
    page2.drawText('Participant Name:', { x: 50, y: 725, size: 10 });

    const pMciField = form2.createTextField('PARTICIPANT_MCI');
    pMciField.addToPage(page2, { x: 300, y: 700, width: 200, height: 20 });
    page2.drawText('Participant MCI:', { x: 300, y: 725, size: 10 });

    fs.writeFileSync(path.join(templateDir, 'F-00075_template.pdf'), await pdf2.save());

    console.log('Templates created successfully.');
}

createTemplates().catch(console.error);
