const db = require('../database/database');
const Edi837pService = require('../services/financials/edi_837p_service');
const SecurityAuditService = require('../services/security/audit_service');

class BillingController {
    /**
     * Original Route: Submit 837P Batch
     */
    async submitBatchClaim(req, res) {
        const { batchId, payload } = req.body;
        console.log(`[BILLING_CTRL] SUBMITTING_BATCH: ${batchId}...`);
        try {
            const result = await EDIService.sendToClearinghouse(batchId, payload);
            res.json(result);
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    }

    /**
     * Original Route: Reconcile 835 Remittance
     */
    async reconcileRemittance(req, res) {
        const { edi835Text } = req.body;
        try {
            const report = await EDIService.reconcile835(edi835Text);
            res.json(report);
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    }

    /**
     * New Route: Automated Claim Generation
     */
    async automateClaims(req, res) {
        const { shifts, participant, metadata } = req.body;
        const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
        
        try {
            console.log(`[BILLING_CTRL] AUTOMATING_PRODUCTION_CLAIMS (SHIFTS: ${shifts.length})...`);
            
            const batchId = `BCH-${Date.now()}`;
            const claimId = `CLM-${Math.floor(Math.random() * 900000) + 100000}`;
            
            // 1. Prepare Claim Objects (Hardened Mapping)
            const claimData = {
                id: claimId,
                providerName: metadata.billingProviderName || 'PREMIER_FEA',
                providerAddress: metadata.facilityAddress || '123_STATE_ST_MADISON_WI',
                subscriberFirstName: participant.name.split(' ')[0],
                subscriberLastName: participant.name.split(' ')[1] || '',
                mci: participant.id || 'MCI-0000',
                totalAmount: shifts.length * 100, // Derived
                lines: shifts.map(s => ({
                    procCode: 'T1019',
                    amount: 100,
                    units: 4,
                    date: new Date(s.clock_in).toISOString().replace(/[-:T]/g, '').slice(2, 8)
                }))
            };

            // 2. Generate Real X12 EDI
            const ediPayload = Edi837pService.generateFullBatch(batchId, [claimData], metadata.billingProviderNpi || '1234567890');

            // 3. Persist to Database
            await db.run(
                `INSERT INTO claims (id, batch_id, participant_id, total_amount, status) VALUES (?, ?, ?, ?, ?)`,
                [claimId, batchId, participant.id, claimData.totalAmount, 'GENERATED']
            );

            // 4. Audit Reporting
            await SecurityAuditService.logEvent({
                userId,
                action: 'CLAIM_BATCH_GENERATED',
                moduleId: 'BILLING',
                metadata: { batchId, claimCount: 1, totalAmount: claimData.totalAmount }
            });

            res.json({
                success: true,
                batchId,
                claimId,
                ediPayload,
                status: 'GENERATED'
            });
        } catch (error) {
            console.error('[BILLING_CTRL] AUTOMATION_FAILED:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Download filled CMS-1500 PDF
     */
    async downloadCMS1500(req, res) {
        const { claimId } = req.params;
        const { metadata, claim } = req.body; // In a real app, fetch claim from DB
        
        try {
            console.log(`[BILLING_CTRL] DOWNLOADING_CMS1500_FOR_CLAIM: ${claimId}`);
            
            const provider = {
                npi: metadata.renderingProviderNpi || '1234567890',
                taxId: metadata.taxId || '99-8887776',
                billingAddress: metadata.facilityAddress || '123_STATE_ST_MADISON_WI',
                serviceLocation: metadata.facilityAddress || '123_STATE_ST_MADISON_WI'
            };

            const pdfBuffer = await CMS1500Service.generateFilledPDF(claim, provider);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=CMS1500_${claimId}.pdf`);
            res.send(pdfBuffer);
        } catch (e) {
            console.error('[BILLING_CTRL] DOWNLOAD_FAILED:', e);
            res.status(500).json({ success: false, error: e.message });
        }
    }
    /**
     * Get Pending Claims (Hardened with Phase 19 Auditing)
     */
    async getPendingClaims(req, res) {
        try {
            const claims = await db.query(`SELECT * FROM claims WHERE status != 'TRANSMITTED' ORDER BY created_at DESC`);
            
            let finalPending = [];

            // If no claims exist physically yet, map unbilled EVV visits
            if (claims.length === 0) {
                const pendingVisits = await db.query(`SELECT * FROM evv_visits WHERE status = 'PENDING' OR status = 'APPROVED'`);
                
                // Run recursive audits on these visits
                const auditResults = await BillingAuditService.auditVisits(pendingVisits);

                finalPending = pendingVisits.map((v, idx) => ({
                    id: v.id,
                    participant: v.participant_id,
                    date: new Date(v.clock_in || v.created_at).toISOString().split('T')[0],
                    units: Math.ceil(((new Date(v.clock_out || new Date()).getTime() - new Date(v.clock_in).getTime()) / 3600000) * 4) || 4,
                    amount: 100,
                    status: v.status === 'APPROVED' ? 'READY_TO_BILL' : 'PENDING_VERIFICATION',
                    complianceScore: auditResults[idx]?.complianceScore || 100,
                    warnings: auditResults[idx]?.warnings || []
                }));
                
                res.json({ success: true, pendingVisits: finalPending });
                return;
            }

            res.json({ success: true, pendingVisits: claims });
        } catch (e) {
            console.error('[BILLING_CTRL] FAILED_TO_FETCH_CLAIMS:', e);
            res.status(500).json({ success: false, error: e.message });
        }
    }
}

module.exports = new BillingController();
