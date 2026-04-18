const db = require('../database/database');
const FHIRAdapter = require('../services/compliance/fhir_adapter');
const AuditService = require('../services/security/audit_service');

const PacketExportService = require('../services/orchestration/packet_export_service');

/**
 * IRIS Digital OS - FHIR Interop Controller
 * Goal: Secure, standardized data exchange (HL7 FHIR R4).
 */
class InteropController {
    /**
     * Export a full Patient Bundle (Clinical Summary).
     */
    async exportPatientRecord(req, res) {
        const { participantId } = req.params;
        const format = req.query.format || 'json';
        const partnerName = req.partner ? req.partner.name : 'ANONYMOUS_HIE_OPERATOR';

        try {
            // 1. Fetch Core Data
            const participantRows = await db.query('SELECT * FROM participants WHERE id = ?', [participantId]);
            if (participantRows.length === 0) return res.status(404).json({ error: 'Patient not found' });
            
            const participant = participantRows[0];
            const budgetRows = await db.query('SELECT * FROM budgets WHERE participant_id = ?', [participantId]);
            const visitRows = await db.query('SELECT * FROM evv_visits WHERE participant_id = ?', [participantId]);

            // 2. Map to FHIR Resources
            const fhirPatient = FHIRAdapter.toPatient(participant);
            const resources = [fhirPatient];

            if (budgetRows.length > 0) {
                resources.push(FHIRAdapter.toCarePlan(budgetRows[0], participant));
            }

            visitRows.forEach(v => {
                resources.push(FHIRAdapter.toObservation(v));
            });

            // 3. Create Bundle
            const bundle = FHIRAdapter.toBundle(resources, participantId);

            // 4. HIPAA Audit: LOG DISCLOSURE
            await AuditService.logEvent({
                userId: partnerName,
                action: 'HIPAA_DISCLOSURE_RECORD',
                moduleId: 'INTEROP_HUB',
                metadata: {
                    targetPatientId: participantId,
                    format: format === 'xml' ? 'FHIR_R4_XML' : 'FHIR_R4_JSON',
                    resourceCount: resources.length,
                    reason: 'CLINICAL_SUMMARY_EXPORT',
                    authenticatedPartner: partnerName
                },
                ipAddress: req.ip
            });

            console.log(`[INTEROP] EXPORT_SUCCESS: ${participantId} (FORMAT: ${format})`);
            
            if (format === 'xml') {
                res.setHeader('Content-Type', 'application/fhir+xml');
                return res.send(FHIRAdapter.toXML(bundle));
            }

            res.json(bundle);
        } catch (err) {
            console.error('[INTEROP_ERR]', err);
            res.status(500).json({ error: 'Failed to generate FHIR export' });
        }
    }

    /**
     * Export Electronic Health Information (EHI) - Cures Act Requirement
     */
    async exportEHIRecord(req, res) {
        const { participantId } = req.params;
        const operatorId = req.headers['x-operator-id'] || 'SYSTEM_ADMIN';

        try {
            // 1. Fetch all documents for this participant
            const documentRows = await db.query('SELECT id, category as code, compliance_status as status FROM documents WHERE participant_id = ?', [participantId]);
            
            // 2. Generate Encrypted Packet
            const packet = await PacketExportService.generateClinicalPacket(participantId, documentRows);

            if (!packet.success) {
                return res.status(400).json(packet);
            }

            // 3. HIPAA Audit
            await AuditService.logEvent({
                userId: operatorId,
                action: 'EHI_DATA_EXCHANGE_RECORD',
                moduleId: 'INTEROP_HUB',
                metadata: {
                    targetPatientId: participantId,
                    packetName: packet.packetName,
                    documentCount: packet.documentCount,
                    security: packet.security
                },
                ipAddress: req.ip
            });

            res.json(packet);
        } catch (err) {
            console.error('[EHI_EXPORT_ERR]', err);
            res.status(500).json({ error: 'Failed to generate EHI export' });
        }
    }

    /**
     * Fetch a specific FHIR Resource by type and ID.
     */
    async getFHIRResource(req, res) {
        const { resourceType, id } = req.params;
        // Simplified for demo: routing back to Participant/Budget logic
        try {
            if (resourceType === 'Patient') {
                const rows = await db.query('SELECT * FROM participants WHERE id = ?', [id]);
                if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
                return res.json(FHIRAdapter.toPatient(rows[0]));
            }
            res.status(400).json({ error: `FHIR Resource ${resourceType} lookup not yet implemented` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new InteropController();
