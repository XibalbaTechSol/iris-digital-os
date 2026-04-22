const { db, run, query } = require('../../config/database');

/**
 * IRIS Digital OS - Referral Intake Service
 * Goal: Handle dual-mode arrival (Manual/SFTP) of participant referrals.
 * Pattern: State Machine with compliance deadlines (72h Contact / 60d Orientation).
 */
class ReferralIntakeService {
    constructor() {
        // No longer using in-memory store
    }

    /**
     * Process an incoming ADRC Referral (F-00075).
     */
    async processReferral(source, data) {
        console.log(`[REFERRAL_INTAKE] PROCESSING_${source}_ENTRY: ${data.participantName}`);
        
        const id = `REF-${Date.now()}`;
        const welcomeCallDeadline = this.calculateDeadline(72);
        const orientationDeadline = this.calculateDeadline(1440);
        
        await run(`INSERT INTO referrals (id, participant_name, status, welcome_call_deadline, orientation_deadline) 
                   VALUES (?, ?, 'RECEIVED', ?, ?)`, 
                   [id, data.participantName, welcomeCallDeadline, orientationDeadline]);

        // Note: For full production, forms tracking and history logs would get their own tables.
        // We're adapting the mock object to work with SQLite for the MVP.
        const referral = {
            id,
            mciId: data.mciId || 'PENDING',
            participantName: data.participantName,
            source,
            status: 'RECEIVED',
            welcomeCallDeadline,
            orientationDeadline,
        };
        
        console.log(`[EVENT_BUS] EMIT: REFERRAL_RECEIVED_${id}`);
        return referral;
    }

    /**
     * Transition a referral to the next state.
     */
    async updateStatus(referralId, newStatus, metadata = {}) {
        console.log(`[REFERRAL_INTAKE] STATUS_UPDATE: ${referralId} -> ${newStatus}`);
        
        await run(`UPDATE referrals SET status = ? WHERE id = ?`, [newStatus, referralId]);
        
        const rows = await query(`SELECT * FROM referrals WHERE id = ?`, [referralId]);
        if (rows.length === 0) throw new Error('Referral not found');

        return rows[0];
    }

    calculateDeadline(hours) {
        const date = new Date();
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    }

    async pollSFTPFolder() {
        console.log('[REFERRAL_INTAKE] POLLING_ADRC_SFTP_INBOUND...');
        const mockNewReferral = {
            participantName: 'James Miller',
            mciId: '9912837742'
        };
        
        if (Math.random() > 0.7) {
            return [await this.processReferral('SFTP', mockNewReferral)];
        }
        return [];
    }

    async getReferrals() {
        const rows = await query(`SELECT * FROM referrals ORDER BY created_at DESC`);
        return rows;
    }
}

module.exports = new ReferralIntakeService();
