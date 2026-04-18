/**
 * IRIS Digital OS - Incident Controller (Phase 7)
 * Goal: Manage and escalate incidents using NLP detection via SQLite.
 */
const db = require('../database/database');
const SDOHService = require('../services/ai/sdoh_service');

const submitIncident = async (req, res) => {
    const { incidentData } = req.body;

    try {
        const id = `INC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const type = incidentData.type || 'GENERAL';
        const narrative = incidentData.narrative || '';
        
        await db.run(
            `INSERT INTO incidents (id, type, status, narrative) VALUES (?, ?, ?, ?)`,
            [id, type, 'ACTIVE', narrative]
        );

        console.log(`[INCIDENT] New incident reported: ${type}`);
        
        res.status(201).json({
            success: true,
            message: "Incident reported and escalated to 24-hour trigger queue.",
            incident_id: id
        });
    } catch (error) {
        console.error('[INCIDENT_ERROR]', error);
        res.status(500).json({ error: "Failed to report incident." });
    }
};

const getActiveIncidents = async (req, res) => {
    try {
        const incidents = await db.query("SELECT * FROM incidents WHERE status != 'RESOLVED' ORDER BY reported_at DESC");
        res.json({
            success: true,
            incidents: incidents.map(inc => ({
                id: inc.id,
                type: inc.type,
                status: inc.status,
                narrative: inc.narrative,
                reported_at: inc.reported_at
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to retrieve incidents' });
    }
};

const analyzeIncident = async (req, res) => {
    const { narrative } = req.body;
    
    try {
        const analysis = await SDOHService.analyzeRisk(narrative);
        res.json({
            success: true,
            ...analysis
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    submitIncident,
    getActiveIncidents,
    analyzeIncident
};
