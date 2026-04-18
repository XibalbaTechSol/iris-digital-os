const AuditService = require('../services/security/audit_service');

class SecurityController {
    /**
     * POST /api/v1/security/audit
     * Log a user action to the verifiable audit trail.
     */
    async logAction(req, res) {
        // In a real app, we would get this from the JWT session
        const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
        const ipAddress = req.ip;

        try {
            if (Array.isArray(req.body)) {
                // Batch Logging Queue payload
                const events = req.body.map(e => ({
                    userId,
                    ipAddress,
                    action: e.action,
                    moduleId: e.moduleId,
                    metadata: e.metadata
                }));
                const result = await AuditService.logBatchEvents(events);
                res.json(result);
            } else {
                // Single event fallback
                const { action, moduleId, metadata } = req.body;
                console.log(`[SECURITY_CTRL] LOGGING_ACTION: ${action} by ${userId}`);
                await AuditService.logEvent({
                    userId,
                    action,
                    moduleId,
                    metadata,
                    ipAddress
                });
                res.json({ success: true });
            }
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    }

    /**
     * GET /api/v1/security/audit
     * Retrieve audit history for compliance review with filtering.
     */
    async getAuditLogs(req, res) {
        try {
            const logs = await AuditService.getAuditHistory(req.query);
            res.json(logs);
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    }
}

module.exports = new SecurityController();
