const db = require('../../config/database');

/**
 * IRIS Digital OS - Billing Audit Service
 * Goal: Proactive detection of DHS/CMS billing anomalies.
 */
class BillingAuditService {
    /**
     * Run a recursive audit on a set of visits before they are batched into an 837P.
     */
    async auditVisits(visits) {
        let results = [];
        for (const visit of visits) {
            const audit = await this.auditSingleVisit(visit);
            results.push({
                visitId: visit.id,
                ...audit
            });
        }
        return results;
    }

    /**
     * Audit rules for a single clinical visit.
     */
    async auditSingleVisit(visit) {
        const warnings = [];
        let score = 100;

        // Rule 1: Overlap Detection (Critical)
        const overlaps = await db.query(
            `SELECT id FROM evv_visits 
             WHERE participant_id = ? 
             AND id != ?
             AND (
                (clock_in <= ? AND clock_out >= ?) OR
                (clock_in <= ? AND clock_out >= ?) OR
                (clock_in >= ? AND clock_out <= ?)
             )`,
            [visit.participant_id || visit.participant, visit.id, visit.clock_out, visit.clock_out, visit.clock_in, visit.clock_in, visit.clock_in, visit.clock_out]
        );

        if (overlaps.length > 0) {
            warnings.push({ type: 'CRITICAL', code: 'OVERLAP_DETECTED', message: `Visit overlaps with ${overlaps.length} other shift(s).` });
            score -= 50;
        }

        // Rule 2: Prior Authorization Units
        const auths = await db.query(
            `SELECT requested_units FROM prior_authorizations WHERE participant_id = ? AND status = 'APPROVED'`,
            [visit.participant_id || visit.participant]
        );
        
        const unitsRequested = visit.units || 4;
        if (auths.length === 0) {
            warnings.push({ type: 'WARNING', code: 'NO_ACTIVE_AUTH', message: 'No approved Prior Authorization found for this participant.' });
            score -= 20;
        } else if (unitsRequested > auths[0].requested_units) {
            warnings.push({ type: 'ERROR', code: 'UNITS_EXCEED_AUTH', message: `Units (${unitsRequested}) exceed authorized limit (${auths[0].requested_units}).` });
            score -= 30;
        }

        // Rule 3: EVV Health
        if (visit.status === 'PENDING') {
            warnings.push({ type: 'WARNING', code: 'UNVERIFIED_EVV', message: 'Visit is not yet verified in Sandata/MCI Aggregator.' });
            score -= 10;
        }

        return {
            complianceScore: Math.max(0, score),
            warnings,
            auditPassed: score >= 80
        };
    }
}

module.exports = new BillingAuditService();
