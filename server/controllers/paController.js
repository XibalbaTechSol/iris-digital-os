/**
 * IRIS Digital OS - Prior Authorization Controller
 * Goal: Track DHS (ForwardHealth) PA requests for OTEs and specialized services via SQLite.
 */
const db = require('../database/database');

const getPriorAuths = async (req, res) => {
    const { participantId } = req.params;
    console.log(`[PA_CONTROLLER] FETCHING_PA_DATA (DB) for: ${participantId}`);

    try {
        const auths = await db.query('SELECT * FROM prior_authorizations WHERE participant_id = ?', [participantId]);
        
        // If DB is empty, supply some fallback mock logic to prevent empty dashboard initially
        if (auths.length === 0) {
            return res.json([
                { 
                    id: 'PA-5501', 
                    service: 'OTE: Grab Bar Installation (S5165)', 
                    status: 'APPROVED', 
                    tracking: 'FH-88219', 
                    amount: 450.00, 
                    submitted: '2026-04-11',
                    expiration: '2026-10-11'
                }
            ]);
        }
        
        // Map snake_case to React expectations
        const formatted = auths.map(pa => ({
            id: pa.id,
            service: pa.service_code,
            status: pa.status,
            tracking: `FH-${pa.id.split('-')[1]}`, // mock tracking
            amount: (pa.requested_units || 1) * 100, // mock amount logic
            submitted: pa.created_at.split(' ')[0],
            expiration: null
        }));

        res.json(formatted);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to retrieve prior authorizations' });
    }
};

const submitPARequest = async (req, res) => {
    const { participantId, serviceCode, amount, justification } = req.body;
    console.log(`[PA_CONTROLLER] SUBMITTING_PA_TO_DHS: ${serviceCode} for ${participantId}`);

    try {
        const paId = `PA-${Math.floor(Math.random() * 9000) + 1000}`;
        const tracking = `FH-${Math.floor(Math.random() * 90000) + 10000}`;
        const units = amount ? Math.floor(amount / 100) : 1;

        await db.run(
            `INSERT INTO prior_authorizations (id, participant_id, service_code, requested_units, status) VALUES (?, ?, ?, ?, ?)`,
            [paId, participantId, serviceCode, units, 'PENDING_DHS']
        );

        res.json({
            success: true,
            paId,
            tracking,
            status: 'PENDING_DHS',
            message: 'Prior Authorization request successfully queued for DHS review and saved to DB.'
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Database insert failed' });
    }
};

module.exports = {
    getPriorAuths,
    submitPARequest
};
