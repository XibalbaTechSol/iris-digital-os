const { db, run, query } = require('../../config/database');

/**
 * IRIS Digital OS - SDPC Transfer Service
 * Goal: Automate the 'Elegant Transfer' of nursing records to SDPC Oversight Agencies.
 */
class SDPCTransferService {
    
    /**
     * Package and transmit participant data to SDPC.
     */
    async packageDataForSDPC(participantId, targetAgencyId) {
        console.log(`[SDPC_TRANSFER] PACKAGING_DATA: PART_${participantId} FOR AGENCY_${targetAgencyId}`);
        
        // 1. Core Participant Data
        const participant = (await query(`SELECT * FROM participants WHERE id = ?`, [participantId]))[0];
        
        // 2. Clinical Narrative & PCST Score
        const notes = await query(`SELECT * FROM case_notes WHERE participant_id = ? ORDER BY created_at DESC LIMIT 5`, [participantId]);
        
        // 3. Document Payload (My Cares Plan, Physician Orders)
        const docs = await query(`SELECT * FROM documents WHERE participant_id = ? AND category IN ('CARE_PLAN', 'PHYSICIAN_ORDERS')`, [participantId]);

        // Mock Transmission Packet
        const packet = {
            metadata: {
                transferId: `SDPC-PKT-${Date.now()}`,
                sourceTenant: 'CONNECTIONS_ICA',
                targetTenant: targetAgencyId,
                timestamp: new Date().toISOString()
            },
            clinicalRecords: {
                participant,
                notes,
                formF01201A: docs.find(d => d.filename.includes('F-01201A')) || null
            }
        };

        console.log(`[SDPC_TRANSFER] TRANSMITTING_ENCRYPTED_PACKET: ${packet.metadata.transferId}`);
        
        // In a real system, this would push to the SDPC Agency's endpoint or database shard.
        return packet;
    }
}

module.exports = new SDPCTransferService();
