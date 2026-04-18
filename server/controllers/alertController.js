const AlertService = require('../services/security/alert_service');

/**
 * IRIS Digital OS - Alert Controller
 */
const getAlerts = async (req, res) => {
    try {
        const alerts = await AlertService.getActiveAlerts();
        res.json({ success: true, alerts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const updateAlert = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await AlertService.updateAlertStatus(id, status);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { getAlerts, updateAlert };
