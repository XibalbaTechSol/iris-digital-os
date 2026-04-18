const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function listFields(fileName) {
    const filePath = path.join(__dirname, 'server/assets/templates', fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log(`--- Fields in ${fileName} ---`);
    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        console.log(`${name} [${type}]`);
    });
}

async function run() {
    await listFields('F-01201_template.pdf');
    await listFields('F-82064_template.pdf');
    await listFields('F-01201A_template.pdf');
}

run().catch(console.error);
