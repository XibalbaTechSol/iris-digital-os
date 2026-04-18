/**
 * IRIS OS - Case Management Controller
 * Handles clinical notes, budget queries, and ISSP data via SQLite Database.
 */
const CryptoService = require('../services/security/crypto_service');
const RenewalService = require('../services/compliance/renewal_service');
const SecurityAuditService = require('../services/security/audit_service');
const db = require('../database/database');

const getNotes = async (req, res) => {
    const { participantId } = req.params;
    const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
    console.log(`[CASE_CTRL] GET_NOTES (DB): ${participantId}`);
    try {
        const notes = await db.query('SELECT * FROM case_notes WHERE participant_id = ?', [participantId]);
        
        // HIPAA: Log chart note access
        await SecurityAuditService.logEvent({
            userId,
            action: 'PHI_ACCESS_VIEWED',
            moduleId: 'CASE_MGMT',
            metadata: { participantId, count: notes.length, type: 'CASE_NOTES' },
            ipAddress: req.ip
        });

        // Format to map snake_case to camelCase
        const formattedNotes = notes.map(n => ({
            id: n.id,
            participantId: n.participant_id,
            encounterType: n.encounter_type,
            narrative: CryptoService.decrypt(n.narrative), // HIPAA Decryption
            authorId: n.author_id,
            status: n.status,
            signatureHash: n.signature_hash,
            createdAt: n.created_at
        }));
        res.json({ success: true, notes: formattedNotes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database query failed' });
    }
};

const createNote = async (req, res) => {
    const { participantId, encounterType, narrative, authorId } = req.body;
    
    if (!narrative || narrative.trim().length < 10) {
        return res.status(400).json({ success: false, error: 'Narrative must be at least 10 characters.' });
    }

    const id = `N-${Date.now()}`;
    const encryptedNarrative = CryptoService.encrypt(narrative);
    const signatureHash = require('crypto').createHash('sha256').update(narrative + authorId + Date.now()).digest('hex').slice(0, 16);

    try {
        await db.run(
            `INSERT INTO case_notes (id, participant_id, encounter_type, narrative, author_id, status, signature_hash) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, participantId, encounterType, encryptedNarrative, authorId, 'SIGNED', signatureHash]
        );
        console.log(`[CASE_CTRL] NOTE_SIGNED_AND_SAVED: ${id} by ${authorId}`);
        res.json({ success: true, note: { id, participantId, encounterType, narrative: '[PHI_ENCRYPTED]', authorId, status: 'SIGNED', signatureHash } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to create note' });
    }
};

const getBudget = async (req, res) => {
    const { participantId } = req.params;
    console.log(`[CASE_CTRL] GET_BUDGET (DB): ${participantId}`);
    
    try {
        const budgets = await db.query('SELECT * FROM budgets WHERE participant_id = ?', [participantId]);
        if (budgets.length > 0) {
            const b = budgets[0];
            res.json({
                success: true,
                budget: {
                    participantId: b.participant_id,
                    authorizedAmount: b.authorized_amount,
                    paidAmount: b.paid_amount,
                    pendingAmount: b.pending_amount,
                    costShareStatus: b.cost_share_status,
                    planYear: b.plan_year,
                    lastUpdated: b.last_updated
                }
            });
        } else {
            res.status(404).json({ success: false, error: 'Budget not found for this participant' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Database query failed' });
    }
};

const getRenewals = async (req, res) => {
    try {
        const { participantId } = req.params;
        console.log(`[CASE_CTRL] GET_RENEWALS: ${participantId}`);

        if (participantId === 'ALL') {
            const renewals = await RenewalService.getUpcomingRenewals(365);
            return res.json({
                success: true,
                renewals
            });
        }

        // Single participant logic
        const rows = await db.query(`SELECT anniversary_date FROM participants WHERE id = ?`, [participantId]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Participant not found' });
        
        const anniDate = rows[0].anniversary_date;
        const status = RenewalService.calculateRenewalStatus(anniDate); 

        res.json({
            success: true,
            renewal: {
                participantId,
                anniversaryDate: status.anniversaryDate,
                daysRemaining: status.daysRemaining,
                health: status.health,
                milestones: status.milestones,
                ltcfsStatus: 'COMPLETED',
                isspStatus: 'IN_PROGRESS',
                riskAgreementStatus: 'PENDING',
                submissionStatus: 'NOT_STARTED',
                history: [
                    { year: 2025, completedAt: '2025-06-12' },
                    { year: 2024, completedAt: '2024-06-15' }
                ]
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Database query failed' });
    }
};

const getParticipants = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
        const participants = await db.query('SELECT * FROM participants');
        
        // HIPAA: Log overall list access
        await SecurityAuditService.logEvent({
            userId,
            action: 'PHI_ACCESS_VIEWED',
            moduleId: 'CASE_MGMT',
            metadata: { count: participants.length, type: 'PARTICIPANT_LIST' },
            ipAddress: req.ip
        });

        const formatted = participants.map(p => ({
            id: p.id,
            name: p.name,
            mci: CryptoService.decrypt(p.mci_id), // PHI Decryption
            county: p.county,
            ica: p.ica,
            riskLevel: p.risk_level,
            status: p.status,
            renewalDate: p.anniversary_date
        }));
        res.json({ success: true, participants: formatted });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to fetch participants' });
    }
};

const getWorkers = async (req, res) => {
    try {
        const { participantId } = req.params;
        const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
        const workers = await db.query('SELECT * FROM workers WHERE participant_id = ?', [participantId]);
        
        // HIPAA: Log specific chart worker access
        await SecurityAuditService.logEvent({
            userId,
            action: 'PHI_ACCESS_VIEWED',
            moduleId: 'CASE_MGMT',
            metadata: { participantId, count: workers.length, type: 'WORKER_LIST' },
            ipAddress: req.ip
        });

        const formatted = workers.map(w => ({
            id: w.id,
            name: w.name,
            relationship: w.relationship,
            rate: w.rate,
            weeklyHrs: w.weekly_hrs,
            status: w.status,
            phone: w.phone,
            hireDate: w.hire_date,
            bgCheck: w.bg_check
        }));
        res.json({ success: true, workers: formatted });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Failed to fetch workers' });
    }
};

module.exports = { getNotes, createNote, getBudget, getRenewals, getParticipants, getWorkers };
