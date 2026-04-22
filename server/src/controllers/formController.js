/**
 * IRIS Digital OS - Form Management Controller
 * Goal: Manage lifecycle of digital forms (F-01201, ISSP, etc.)
 */
const { query, run } = require('../config/database');
const CompliancePDFService = require('../services/compliance/compliance_pdf_service');

class FormController {
    /**
     * Get forms for an entity (Participant or Worker)
     */
    async getForms(req, res) {
        try {
            const { entityId } = req.params;
            const forms = await query('SELECT * FROM forms WHERE entity_id = ? ORDER BY created_at DESC', [entityId]);
            res.json({ success: true, forms });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Submit a digital signature for a form
     */
    async signForm(req, res) {
        try {
            const { formId, signatureData } = req.body;
            await run('UPDATE forms SET signature_data = ?, status = "SIGNED" WHERE id = ?', [signatureData, formId]);
            
            // AUTOMATED PUBLISHING TO VAULT (Default Strategy)
            // In a production app, we would check a setting here.
            await this.publishToVault(formId);

            res.json({ success: true, message: 'FORM_SIGNED_AND_PUBLISHED' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Publish a signed form to the Clinical Document Vault as an immutable artifact.
     */
    async publishToVault(formId) {
        try {
            const formRows = await query('SELECT * FROM forms WHERE id = ?', [formId]);
            if (formRows.length === 0) return;
            const form = formRows[0];

            // Re-generate the PDF buffer with the signature
            // This ensures we save the LATEST version of the data + signature
            let entityData = {};
            if (form.entity_type === 'PARTICIPANT') {
                const p = await query('SELECT * FROM participants WHERE id = ?', [form.entity_id]);
                entityData = p[0] || {};
            } else {
                const w = await query('SELECT * FROM workers WHERE id = ?', [form.entity_id]);
                entityData = { worker: w[0] || {}, participant: { id: form.entity_id } };
            }
            entityData.signatureData = form.signature_data;

            const pdfBuffer = await CompliancePDFService.generateFilledForm(form.form_code, entityData);
            const base64Content = pdfBuffer.toString('base64');

            const docId = `DOC-PUBLISHED-${Date.now()}`;
            await run(`INSERT INTO documents (id, participant_id, category, filename, content_base64, is_signed, compliance_status)
                       VALUES (?, ?, ?, ?, ?, 1, 'VERIFIED')`,
                       [docId, form.entity_id, form.form_code, `${form.form_code}_SIGNED.pdf`, base64Content]);

            console.log(`[FORM_CTRL] AUTO_PUBLISHED_TO_VAULT: ${docId}`);
        } catch (err) {
            console.error('[FORM_CTRL] AUTO_PUBLISH_FAILED:', err);
        }
    }

    /**
     * Download filled and possibly signed PDF
     */
    async downloadForm(req, res) {
        try {
            const { formId } = req.params;
            const formRows = await query('SELECT * FROM forms WHERE id = ?', [formId]);
            
            if (formRows.length === 0) {
                return res.status(404).json({ success: false, error: 'Form not found' });
            }

            const form = formRows[0];
            
            // Fetch entity data to fill the form
            let entityData = {};
            if (form.entity_type === 'PARTICIPANT') {
                const participants = await query('SELECT * FROM participants WHERE id = ?', [form.entity_id]);
                const budget = await query('SELECT * FROM budgets WHERE participant_id = ?', [form.entity_id]);
                entityData = { ...participants[0], ...(budget[0] || {}) };
            } else {
                const workers = await query('SELECT * FROM workers WHERE id = ?', [form.entity_id]);
                entityData = { worker: workers[0] || {}, participant: { id: form.entity_id } }; // Simplified
            }

            // Inject signature if present
            entityData.signatureData = form.signature_data;

            const pdfBuffer = await CompliancePDFService.generateFilledForm(form.form_code, entityData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${form.form_code}_${form.entity_id}.pdf`);
            res.send(pdfBuffer);
        } catch (err) {
            console.error('[FORM_CTRL] DOWNLOAD_FAILED:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new FormController();
