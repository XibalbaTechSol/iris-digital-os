const db = require('../../config/database');

/**
 * IRIS Digital OS - Automated Alert Service
 * Goal: Proactively detect and surface risks across the clinical ecosystem.
 */
class AlertService {
    /**
     * Evaluate an audit event for potential risks.
     */
    async processEvent(event) {
        // Rule 1: Rapid PHI Viewing (Potential Scraping)
        if (event.action === 'PHI_ACCESS_VIEWED') {
            await this.detectScrapingPattern(event.userId);
        }

        // Rule 2: Critical Incident Detection
        if (event.action === 'INCIDENT_REPORTED' && event.metadata?.status === 'CRITICAL') {
            await this.raiseAlert({
                severity: 'CRITICAL',
                title: 'CRITICAL_INCIDENT_REPORTED',
                message: `A critical incident has been reported for Participant ${event.metadata.participantId}.`,
                type: 'CLINICAL'
            });
        }
    }

    /**
     * Detect if a user is opening many charts in a short window.
     * Logic: In a real system, we would query the last 5 minutes of logs. 
     * For this demo, we simulate a 'High Frequency' trigger.
     */
    async detectScrapingPattern(userId) {
        // Implementation simulation
        // In reality: const count = await AuditService.getRecentAccessCount(userId, 5);
        // if (count > 20) { ... }
    }

    /**
     * Create a new system-wide alert.
     */
    async raiseAlert(alert) {
        console.log(`[ALERT_SERVICE] RAISING_ALERT: ${alert.title}`);
        try {
            await db.run(
                `INSERT INTO alerts (severity, title, message, type, status) VALUES (?, ?, ?, ?, 'NEW')`,
                [alert.severity, alert.title, alert.message, alert.type]
            );
        } catch (err) {
            console.error('[ALERT_SERVICE] SAVE_FAILED:', err);
        }
    }

    /**
     * Retrieve current active alerts.
     */
    async getActiveAlerts() {
        return await db.query(`SELECT * FROM alerts WHERE status != 'DISMISSED' ORDER BY created_at DESC`);
    }

    /**
     * Acknowledge or Dismiss an alert.
     */
    async updateAlertStatus(id, status) {
        return await db.run(`UPDATE alerts SET status = ? WHERE id = ?`, [status, id]);
    }
}

module.exports = new AlertService();
