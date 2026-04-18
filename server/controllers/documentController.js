/**
 * IRIS Digital OS - Document Management Controller
 * Goal: Manage clinical forms and their compliance lifecycle.
 */

const { query, run } = require('../database/database');
const auditService = require('../services/compliance/audit_service');
const IntegrityService = require('../services/ai/integrity_service');

class DocumentController {
    /**
     * Get ALL documents (for Document Vault global view)
     */
    async getAllDocuments(req, res) {
        try {
            console.log(`[DOC_CTRL] FETCHING_ALL_DOCS`);
            const docs = await query(`SELECT * FROM documents ORDER BY uploaded_at DESC`);
            res.json({ success: true, documents: docs });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Get all documents for a specific participant.
     */
    async getParticipantDocuments(req, res) {
        try {
            const { participantId } = req.params;
            console.log(`[DOC_CTRL] FETCHING_DOCS_FOR: ${participantId}`);
            
            const docs = await query(`SELECT * FROM documents WHERE participant_id = ? ORDER BY uploaded_at DESC`, [participantId]);
            res.json({ success: true, documents: docs });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Trigger an AI Audit scan on a document.
     */
    async auditDocument(req, res) {
        try {
            const { documentId, content } = req.body;
            console.log(`[DOC_CTRL] TRIGGERING_AUDIT: ${documentId}`);

            // Assuming user sends metadata/content to audit
            const auditResult = await auditService.scanDocument(documentId, content, 'CLINICAL');

            res.json({
                success: true,
                documentId,
                auditResult
            });
        } catch (err) {
             res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Upload document (New endpoint)
     */
    async uploadDocument(req, res) {
        try {
            const { participantId, category, filename, base64Content } = req.body;
            const docId = `DOC-${Date.now()}`;
            
            await run(`INSERT INTO documents (id, participant_id, category, filename, content_base64, compliance_status)
                       VALUES (?, ?, ?, ?, ?, 'PENDING_AUDIT')`, 
                       [docId, participantId, category, filename, base64Content]);

            const scanResult = await auditService.scanDocument(docId, base64Content, category);
            const complianceStatus = scanResult.isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT';
            const reason = scanResult.isCompliant ? null : scanResult.reasons.join(' | ');

            await run(`UPDATE documents SET compliance_status = ?, audit_reason = ? WHERE id = ?`, 
                [complianceStatus, reason, docId]);

            const finalDoc = await query(`SELECT * FROM documents WHERE id = ?`, [docId]);
            res.json({ success: true, document: finalDoc[0], scanResult });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Pre-Claim Audit
     */
    async preClaimAudit(req, res) {
        try {
            const result = await auditService.preClaimAudit(req.params.participantId);
            res.json({ success: true, ...result });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Get Document Debt Audit for a specific entity.
     */
    async getDocumentDebt(req, res) {
        try {
            const { id } = req.params;
            const { type } = req.query; // 'PARTICIPANT' | 'WORKER'
            const health = await docLifecycleService.auditEntityHealth(id, type);
            res.json({ success: true, health });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * System-wide Compliance Audit
     */
    async getSystemDebtAudit(req, res) {
        try {
            const debt = await docLifecycleService.scanSystemDebt();
            res.json({ success: true, debt });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * View Document Content (Base64 -> PDF Stream)
     */
    async viewDocument(req, res) {
        try {
            const { id } = req.params;
            const rows = await query(`SELECT filename, content_base64 FROM documents WHERE id = ?`, [id]);
            if (rows.length === 0) return res.status(404).json({ success: false, error: 'Document not found' });

            const doc = rows[0];
            if (!doc.content_base64) return res.status(404).json({ success: false, error: 'Document content missing' });

            const pdfBuffer = Buffer.from(doc.content_base64, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=' + doc.filename);
            res.send(pdfBuffer);
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Download Document
     */
    async downloadDocument(req, res) {
        try {
            const { id } = req.params;
            const rows = await query(`SELECT filename, content_base64 FROM documents WHERE id = ?`, [id]);
            if (rows.length === 0) return res.status(404).json({ success: false, error: 'Document not found' });

            const doc = rows[0];
            const pdfBuffer = Buffer.from(doc.content_base64, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=' + doc.filename);
            res.send(pdfBuffer);
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

const docLifecycleService = require('../services/compliance/document_lifecycle_service');
module.exports = new DocumentController();
