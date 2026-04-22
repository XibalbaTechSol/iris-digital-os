const db = require('../../config/database');

/**
 * IRIS Digital OS - Document Lifecycle & Compliance Service
 * Goal: Hardening the "Document Debt" monitoring and audit workflows.
 */
class DocumentLifecycleService {
    /**
     * Audit the health of documents for a specific entity.
     * @param {string} id Participant or Worker ID
     * @param {string} type 'PARTICIPANT' | 'WORKER'
     */
    async auditEntityHealth(id, type) {
        console.log(`[DOC_LIFECYCLE] AUDITING_${type}_${id}`);
        
        const docs = await db.query(`SELECT * FROM documents WHERE participant_id = ? OR id IN (SELECT id FROM documents WHERE participant_id = ?)`, [id, id]);
        
        const requirements = type === 'WORKER' 
            ? ['I-9', 'F-82064', 'F-01201'] 
            : ['F-00075', 'F-01309', 'F-01201A'];

        const results = {
            id,
            type,
            score: 0,
            missing: [],
            expired: [],
            valid: []
        };

        for (const req of requirements) {
            const doc = docs.find(d => d.category === req);
            if (!doc) {
                results.missing.push(req);
            } else if (this.isExpired(doc)) {
                results.expired.push(req);
            } else {
                results.valid.push(req);
            }
        }

        results.score = (results.valid.length / requirements.length) * 100;
        return results;
    }

    /**
     * Expiration Logic (Wisconsin Compliance Standards)
     */
    isExpired(doc) {
        if (!doc.uploaded_at) return false;
        
        const uploadDate = new Date(doc.uploaded_at);
        const now = new Date();
        const diffYears = (now - uploadDate) / (1000 * 60 * 60 * 24 * 365.25);

        // F-82064 (Background Disclosure) must be renewed every 4 years in WI
        if (doc.category === 'F-82064' && diffYears >= 4) return true;
        
        // General 1-year expiration for annual forms (W-2, ISSP)
        const annualForms = ['W-2', 'F-01201A'];
        if (annualForms.includes(doc.category) && diffYears >= 1) return true;

        return false;
    }

    /**
     * Mass Compliance Scan
     * Returns entities with high "Document Debt" (Score < 100)
     */
    async scanSystemDebt() {
        // This would be a more complex join in production
        const workers = await db.query(`SELECT id FROM workers`);
        const debtEntities = [];

        for (const w of workers) {
            const health = await this.auditEntityHealth(w.id, 'WORKER');
            if (health.score < 100) {
                debtEntities.push(health);
            }
        }

        return debtEntities;
    }
}

module.exports = new DocumentLifecycleService();
