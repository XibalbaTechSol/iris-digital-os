/**
 * IRIS Digital OS - Payroll Service Scaffold (Task 3.3)
 * Goal: Wrapper for Gusto/Check API for Domestic Caregiver Payouts.
 * Integrates with Phase 3.2 Tax Engine for legal overrides.
 */

const { calculateTotalCost } = require('../tax_engine/engine');

class PayoutService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.payroll-provider.com/v1'; // Placeholder for Gusto/Check
    }

    /**
     * Triggers an ACH payout for a verified shift and handles domestic tax logic.
     */
    async processCaregiverPayment(payrollData) {
        const { 
            workerId, 
            participantId, 
            grossWage, 
            relationshipCode, 
            workerAge 
        } = payrollData;

        // 1. Get exact Tax Exemption Breakdown from our Engine
        const costAnalysis = calculateTotalCost(grossWage, relationshipCode, workerAge);

        // 2. Build the Payroll API Payload
        // Note: totalCostToBudget includes employer-side taxes our system must escrow.
        const payload = {
            external_employee_id: workerId,
            external_employer_id: participantId,
            gross_pay: grossWage,
            type: 'DOMESTIC_EMPLOYEE',
            tax_overrides: {
                fica_exempt: costAnalysis.taxBreakdown.fica === 0.00,
                futa_exempt: costAnalysis.taxBreakdown.futa === 0.00,
                suta_exempt: costAnalysis.taxBreakdown.suta === 0.00
            },
            metadata: {
                program: 'WI_IRIS',
                fiscal_year: 2026,
                cost_center: '1915C_WAIVER'
            }
        };

        console.log(`[PAYROLL] Orchestrating Payout for ${workerId}...`);
        console.log(`[PAYROLL] Relationship: ${relationshipCode} | Total Budget Impact: $${costAnalysis.totalCostToBudget}`);

        // 3. Simulated API Call (Production: axios.post)
        try {
            // Simulating a successful response from a Payroll API
            const response = {
                status: 'QUEUED',
                payout_id: `ACH_IRIS_${Date.now()}`,
                funding_source: 'STATE_WAIVER_ESCROW'
            };

            return {
                success: true,
                payoutId: response.payout_id,
                totalImpact: costAnalysis.totalCostToBudget,
                taxesEscrowed: costAnalysis.totalTaxes
            };
        } catch (error) {
            console.error('[PAYROLL_ERROR] Critical failure in Payout Orchestration:', error.message);
            return { success: false, error: 'PAYROLL_GATEWAY_DOWN' };
        }
    }
}

module.exports = PayoutService;
