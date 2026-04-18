/**
 * IRIS Digital OS - Clinical Audit Service
 * Goal: Automate clinical oversight for DHS compliance (P-00708).
 * Scans documentation for mandatory markers and structural integrity.
 */
const db = require('../../database/database');

class ClinicalAuditService {
    constructor() {
        this.MANDATORY_MARKERS = [
            { keyword: 'MCI', weight: 30, description: 'Member Identity Verification' },
            { keyword: 'GOAL', weight: 20, description: 'ISSP Alignment' },
            { keyword: 'RISK', weight: 15, description: 'Health & Safety Assessment' },
            { keyword: 'SELF-DIRECTION', weight: 15, description: 'Program Philosophy' },
            { keyword: 'AUTHORIZATION', weight: 20, description: 'Legal Signature / Consent' }
        ];
    }

    /**
     * Perform static analysis on a note.
     */
    async auditNote(noteId, content, participantId) {
        console.log(`[CLINICAL_AUDIT] SCANNING_NOTE: ${noteId} for P_${participantId}`);
        
        const results = {
            score: 0,
            findings: [],
            status: 'PENDING_CORRECTION'
        };

        const upperContent = content.toUpperCase();

        this.MANDATORY_MARKERS.forEach(marker => {
            if (upperContent.includes(marker.keyword)) {
                results.score += marker.weight;
            } else {
                results.findings.push(`Missing mandatory marker: [${marker.keyword}] - ${marker.description}`);
            }
        });

        // Determine Final Status
        if (results.score >= 80) {
            results.status = 'COMPLIANT';
        } else if (results.score >= 50) {
            results.status = 'PARTIAL_COMPLIANCE';
        }

        // 1. Update Document/Note status in DB
        await db.run(
            `UPDATE documents SET compliance_status = ?, audit_reason = ? WHERE id = ?`,
            [results.status, JSON.stringify(results.findings), noteId]
        );

        // 2. Trigger Alert if critical failure
        if (results.status === 'PENDING_CORRECTION') {
            await this.triggerAuditAlert(noteId, participantId, results.score);
        }

        return results;
    }

    async triggerAuditAlert(noteId, participantId, score) {
        await db.run(
            `INSERT INTO alerts (severity, title, message, type) VALUES (?, ?, ?, ?)`,
            ['HIGH', 'CLINICAL_AUDIT_FAILURE', `Record ${noteId} for Participant ${participantId} failed compliance audit (Score: ${score}). immediate correction required.`, 'CLINICAL']
        );
    }
}

module.exports = new ClinicalAuditService();
