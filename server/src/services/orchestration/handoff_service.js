const { db, run, query } = require('../../config/database');
const auditService = require('../security/audit_service');
const assessmentService = require('../compliance/assessment_service');

/**
 * IRIS Digital OS - Handoff & Accountability Service
 * Goal: Manage the 'Digital Handshake' between ADRC, ICA, and SDPC Oversight Agencies.
 */
class HandoffService {
    
    /**
     * Initiate a handoff from ADRC to ICA.
     * Involves signing a release manifest.
     */
    async initiateHandoff(leadId, targetIcaId, agentSignature) {
        console.log(`[HANDOFF_SERVICE] INITIATING_TRANSFER: LEAD_${leadId} -> ICA_${targetIcaId}`);
        
        // 1. Fetch lead data
        const leads = await query(`SELECT * FROM leads WHERE id = ?`, [leadId]);
        if (leads.length === 0) throw new Error('Lead not found');
        const lead = leads[0];

        // 2. Create Transfer Manifest Entry
        const manifestId = `MANIFEST-${Date.now()}`;
        
        // Log the release to primary core (Audit)
        await auditService.logAction({
            action: 'REFERRAL_RELEASED',
            userId: 'ADRC_AGENT_01',
            metadata: {
                leadId,
                targetIcaId,
                manifestId,
                signature: agentSignature,
                timestamp: new Date().toISOString()
            }
        });

        // 3. Update Lead Stage and metadata
        await run(`UPDATE leads SET stage = 'HANDOFF_PENDING', priority = 'HIGH' WHERE id = ?`, [leadId]);

        // 4. Create Referral Entry for ICA (The Handshake)
        await run(`INSERT INTO referrals (id, participant_name, status, welcome_call_deadline) 
                   VALUES (?, ?, 'HANDOFF_PENDING', ?)`,
                   [leadId, lead.name, this.calculateDeadline(72)]);

        return { success: true, manifestId };
    }

    /**
     * ICA accepts the referral, completing the handshake.
     */
    async acceptReferral(referralId, icaWorkerId, acceptanceSignature) {
        console.log(`[HANDOFF_SERVICE] ACCEPTING_REFERRAL: ${referralId} BY WORKER_${icaWorkerId}`);

        // 1. Log Acceptance
        await auditService.logAction({
            action: 'REFERRAL_ACCEPTED',
            userId: icaWorkerId,
            metadata: {
                referralId,
                signature: acceptanceSignature,
                timestamp: new Date().toISOString()
            }
        });

        // 2. Convert Lead/Referral to active Participant
        const referrals = await query(`SELECT * FROM referrals WHERE id = ?`, [referralId]);
        if (referrals.length === 0) throw new Error('Referral not found');
        const ref = referrals[0];

        // Move to participants table (Clinical Core)
        const participantId = `P-${Date.now()}`;
        await run(`INSERT INTO participants (id, name, ica, risk_level, status) 
                   VALUES (?, ?, 'CONNECTIONS_ICA', 'MEDIUM', 'ACTIVE')`,
                   [participantId, ref.participant_name]);

        // 3. Cleanup Referral status
        await run(`UPDATE referrals SET status = 'ACCEPTED' WHERE id = ?`, [referralId]);
        
        // 4. TRIGGER WORKFLOW AUTOMATION
        // A. Schedule Initial Nursing Assessment (per Phase 21 logic)
        await assessmentService.scheduleNextAssessment(participantId, 30, 'NURSE-DEFAULT'); // 30-day initial target

        // B. Auto-Authorize Budget placeholder for FEA
        await run(`INSERT INTO budgets (participant_id, authorized_amount, paid_amount, pending_amount) 
                   VALUES (?, ?, 0, 0)`, [participantId, 0]);

        // Complete the lead conversion in CRM
        await run(`UPDATE leads SET stage = 'CONVERTED' WHERE id = ?`, [referralId]);

        return { success: true, participantId };
    }

    /**
     * SDPC Transfer Logic (ICA -> SDPC Oversight Agency).
     */
    async initiateSDPCTransfer(participantId, targetSdpcAgencyId, icSignature) {
        console.log(`[HANDOFF_SERVICE] SDPC_TRANSFER: PART_${participantId} -> SDPC_${targetSdpcAgencyId}`);

        // 1. Log SDPC Referral
        await auditService.logAction({
            action: 'SDPC_REFERRAL_SENT',
            userId: 'ICA_CONSULTANT_01',
            metadata: {
                participantId,
                targetSdpcAgencyId,
                signature: icSignature
            }
        });

        // 2. Automated data sharing logic here
        // (In production, this would bridge records to the SDPC-specific tenant)
        
        return { success: true, transferId: `SDPC-TR-${Date.now()}` };
    }

    calculateDeadline(hours) {
        const date = new Date();
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    }
}

module.exports = new HandoffService();
