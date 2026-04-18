/**
 * IRIS Digital OS - Real-Time Payroll Ledger (Task 8.2)
 * Goal: Kill 'Payday Anxiety' by showing workers their predicted net pay daily.
 * Integrates with Phase 3.2 Tax Engine for accurate deductions.
 */

const { calculateTotalCost } = require('../tax_engine/engine');

class PayrollLedgerService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Generates a predicted paycheck for the current pay period.
     */
    async getNetPayPrediction(workerId) {
        // 1. Fetch un-paid shifts for the worker
        // Mock Data: Totaling 40 hours @ $15.00/hr
        const pendingShifts = [
            { id: 'S1', hours: 8, serviceCode: 'S5125', date: '2026-04-13' },
            { id: 'S2', hours: 8, serviceCode: 'S5125', date: '2026-04-14' },
            { id: 'S3', hours: 8, serviceCode: 'S5125', date: '2026-04-15' },
        ];

        // 2. Fetch Worker Compliance Profile (Exemptions)
        const workerProfile = {
            relationshipCode: 'NONE', // Standard worker
            age: 30,
            hasGarnishments: true,
            garnishmentAmount: 25.00
        };

        const totalGross = pendingShifts.reduce((sum, s) => sum + (s.hours * 15.00), 0);

        // 3. Use Tax Engine to calculate deductions
        // Note: We use calculateTotalCost but focus on worker-side withholdings
        const costAnalysis = calculateTotalCost(totalGross, workerProfile.relationshipCode, workerProfile.age);
        
        // Employee-side Withholding Estimate (Simplified)
        const federalWithholding = totalGross * 0.10; // Est. 10%
        const stateWithholding = totalGross * 0.04;   // Est. 4%
        const ficaEmployee = costAnalysis.taxBreakdown.fica; // Employee and Employer FICA are usually equal

        const totalDeductions = federalWithholding + stateWithholding + ficaEmployee + workerProfile.garnishmentAmount;
        const predictedNet = totalGross - totalDeductions;

        return {
            workerId,
            period: "2026-04-01 to 2026-04-15",
            grossPay: parseFloat(totalGross.toFixed(2)),
            predictedNet: parseFloat(predictedNet.toFixed(2)),
            itemizedDeductions: {
                federalIncomeTax: parseFloat(federalWithholding.toFixed(2)),
                wisconsinStateTax: parseFloat(stateWithholding.toFixed(2)),
                socialSecurityMedicare: parseFloat(ficaEmployee.toFixed(2)),
                garnishments: parseFloat(workerProfile.garnishmentAmount.toFixed(2))
            },
            shiftCount: pendingShifts.length,
            status: "PENDING_APPROVAL",
            payoutDate: "2026-04-20"
        };
    }
}

module.exports = PayrollLedgerService;
