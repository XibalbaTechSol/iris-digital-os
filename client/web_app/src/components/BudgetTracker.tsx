import React from 'react';

/**
 * IRIS OS - Budget Intelligence Component
 * Goal: Visual burn-rate tracking and predictive overage forecasting.
 */
interface BudgetTrackerProps {
    authorizedAmount: number;
    paidAmount: number;
    pendingAmount: number;
    costShareStatus: 'PAID' | 'DUE' | 'OVERDUE';
    alertThreshold?: number; // Percentage remaining that triggers overspend alert (default: 15)
}

const BudgetTracker: React.FC<BudgetTrackerProps> = ({ authorizedAmount, paidAmount, pendingAmount, costShareStatus, alertThreshold = 15 }) => {
    const totalSpent = paidAmount + pendingAmount;
    const percentSpent = Math.min(((totalSpent) / authorizedAmount) * 100, 100);
    const percentPaid = Math.min((paidAmount / authorizedAmount) * 100, 100);
    const amountRemaining = authorizedAmount - totalSpent;
    const percentRemaining = 100 - percentSpent;

    // Configurable Overage Logic — triggers when remaining % drops below threshold
    const isOverspendRisk = percentRemaining <= alertThreshold;

    return (
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}><i className="fas fa-chart-line"></i> Annual Budget Burn Rate</h4>
                {isOverspendRisk ? (
                     <span className="status-badge red">⚠ F-01205B AMENDMENT REQUIRED</span>
                ) : (
                    <span className="status-badge green">ON_TRACK</span>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>${totalSpent.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Utilized</span></span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>${authorizedAmount.toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Authorized</span></span>
            </div>

            {/* Multi-Segment Custom Progress Bar */}
            <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                <div style={{ width: `${percentPaid}%`, background: 'var(--status-green)' }} title="Paid Claims"></div>
                <div style={{ width: `${percentSpent - percentPaid}%`, background: '#f59e0b' }} title="Pending Claims"></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <span>{percentSpent.toFixed(1)}% CONSUMED</span>
                <span>${amountRemaining.toLocaleString()} REMAINING</span>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                     <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>MONTHLY COST-SHARE STATUS</div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 700, color: costShareStatus === 'PAID' ? 'var(--status-green)' : 'var(--status-red)' }}>
                         {costShareStatus === 'PAID' ? '✓ CLEARED' : '⚠ OUTSTANDING_BALANCE'}
                     </div>
                 </div>
                 <button style={{ padding: '6px 12px', fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '4px', fontWeight: 700 }}>
                    VIEW_REMITTANCE_835
                 </button>
            </div>
        </div>
    );
};

export default BudgetTracker;
