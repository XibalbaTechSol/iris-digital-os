const db = require('../../database/database');
const SandataAPIService = require('./sandata_api_service');
const EDIService = require('../financials/edi_service');

/**
 * IRIS Digital OS - State Gateway Orchestrator
 * Goals: 
 * 1. Persistent queueing for state database packets.
 * 2. Automated retries for failed transmissions.
 * 3. Unified telemetry for Sandata, ForwardHealth, and WORCS.
 */
class StateGateway {
    /**
     * Queue a packet for transmission.
     * @param {string} service 'SANDATA' | 'FORWARDHEALTH' | 'WORCS'
     * @param {Object} payload The data to be sent.
     */
    async queueTransmission(service, payload) {
        console.log(`[STATE_GATEWAY] QUEUEING_${service}_PACKET`);
        const sql = `INSERT INTO state_transmissions (service_type, payload, status) VALUES (?, ?, 'PENDING')`;
        try {
            const result = await db.run(sql, [service, JSON.stringify(payload)]);
            const transmissionId = result.lastID;
            
            // Trigger background processing (Fire and Forget)
            this.processTransmission(transmissionId).catch(err => {
                console.error(`[STATE_GATEWAY] PROCESS_ID_${transmissionId}_FAILED:`, err.message);
            });
            
            return { success: true, transmissionId };
        } catch (err) {
            console.error('[STATE_GATEWAY] QUEUE_FAILED:', err);
            throw err;
        }
    }

    /**
     * Attempt to deliver a specific transmission.
     */
    async processTransmission(id) {
        const rows = await db.query(`SELECT * FROM state_transmissions WHERE id = ?`, [id]);
        if (rows.length === 0) return;
        const record = rows[0];

        if (record.status === 'SUCCESS' || record.attempts >= 5) return;

        console.log(`[STATE_GATEWAY] PROCESSING_ID_${id} (Attempt ${record.attempts + 1})`);

        let result;
        try {
            const payload = JSON.parse(record.payload);
            
            switch (record.service_type) {
                case 'SANDATA':
                    result = await SandataAPIService.transmitBatch([payload], {});
                    break;
                case 'FORWARDHEALTH':
                    // In a real system, this would trigger an SFTP upload of the 837P
                    result = await this.simulateForwardHealthSync(payload);
                    break;
                case 'WORCS':
                    result = await this.simulateWORCSVaultSync(payload);
                    break;
                default:
                    throw new Error(`Unknown service: ${record.service_type}`);
            }

            if (result.success) {
                await db.run(
                    `UPDATE state_transmissions SET status = 'SUCCESS', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [id]
                );
                console.log(`[STATE_GATEWAY] ID_${id}_SUCCESS: ${record.service_type}`);
            } else {
                throw new Error(result.error || 'Unknown failure');
            }
        } catch (err) {
            console.error(`[STATE_GATEWAY] ID_${id}_ATTEMPT_FAILED:`, err.message);
            await db.run(
                `UPDATE state_transmissions SET status = 'FAILED', attempts = attempts + 1, last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [err.message, id]
            );
        }
    }

    /**
     * Simulation for ForwardHealth EDI/SFTP Logic
     */
    async simulateForwardHealthSync(payload) {
        // Generating the actual EDI string to simulate heavy-lifting
        const ediString = EDIService.generate837P(payload.batchId, payload.claims);
        console.log(`[FORWARDHEALTH_EDI] Generating X12 Packet (Length: ${ediString.length})`);
        return { success: true, transactionId: `EDI_${Date.now()}` };
    }

    /**
     * Simulation for WORCS Background Check CSV Upload
     */
    async simulateWORCSVaultSync(payload) {
        console.log(`[WORCS_SYNC] Generating CSV for ${payload.workerName}...`);
        // Format: FName, LName, DOB, Race, Sex, SSN
        const csvLine = `${payload.firstName},${payload.lastName},${payload.dob},${payload.race},${payload.sex},${payload.ssn}`;
        return { success: true, vaultId: `WORCS_${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
    }

    /**
     * Get recent status for the Telemetry UI
     */
    async getTelemetry() {
        return await db.query(`SELECT * FROM state_transmissions ORDER BY created_at DESC LIMIT 50`);
    }
}

module.exports = new StateGateway();
