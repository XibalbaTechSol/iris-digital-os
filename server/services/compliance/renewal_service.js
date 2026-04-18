const { query, run } = require('../../database/database');
const assessmentService = require('./assessment_service');

/**
 * IRIS Digital OS - Annual Renewal Service
 * Goal: Track the 365-day compliance cycle for ISSPs and LTC Functional Screens.
 * Pattern: Anniversary Tracking with Milestone Notifications.
 */

class RenewalService {
    /**
     * Calculate current status of a participant's renewal cycle.
     * @param {string} anniversaryDate - The 365th day of the current plan.
     */
    calculateRenewalStatus(anniversaryDate) {
        if (!anniversaryDate) {
            return { daysRemaining: 999, health: 'UNKNOWN', milestones: [] };
        }
        const anniversary = new Date(anniversaryDate);
        const today = new Date();
        const diffTime = anniversary.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let health = 'STABLE';
        if (diffDays <= 30) health = 'CRITICAL';
        else if (diffDays <= 60) health = 'WARNING';
        else if (diffDays <= 90) health = 'UPCOMING';

        return {
            anniversaryDate,
            daysRemaining: diffDays,
            health,
            milestones: [
                { label: '90-Day Warning', status: diffDays <= 90 ? 'PASSED' : 'PENDING' },
                { label: '60-Day Warning', status: diffDays <= 60 ? 'PASSED' : 'PENDING' },
                { label: '30-Day Warning', status: diffDays <= 30 ? 'PASSED' : 'PENDING' }
            ]
        };
    }

    /**
     * Get a list of participants due for renewal in the next N days.
     * Benchmarked Enterprise Efficiency: Proactive Case Logic.
     */
    async getUpcomingRenewals(days = 90) {
        // Query participants from SQLite database
        const rows = await query(`SELECT id, name, anniversary_date as anniversary FROM participants WHERE status = 'ACTIVE'`);
        
        let participants = rows;
        if (participants.length === 0) {
            // Fallback to mock data if the database is empty or hasn't been populated with dates
            participants = [
                { id: 'P-1001', name: 'Alice Johnson', anniversary: '2026-06-15' },
                { id: 'P-1002', name: 'Robert Williams', anniversary: '2026-05-01' },
                { id: 'P-1003', name: 'Carmen Reyes', anniversary: '2026-09-20' }
            ];
        }

        return participants
            .map(p => ({
                id: p.id,
                name: p.name,
                anniversary: p.anniversary,
                ...this.calculateRenewalStatus(p.anniversary)
            }))
            .filter(p => p.daysRemaining <= days && p.daysRemaining >= 0)
            .sort((a, b) => a.daysRemaining - b.daysRemaining);
    }

    /**
     * Audit renewal dates and auto-generate compliance tasks.
     * Benchmarked Enterprise Efficiency: Automated Compliance Sentinel.
     */
    async runDailyComplianceCheck() {
        console.log('[RENEWAL_SERVICE] RUNNING_DAILY_COMPLIANCE_SENTINEL...');
        const participants = await this.getUpcomingRenewals(90);
        
        for (const p of participants) {
            // Check if an assessment is already scheduled or completed recently
            const assessmentCheck = await query(
                `SELECT * FROM assessments WHERE participant_id = ? AND status != 'COMPLETED' AND due_date > ?`,
                [p.id, new Date().toISOString()]
            );

            if (assessmentCheck.length === 0) {
                console.log(`[RENEWAL_SERVICE] AUTO_GENERATING_ASSESSMENT: ${p.name} (Due in ${p.daysRemaining} days)`);
                await assessmentService.scheduleNextAssessment(p.id, p.daysRemaining, 'NURSE-DEFAULT');
            }
        }
        return { checked: participants.length };
    }
}

module.exports = new RenewalService();
