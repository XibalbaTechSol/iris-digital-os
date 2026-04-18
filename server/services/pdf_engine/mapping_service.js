/**
 * IRIS Digital OS - State PDF Mapping Engine (Task 2.4 / 4.4)
 * Goal: Map AI-extracted JSON data to official Wisconsin DHS PDF form fields.
 */

const PDF_TEMPLATES = {
    'F-01689': {
        name: 'IRIS 40-Hour Exception Request',
        fields: {
            participantName: 'topmostSubform[0].Page1[0].ParticipantName[0]',
            workerName: 'topmostSubform[0].Page1[0].WorkerName[0]',
            justification: 'topmostSubform[0].Page1[0].JustificationText[0]',
            hoursRequested: 'topmostSubform[0].Page1[0].HoursRequested[0]'
        }
    },
    'F-01206': {
        name: 'IRIS One-Time Expense Request',
        fields: {
            itemDescription: 'topmostSubform[0].Page1[0].ItemDesc[0]',
            totalCost: 'topmostSubform[0].Page1[0].TotalCost[0]',
            outcomeLink: 'topmostSubform[0].Page1[0].OutcomeLink[0]'
        }
    }
};

/**
 * Maps flat JSON data to PDF-specific field names using LLM-assisted alignment.
 */
const mapDataToPdfFields = async (templateId, extractedData) => {
    console.log(`[PDF_MAPPING] Mapping data for template: ${templateId}`);
    
    const template = PDF_TEMPLATES[templateId];
    if (!template) throw new Error("Template not supported");

    const mappedFields = {};
    
    // Logic: Iterate through template fields and find corresponding data in extractedData
    // In production, an LLM would handle fuzzy matching for complex forms.
    Object.keys(template.fields).forEach(key => {
        const pdfField = template.fields[key];
        if (extractedData[key]) {
            mappedFields[pdfField] = extractedData[key];
        }
    });

    return {
        template: template.name,
        templateId: templateId,
        mappedData: mappedFields,
        burnStatus: 'READY_TO_STAMP'
    };
};

module.exports = {
    mapDataToPdfFields,
    PDF_TEMPLATES
};
