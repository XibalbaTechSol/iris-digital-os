/**
 * IRIS Digital OS - Compliance Engine (Task 9.2)
 * Pattern: Policy Guardrail (Competitor Validated: iLIFE / AxisCare)
 * Goal: Enforce DHS P-00708 "Hard-Block" budget rules.
 */

const db = require('../config/database');
const ServiceBus = require('../orchestration/service_bus');

class ComplianceEngine {
    constructor() {
        this.init();
    }

    init() {
        console.log('[COMPLIANCE] ENGINE_ACTIVE: Listening for policy violations.');
        
        // Subscribe to SHIFT_CREATED to validate budget BEFORE it hits the state.
        ServiceBus.subscribe('SHIFT_CREATED', this.validateBudgetGuardrail.bind(this));
    }

    /**
     * P-00708 Rule: A caregiver cannot clock-in if the ISSP budget is depleted.
     */
    async validateBudgetGuardrail(event) {
        const { tenantId, payload } = event;
        const { participantId, requestedAmount } = payload;

        console.log(`[COMPLIANCE] VALIDATING_BUDGET: P_${participantId} for $${requestedAmount}`);

        try {
            const rows = await db.query(`SELECT authorized_amount, paid_amount, pending_amount FROM budgets WHERE participant_id = ?`, [participantId]);
            
            if (rows.length === 0) {
                console.warn(`[COMPLIANCE] NO_BUDGET_FOUND for P_${participantId}. Blocking access by default.`);
                return { isValid: false, reason: 'P-00708: No current authorization found.' };
            }

            const { authorized_amount, paid_amount, pending_amount } = rows[0];
            const remaining = authorized_amount - paid_amount - pending_amount;

            if (remaining < requestedAmount) {
                console.error(`[COMPLIANCE] VIOLATION_DETECTED: Insufficient budget for P_${participantId}. Remaining: $${remaining}, Requested: $${requestedAmount}`);
                
                ServiceBus.publish('SHIFT_REJECTED', {
                    participantId,
                    reason: 'BUDGET_DEPLETED',
                    rule: 'P-00708_SECTION_4.1',
                    tenantId
                });

                return { isValid: false, reason: `P-00708: Budget Exceeded. Remaining: $${remaining.toFixed(2)}` };
            }

            console.log(`[COMPLIANCE] PASS: Budget verified for P_${participantId}. Remaining: $${remaining.toFixed(2)}`);
            return { isValid: true };
        } catch (e) {
            console.error('[COMPLIANCE] DB_QUERY_FAILED:', e);
            return { isValid: false, reason: 'INTERNAL_SECURITY_FAILSAFE_BLOCK' };
        }
    }
}

module.exports = new ComplianceEngine();
