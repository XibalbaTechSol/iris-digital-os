/**
 * IRIS Digital OS - PCST Controller
 */
const PcstService = require('../services/compliance/pcst_service');

class PcstController {
    createDraft = async (req, res) => {
        try {
            const { participantId, nurseId, adlData, allocatedUnits } = req.body;
            const result = await PcstService.createDraft(participantId, nurseId, adlData, allocatedUnits);
            res.json({ status: 'success', data: result });
        } catch (e) {
            console.error('[PCST_CONTROLLER]', e);
            res.status(500).json({ status: 'error', message: e.message });
        }
    };

    signAndSubmit = async (req, res) => {
        try {
            const { pcstId, signatureData } = req.body;
            // signatureData is expected to be a Base64 PNG
            const result = await PcstService.signAndSubmit(pcstId, signatureData);
            res.json({ status: 'success', data: result });
        } catch (e) {
            console.error('[PCST_CONTROLLER]', e);
            res.status(500).json({ status: 'error', message: e.message });
        }
    };

    // Helper to get pending screen for a participant
    getRecords = async (req, res) => {
        try {
            const db = require('../database/database');
            const rows = await db.query(`SELECT * FROM pcst_records WHERE participant_id = ? ORDER BY created_at DESC`, [req.params.participantId]);
            res.json(rows);
        } catch (e) {
            res.status(500).json({ status: 'error', message: e.message });
        }
    };
}

module.exports = new PcstController();
