/**
 * IRIS Digital OS - Wages Now (Task 5.3)
 * Goal: Solve the caregiver staffing crisis by offering daily liquidity.
 * Logic: Calculate earned-but-unpaid wages after AI-verified EVV shifts.
 */

const { logAction } = require('../../server/src/middleware/audit');

class WagesNowService {
    /**
     * Calculates the amount a worker can withdraw today.
     * Rule: 50% of gross wages for AI-verified shifts not yet in payroll.
     */
    async getAvailableLiquidity(workerId, hourlyRate = 15.00) {
        // 1. Fetch Verified Shifts (Mock)
        // In Prod: db.query("SELECT hours FROM shifts WHERE worker_id=$1 AND status='AI_VERIFIED' AND payroll_status='PENDING'", [workerId])
        const verifiedHours = 32.5; 
        const grossEarned = verifiedHours * hourlyRate;
        
        // 2. Apply "Safe Limit" (50%) to prevent overpayment after taxes/deductions
        const maxWithdrawal = Math.floor(grossEarned * 0.5);

        return {
            workerId,
            verifiedHours,
            grossEarned: grossEarned.toFixed(2),
            availableToday: maxWithdrawal.toFixed(2),
            status: maxWithdrawal > 20 ? 'ELIGIBLE' : 'INSUFFICIENT_BALANCE',
            note: "Funds available for instant ACH or Debit push."
        };
    }

    /**
     * Triggers an instant payout via Fintech partner (e.g., Stripe/Gusto).
     */
    async triggerInstantPayout(workerId, amount) {
        console.log(`[WAGES_NOW] Processing $${amount} instant payout for Worker ${workerId}...`);
        
        // Logic: Call Stripe Payouts API
        const txId = `WAGES_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        return {
            success: true,
            transactionId: txId,
            amount,
            estimatedArrival: "30 Minutes",
            fee: "1.99"
        };
    }
}

module.exports = new WagesNowService();
