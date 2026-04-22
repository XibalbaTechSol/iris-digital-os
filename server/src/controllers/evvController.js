/**
 * IRIS Digital OS - EVV Controller
 * Goal: Manage visit submissions, pre-check validation, and SQLite permanence.
 */

const sandataValidator = require('../services/compliance/sandata_validator');
const SandataProxy = require('../services/compliance/sandata_proxy');
const db = require('../config/database');

const proxy = new SandataProxy({ baseUrl: 'MOCK' });

const submitVisit = async (req, res) => {
    const { visit } = req.body;

    try {
        // 1. Run Pre-Check
        const context = {
            enrollments: ['MCI-123456', 'MCI-789012'],
            authorizedServices: ['SHC', 'RESPITE'],
            primaryResidenceGps: { lat: 43.0731, lng: -89.4012 }
        };

        const validation = await sandataValidator.validateVisit(visit, context);

        if (!validation.isValid) {
            return res.status(422).json({
                success: false,
                message: "Sandata Pre-Check Failed",
                errors: validation.errors,
                rejectionProbability: validation.rejectionProbability
            });
        }

        // 2. Save locally into SQLite for dashboard routing
        const localId = `EVV-${Math.floor(Math.random() * 900000) + 100000}`;
        const clockIn = visit.callInTime || new Date().toISOString();
        const clockOut = visit.callOutTime || null;

        await db.run(
            `INSERT INTO evv_visits (id, worker_id, participant_id, service_code, clock_in, clock_out, lat, lng, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [localId, visit.staffId || 'UNKNOWN', visit.participantId || 'UNKNOWN', visit.service || 'T1019', clockIn, clockOut, visit.gps?.lat || null, visit.gps?.lng || null, 'PENDING_AGGREGATOR']
        );

        // 3. Push to Sandata (Async)
        const result = await proxy.pushVisits([visit]);

        // Optional: Update status when result is successful
        await db.run(`UPDATE evv_visits SET status = 'ACCEPTED' WHERE id = ?`, [localId]);

        res.json({
            success: true,
            message: "Visit accepted, logged locally, and queued for Sandata aggregator.",
            transactionId: result.transactionId,
            warnings: validation.errors.filter(e => e.severity === 'WARNING')
        });

    } catch (error) {
        console.error('[EVV_CONTROLLER_ERROR]', error);
        res.status(500).json({ error: "Visit submission failed." });
    }
};

module.exports = {
    submitVisit
};
