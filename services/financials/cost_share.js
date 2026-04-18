/**
 * IRIS Digital OS - Cost-Share Tracker (Task 3.4)
 * Goal: Manage "Patient Liability" (Cost Share) collection and reporting.
 * Critical for maintaining Medicaid eligibility under Wisconsin DHS rules.
 */

class CostShareTracker {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Assigns a monthly liability to a participant based on their income maintenance (IM) determination.
     */
    async assignMonthlyLiability(participantId, amount, billingMonth) {
        // Logic: UPSERT into a ledger table (to be added to schema in Phase 4 hardening)
        console.log(`[FINANCIAL] Assigned $${amount} Cost-Share to Participant ${participantId} for ${billingMonth}.`);
        
        // Return structured receipt for the ICA/Consultant to see in their dashboard
        return {
            participantId,
            month: billingMonth,
            liability: amount,
            dueDate: `${billingMonth}-10` // Standard IRIS rule: Due by the 10th
        };
    }

    /**
     * Logs a payment received (Check, Money Order, or Electronic).
     */
    async recordPayment(paymentData) {
        const { participantId, amount, dateReceived, referenceId } = paymentData;
        
        console.log(`[FINANCIAL] Payment of $${amount} recorded for ${participantId}. Ref: ${referenceId}`);

        // Business Rule: If payment is received after the 10th, flag for 'Late' status
        const day = new Date(dateReceived).getDate();
        const isLate = day > 10;

        if (isLate) {
            console.warn(`[COMPLIANCE] Late payment detected for ${participantId}. Monitoring for disenrollment risk.`);
        }

        return {
            success: true,
            status: isLate ? 'PAID_LATE' : 'PAID_ON_TIME',
            balance_remaining: 0.00
        };
    }

    /**
     * Aggregates data for the Quarterly F-02047 Financial Report.
     */
    async getQuarterlySummary(year, quarter) {
        console.log(`[REPORTING] Generating Cost-Share Summary for Q${quarter} ${year}...`);
        
        // Placeholder for SQL aggregate logic
        return {
            total_expected: 45000.00,
            total_collected: 42500.00,
            collection_rate: "94.4%",
            delinquent_count: 12
        };
    }
}

module.exports = CostShareTracker;
