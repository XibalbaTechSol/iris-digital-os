/**
 * IRIS Digital OS - Integrity Shield Service
 * Pattern: Pro-active Compliance Audit (Competitor: WellSky / AxisCare)
 * Goal: Identify non-billable activities in notes BEFORE submission.
 */

class IntegrityService {
    static FORBIDDEN_KEYWORDS = [
        "watched tv", "shopping", "grocery", "companion", "socialized",
        "entertainment", "recreation", "vacation", "movie", "restaurant",
        "bank", "churches", "friend", "party", "no care", "not home",
        "refused", "absent", "did not provide", "cancelled"
    ];

    /**
     * Audit a progress note for Medicaid billability.
     * @param {string} noteContent
     * @param {object} config { threshold: number }
     */
    async auditProgressNote(noteContent, config = { threshold: 75 }) {
        console.log(`[INTEGRITY_SHIELD] AUDITING_NOTE (THRESHOLD: ${config.threshold})...`);
        
        if (!noteContent || noteContent.trim().length < 15) {
            return {
                score: 10,
                isBillable: false,
                threshold: config.threshold,
                flags: [{ type: 'INSUFFICIENT_DETAIL', reason: 'Progress note is too short to document billable care activities.' }],
                suggestions: ["Provide specific details about ADL/IADL assistance provided."],
                timestamp: new Date().toISOString()
            };
        }
        
        const contentLower = noteContent.toLowerCase();
        const foundKeywords = IntegrityService.FORBIDDEN_KEYWORDS.filter(k => contentLower.includes(k));
        
        // Calculate Audit Score (0-100)
        const score = Math.max(0, 100 - (foundKeywords.length * 25));
        
        const isBillable = score >= config.threshold;
        const auditFlags = foundKeywords.map(k => ({
            type: 'NON_BILLABLE_ACTIVITY',
            keyword: k,
            reason: `Term '${k}' suggests social/recreational activity, which is not billable under T1019.`
        }));

        const suggestions = foundKeywords.map(k => {
            if (k === 'shopping') return "Replace with 'Essential errands for health/safety/nutrition support'.";
            if (k === 'watched tv') return "Non-billable. Remove.";
            return `Review purpose of ${k}. Ensure focus is on ADLs/IADLs.`;
        });

        return {
            score,
            isBillable,
            threshold: config.threshold,
            flags: auditFlags,
            suggestions,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Audit document metadata for compliance gaps.
     * Benchmarked Pattern: Automated QA for DHS Forms.
     */
    async auditDocumentMetadata(metadata) {
        console.log(`[INTEGRITY_SHIELD] AUDITING_DOCUMENT: ${metadata.formCode || 'UNKNOWN'}`);
        
        const flags = [];
        let score = 100;

        // 1. Signature Check
        if (!metadata.isSigned) {
            flags.push({ type: 'MISSING_SIGNATURE', priority: 'CRITICAL', reason: 'Official form requires a capture digital or physical signature.' });
            score -= 50;
        }

        // 2. Staleness Check
        if (metadata.lastVerified) {
            const lastVerified = new Date(metadata.lastVerified);
            const diffYears = (new Date() - lastVerified) / (1000 * 60 * 60 * 24 * 365.25);
            if (diffYears > 1) {
                flags.push({ type: 'STALE_DOCUMENT', priority: 'HIGH', reason: 'Form is older than 365 days and requires annual renewal.' });
                score -= 30;
            }
        }

        // 3. Identification Check
        if (!metadata.participantMci) {
            flags.push({ type: 'MISSING_IDENTIFIER', priority: 'CRITICAL', reason: 'Participant MCI (Master Customer Index) must be present for state submission.' });
            score -= 20;
        }

        return {
            isValid: score >= 80,
            score: Math.max(0, score),
            flags,
            suggestions: flags.map(f => `Action required for ${f.type}: ${f.reason}`),
            lastAuditAt: new Date().toISOString()
        };
    }
}

module.exports = new IntegrityService();
