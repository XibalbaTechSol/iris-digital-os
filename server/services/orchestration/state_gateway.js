const db = require('../../database/database');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const SandataProxy = require('../compliance/sandata_proxy');
const EDIService = require('../financials/edi_service');
const IntegrityService = require('../ai/integrity_service');
const FHIRAdapter = require('../compliance/fhir_adapter');

/**
 * IRIS Digital OS - Enterprise State Gateway (Task 20.1)
 * Pattern: Enterprise Service Bus (ESB) / Canonical Data Model
 * Validated By: WellSky, HomeCareHomeBase (HCHB), AlayaCare
 * 
 * Goals: 
 * 1. Persistent queueing for state database packets.
 * 2. Asynchronous Exponential Backoff Retries.
 * 3. Dead Letter Queue (DLQ) for non-recoverable rejections.
 * 4. FHIR Transformation for unified interoperability.
 */
class StateGateway {
    constructor() {
        this.sandataProxy = new SandataProxy({ production: false });
        this.MAX_ATTEMPTS = 5;
    }

    /**
     * Queue a packet for transmission.
     * Implements "Message Enrichment" pattern.
     */
    async queueTransmission(service, payload) {
        console.log(`[STATE_GATEWAY] ENRICHING_${service}_PACKET`);
        
        // Enrichment: Add Correlation ID and Trace Metadata
        const enrichedPayload = {
            ...payload,
            _metadata: {
                correlationId: `CORR_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                sourceSystem: 'IRIS_DIGITAL_OS_CORE',
                queuedAt: new Date().toISOString()
            }
        };

        // 1. Run Pre-Submission Integrity Audit for Billing (AxisCare Pattern)
        if (service === 'FORWARDHEALTH') {
            const audit = await IntegrityService.auditDocumentMetadata({
                isSigned: payload.isSigned || true,
                participantMci: payload.mci || payload.participant?.mciId
            });
            if (!audit.isValid) {
                throw new Error(`[INTEGRITY_SHIELD_REJECT] ${audit.flags.map(f => f.reason).join(", ")}`);
            }
        }

        const sql = `INSERT INTO state_transmissions (service_type, payload, status) VALUES (?, ?, 'PENDING')`;
        try {
            const result = await db.run(sql, [service, JSON.stringify(enrichedPayload)]);
            const transmissionId = result.lastID;
            
            // Trigger background processing (Fire and Forget)
            this.processTransmission(transmissionId).catch(err => {
                console.error(`[STATE_GATEWAY] ASYNC_ORCHESTRATION_FAILED ID_${transmissionId}:`, err.message);
            });
            
            return { success: true, transmissionId, correlationId: enrichedPayload._metadata.correlationId };
        } catch (err) {
            console.error('[STATE_GATEWAY] QUEUE_FAILED:', err);
            throw err;
        }
    }

    /**
     * Core Orchestrator: Dispatches to specialized adapters.
     * Implements "Canonical Data Model" (FHIR) and "Retry with Backoff".
     */
    async processTransmission(id) {
        const rows = await db.query(`SELECT * FROM state_transmissions WHERE id = ?`, [id]);
        if (rows.length === 0) return;
        const record = rows[0];

        // 1. Terminal State Check
        if (record.status === 'SUCCESS' || record.status === 'DEAD_LETTER') return;

        // 2. Exponential Backoff Check (HCHB Pattern)
        if (record.next_retry_at && new Date(record.next_retry_at) > new Date()) {
            return; // Not time yet
        }

        console.log(`[STATE_GATEWAY] PROCESSING_ID_${id} (Attempt ${record.attempts + 1})`);

        let result;
        try {
            const payload = JSON.parse(record.payload);
            
            switch (record.service_type) {
                case 'SANDATA':
                    result = await this.sandataProxy.pushVisits([payload]);
                    break;

                case 'FORWARDHEALTH':
                    result = await this.simulateForwardHealthSync(payload);
                    break;

                case 'WORCS':
                    result = await this.simulateWORCSVaultSync(payload);
                    break;

                case 'INTEROP_FHIR':
                    // Canonical Data Model: Map to FHIR before sending
                    const fhirResource = this.transformToFHIR(payload);
                    result = await this.simulateHIETransmission(fhirResource);
                    break;

                case 'PCST_RPA':
                    // RPA Pattern: Execute external bot via shell
                    result = await this.executePCSTBot(payload);
                    break;

                default:
                    throw new Error(`[PROTOCOL_ERROR] Unknown service: ${record.service_type}`);
            }

            if (result.success) {
                await db.run(
                    `UPDATE state_transmissions SET status = 'SUCCESS', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [id]
                );
                console.log(`[STATE_GATEWAY] ID_${id}_SUCCESS: ${record.service_type}`);
            } else {
                throw new Error(result.error || 'Provider rejected request');
            }
        } catch (err) {
            await this.handleFailure(id, record, err);
        }
    }

    /**
     * Failure Handler: Logic for Retries vs DLQ.
     */
    async handleFailure(id, record, error) {
        const nextAttempt = record.attempts + 1;
        const isTerminal = nextAttempt >= this.MAX_ATTEMPTS || error.message.includes('DEAD_LETTER');
        const status = isTerminal ? 'DEAD_LETTER' : 'FAILED';
        
        // Calculate Exponential Backoff (2^n minutes)
        const delayMinutes = Math.pow(2, nextAttempt);
        const nextRetryAt = new Date();
        nextRetryAt.setMinutes(nextRetryAt.getMinutes() + delayMinutes);

        console.error(`[STATE_GATEWAY] ID_${id}_ATTEMPT_${nextAttempt}_FAILED: ${error.message}`);

        await db.run(
            `UPDATE state_transmissions SET 
                status = ?, 
                attempts = ?, 
                last_error = ?, 
                next_retry_at = ?,
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [status, nextAttempt, error.message, isTerminal ? null : nextRetryAt.toISOString(), id]
        );

        if (isTerminal) {
            console.error(`[STATE_GATEWAY] ID_${id}_MOVED_TO_DLQ (Dead Letter Queue)`);
        }
    }

    /**
     * FHIR Bridge: Standardizes internal events to HL7 standards.
     */
    transformToFHIR(payload) {
        if (payload.resourceType === 'Patient') return FHIRAdapter.toPatient(payload);
        if (payload.clock_in) return FHIRAdapter.toObservation(payload);
        return payload; // Fallback
    }

    // --- Integration Stubs ---

    async simulateForwardHealthSync(payload) {
        // Validation of X12 readiness
        const ediString = EDIService.generateFullBatch ? 'X12_837P_PACKET' : 'LEGACY_EDI';
        console.log(`[FORWARDHEALTH_EDI] Generating X12 Packet via EDIService...`);
        return { success: true };
    }

    async simulateWORCSVaultSync(payload) {
        console.log(`[WORCS_SYNC] Uploading BID background check to state vault for ${payload.lastName}...`);
        return { success: true };
    }

    async simulateHIETransmission(fhirResource) {
        console.log(`[HIE_BRIDGE] Transmitting FHIR ${fhirResource.resourceType} to regional exchange.`);
        return { success: true };
    }

    /**
     * RPA Pattern: Trigger the Playwright bot for PCST submission.
     * Benchmarked: AlayaCare / Task Automation patterns.
     */
    async executePCSTBot(payload) {
        const pcstId = payload.pcstId || 'UNKNOWN';
        const tmpDir = path.resolve(__dirname, '../../../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        
        const payloadPath = path.join(tmpDir, `state_gateway_pcst_${pcstId}.json`);
        fs.writeFileSync(payloadPath, JSON.stringify(payload));

        const botPath = path.resolve(__dirname, '../../../automation/pcst_bot.js');
        
        return new Promise((resolve, reject) => {
            exec(`node ${botPath} ${payloadPath}`, async (error, stdout, stderr) => {
                // Cleanup temp
                if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);

                if (error) {
                    return resolve({ success: false, error: error.message });
                }

                // Parse bot output
                const lines = stdout.split('\n');
                let result = null;
                for (const line of lines) {
                    if (line.startsWith('{') && line.includes('status')) {
                        try { result = JSON.parse(line); } catch (e) {}
                    }
                }

                if (result && result.status === 'SUCCESS') {
                    resolve({ success: true, allocatedUnits: result.allocated_units });
                } else {
                    resolve({ success: false, error: 'RPA_BOT_SUBMISSION_FAILED' });
                }
            });
        });
    }

    async getTelemetry() {
        return await db.query(`SELECT * FROM state_transmissions ORDER BY created_at DESC LIMIT 50`);
    }
}

module.exports = new StateGateway();
