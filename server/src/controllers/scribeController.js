const db = require('../config/database');
const ScribeService = require('../services/clinical/scribe_service');
const crypto = require('crypto');

/**
 * IRIS Digital OS - Clinical Scribe Controller
 */
class ScribeController {
    /**
     * Process session transcript into clinical notes.
     */
    async processSession(req, res) {
        const { transcript } = req.body;
        if (!transcript) return res.status(400).json({ error: 'TRANSCRIPT_REQUIRED' });

        try {
            const proposal = await ScribeService.processTranscript(transcript);
            res.json({ success: true, proposal });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Commit the finalized AI note to the database.
     */
    async saveNote(req, res) {
        const { participantId, authorId, content, summary, actionItems, riskAssessment } = req.body;
        const noteId = `NOTE-${crypto.randomUUID().substring(0, 8)}`;

        try {
            await db.run(
                `INSERT INTO progress_notes (id, participant_id, author_id, content, summary, action_items, risk_assessment)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [noteId, participantId, authorId, content, summary, JSON.stringify(actionItems), riskAssessment]
            );

            console.log(`[SCRIBE] NOTE_SAVED: ${noteId} for ${participantId}`);
            res.json({ success: true, noteId });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * Retrieve notes for a participant.
     */
    async getNotes(req, res) {
        const { participantId } = req.params;
        try {
            const notes = await db.query('SELECT * FROM progress_notes WHERE participant_id = ? ORDER BY created_at DESC', [participantId]);
            res.json({ success: true, notes });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new ScribeController();
