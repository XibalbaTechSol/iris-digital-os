import React, { useState, useEffect } from 'react';
import EventBus from '../utils/EventBus';

interface Liquidity {
    availableToday: string;
    grossEarned: string;
    status: string;
}

const FinancialsModule: React.FC = () => {
    // 1. STATE MANAGEMENT
    const [liquidity, setLiquidity] = useState<Liquidity | null>(null);
    const [globalStats, setGlobalStats] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaidActive, setIsPlaidActive] = useState(false);
    const [costShareBalance, setCostShareBalance] = useState(442.50);

    // 2. EFFECTS
    useEffect(() => {
        fetch('/api/v1/fintech/liquidity/WORKER-123', { headers: { 'x-tenant-id': 'PREMIER-FEA' } })
            .then(res => res.json())
            .then(data => setLiquidity(data))
            .catch(() => console.log("Using local mock for liquidity"));

        fetch('/api/v1/fintech/global')
            .then(res => res.json())
            .then(data => {
                if (data.success) setGlobalStats(data);
            });

        const unsub = EventBus.subscribe('SHIFT_VERIFIED', (data) => {
            console.log('[FINANCIALS] BUDGET_IMPACT_PREDICTED:', data);
        });

        return unsub;
    }, []);

    // 3. HANDLERS
    const handlePayout = async () => {
        if (!liquidity) return;
        setIsProcessing(true);
        const originalAmount = liquidity.availableToday;
        setLiquidity({ ...liquidity, availableToday: '0.00' });

        try {
            await fetch('/api/v1/fintech/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'PREMIER-FEA' },
                body: JSON.stringify({ workerId: 'WORKER-123', amount: originalAmount })
            });
            EventBus.publish('WAGES_PAID', { amount: originalAmount, timestamp: new Date().toISOString() });
            alert(`Instant Payout of $${originalAmount} triggered.`);
        } catch (err) {
            setLiquidity({ ...liquidity, availableToday: originalAmount });
            alert("Payout failed. Reverting liquidity state.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayCostShare = () => {
        setIsPlaidActive(true);
        setTimeout(() => {
            setIsPlaidActive(false);
            setCostShareBalance(0);
            EventBus.publish('WAGES_PAID', { amount: 442.50, type: 'COST_SHARE_COLLECTION' });
            alert("SUCCESS: Cost-share payment processed via ACH.");
        }, 3000);
    };

    // 4. RENDER
    return (
        <div className="card-grid">
            {/* FEA TRANSITION MONITOR (STRATEGIC HUD) */}
            <div className="card" style={{ gridColumn: 'span 2', borderLeft: '4px solid #FFCC00', background: 'rgba(255, 204, 0, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3><i className="fas fa-tower-broadcast"></i> FEA Statewide Health Monitor // PPL_TRANSITION</h3>
                    <span className="status-badge red">CRITICAL_DELAY_RISK</span>
                </div>
                <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.6rem', color: '#888', fontFamily: 'Space Mono' }}>WORKER_RETENTION_RISK (PARTICIPANT)</div>
                        <div style={{ fontSize: '1.2rem', color: 'var(--accent-action)', fontWeight: 'bold' }}>HIGH_ATTRITION_ZONE</div>
                        <p style={{ fontSize: '0.55rem', color: '#888', marginTop: '5px' }}>⚠ PREDICTED: 14% WORKER LOSS IF PAY IS DELAYED &gt; 3 DAYS</p>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.6rem', color: '#888', fontFamily: 'Space Mono' }}>PROVIDER_LIQUIDITY_RISK (AGENCY)</div>
                        <div style={{ fontSize: '1.2rem', color: 'var(--accent-terminal)', fontWeight: 'bold' }}>LOW_LIQUIDITY_42%</div>
                        <p style={{ fontSize: '0.55rem', color: '#888', marginTop: '5px' }}>⚠ ESTIMATED_REVENUE_LAG: $82,450 IN PENDING_PPL_BATCHES</p>
                    </div>
                </div>
            </div>

            {/* BUDGET VISUALIZER */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
                <h3><i className="fas fa-chart-line"></i> Budget Burn-Rate Visualizer</h3>
                <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <div className="auth-progress-container" style={{ height: '10px' }}>
                            <div className="auth-progress-fill" style={{ width: `${globalStats?.burnRate || 75}%` }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontFamily: 'Space Mono', fontSize: '0.7rem' }}>
                            <span>BUDGET_EXPENDED: ${Number(globalStats?.globalPaid || 1125000).toLocaleString()}</span>
                            <span style={{ color: 'var(--accent-terminal)' }}>{globalStats?.burnRate || '75'}%</span>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="auth-progress-container" style={{ height: '10px' }}>
                            <div className="auth-progress-fill" style={{ width: `${globalStats?.timeElapsed || 68}%`, background: '#888' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontFamily: 'Space Mono', fontSize: '0.7rem' }}>
                            <span>TIME_ELAPSED (Q2): {globalStats?.timeElapsed || 68}%</span>
                            <span style={{ color: 'var(--accent-action)' }}>BURN_RATE: {(Number(globalStats?.burnRate || 75) / Number(globalStats?.timeElapsed || 68)).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                {Number(globalStats?.burnRate || 75) > Number(globalStats?.timeElapsed || 68) && (
                    <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--accent-action)', fontFamily: 'Space Mono' }}>
                        ⚠ WARNING: BURN_RATE EXCEEDS TIME_ELAPSED. BUDGET DEPLETION PREDICTED BEFORE JUNE 15.
                    </p>
                )}
            </div>

            {/* WAGES NOW */}
            <div className="card" style={{ border: '1px solid var(--accent-terminal)', background: '#000' }}>
                <h3><i className="fas fa-bolt" style={{ color: 'var(--accent-terminal)' }}></i> Wages Now // Instant Pay</h3>
                <div className="value" style={{ color: 'var(--accent-terminal)' }}>${liquidity?.availableToday || '142.50'}</div>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    LIQUIDITY_AVAILABLE_FOR_CASHOUT
                </p>
                <button 
                    className="primary" 
                    style={{ background: 'var(--accent-terminal)', color: '#000' }}
                    onClick={handlePayout}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'PROCESSING_ACH...' : 'TRIGGER_INSTANT_PAYOUT'}
                </button>
            </div>

            {/* COST SHARE */}
            <div className="card" style={{ border: '1px solid var(--accent-action)', background: '#110000' }}>
                <h3><i className="fas fa-hand-holding-dollar"></i> Participant Cost-Share // P-00708</h3>
                <div className="value" style={{ color: 'var(--accent-action)' }}>${costShareBalance.toFixed(2)}</div>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    PENDING_LIABILITY // DUE: APR 25
                </p>
                <button 
                    className="primary" 
                    onClick={handlePayCostShare}
                    disabled={isPlaidActive || costShareBalance === 0}
                >
                    {isPlaidActive ? 'CONNECTING_TO_PLAID...' : 'PAY_NOW_VIA_ACH'}
                </button>
            </div>

            {/* RECENT INVOICES */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
                <h3><i className="fas fa-file-invoice-dollar"></i> Recent Invoices // AxisCare API Sync</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>INV_ID</th>
                            <th>CLIENT</th>
                            <th>DATE</th>
                            <th>AMOUNT</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>#INV-2026-081</td><td>Maria Johnson</td><td>Apr 14</td><td>$442.50</td><td><span className="status-badge green">PAID</span></td></tr>
                        <tr><td>#INV-2026-082</td><td>David Williams</td><td>Apr 15</td><td>$1,200.00</td><td><span className="status-badge red" style={{ background: 'var(--accent-action)' }}>OVERDUE</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinancialsModule;
