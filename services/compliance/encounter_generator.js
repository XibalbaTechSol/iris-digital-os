/**
 * IRIS Digital OS - LTC-IES Encounter Generator (Task 4.3)
 * Goal: Generate state-compliant "PR" XML files for Medicaid reimbursement.
 * Compliant with Wisconsin LTCare Information Exchange System (IES) rules.
 */

const fs = require('fs');
const path = require('path');

class EncounterGenerator {
    constructor(agencyId, tenantName) {
        this.agencyId = agencyId; // The 3 or 8 digit State Org ID
        this.tenantName = tenantName;
        this.outputDir = path.join(__dirname, '../../data/encounters');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generates a complete XML batch from a list of paid payroll records.
     */
    generateBatchXML(payrollRecords, submissionPeriod) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `XML_2.7_${this.agencyId}_S01_${submissionPeriod}.xml`;
        const filePath = path.join(this.outputDir, filename);

        let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
        xml += `<encounter_batch>\n`;
        
        // 1. Header Record
        xml += `  <header_record>\n`;
        xml += `    <submitter_organization_id>${this.agencyId}</submitter_organization_id>\n`;
        xml += `    <submission_period>${submissionPeriod}</submission_period>\n`;
        xml += `    <submission_date>${timestamp}</submission_date>\n`;
        xml += `    <contact_name>IRIS OS System - ${this.tenantName}</contact_name>\n`;
        xml += `  </header_record>\n`;

        // 2. Detail Records (PR - Professional)
        payrollRecords.forEach(record => {
            xml += `  <detail_record record_id="${record.id}">\n`;
            xml += `    <claim_type>PR</claim_type>\n`;
            xml += `    <member_id>${record.memberMCI}</member_id>\n`;
            xml += `    <procedure_code>${record.serviceCode}</procedure_code>\n`;
            xml += `    <units>${record.units}</units>\n`;
            xml += `    <paid_amount>${record.paidAmount.toFixed(2)}</paid_amount>\n`;
            xml += `    <date_of_service_start>${record.serviceDate}</date_of_service_start>\n`;
            xml += `    <date_of_service_end>${record.serviceDate}</date_of_service_end>\n`;
            xml += `    <iris_funding_file_date>${record.fundingFileDate}</iris_funding_file_date>\n`;
            xml += `  </detail_record>\n`;
        });

        xml += `</encounter_batch>`;

        fs.writeFileSync(filePath, xml);
        console.log(`[ENCOUNTER] Generated XML for ${this.tenantName}: ${filename}`);
        
        return { filename, filePath };
    }
}

module.exports = EncounterGenerator;
