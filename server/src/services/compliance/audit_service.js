const { db, run, query } = require('../../config/database');

/**
 * IRIS Digital OS - Compliance Audit Shield
 * Goal: Prevent non-compliant billing and provide "Audit-Ready" peace of mind.
 * Pattern: Pre-computation & Document Scanning Simulation.
 */
class AuditService {
    /**
     * AI-based simulation of scanning a document for compliance.
     * In production, this would use OCR/NLP models to parse DHS form fields.
     */
    async scanDocument(documentId, documentContentBase64, category) {
        console.log(`[AUDIT_SHIELD] Scanning document ${documentId} [Category: ${category}]`);
        
        // Simulated AI Scan latency
        await new Promise(resolve => setTimeout(resolve, 800));

        let isCompliant = true;
        let reasons = [];

        // Simple heuristic mocks based on base64 content
        if (!documentContentBase64 || documentContentBase64.length < 50) {
            isCompliant = false;
            reasons.push("Document content is too short or empty.");
        }

        // Mock specific checks
        if (category === 'CLINICAL' && Math.random() < 0.2) {
            isCompliant = false;
            reasons.push("Missing required signature on page 3.");
        }

        if (category === 'ID' && Math.random() < 0.1) {
            isCompliant = false;
            reasons.push("ID appears expired or illegible.");
        }

        return {
            isCompliant,
            reasons
        };
    }

    /**
     * Audit a participant's entire file before generating a claim.
     */
    async preClaimAudit(participantId) {
        console.log(`[AUDIT_SHIELD] Running Pre-Claim Audit for Participant ${participantId}`);
        
        const docs = await query(`SELECT * FROM documents WHERE participant_id = ?`, [participantId]);
        
        let auditPassed = true;
        let failedDocs = [];

        for (const doc of docs) {
            if (doc.compliance_status !== 'COMPLIANT') {
                auditPassed = false;
                failedDocs.push({
                    id: doc.id,
                    filename: doc.filename,
                    status: doc.compliance_status,
                    reason: doc.audit_reason
                });
            }
        }

        return {
            auditPassed,
            failedDocs,
            message: auditPassed 
                ? "Participant file is fully compliant." 
                : "Participant file has non-compliant documents hindering claims."
        };
    }
}

module.exports = new AuditService();
