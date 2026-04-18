import React, { useState } from 'react';

const BillingModule: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [batchStatus, setBatchStatus] = useState<any>(null);
    const [auditStatus, setAuditStatus] = useState<any>(null);

    const [pendingVisits, setPendingVisits] = useState<any[]>([]);
    const [enrollmentAuths, setEnrollmentAuths] = useState<any[]>([]);

    const aggregateHealth = pendingVisits.length > 0 
        ? Math.round(pendingVisits.reduce((acc, v) => acc + (v.complianceScore || 100), 0) / pendingVisits.length) 
        : 100;

    React.useEffect(() => {
        fetch('/api/v1/billing/pending')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.pendingVisits) {
                    setPendingVisits(data.pendingVisits);
                }
            })
            .catch(console.error);

        // Fetch auto-authorized budgets from handoff service
        fetch('/api/v1/case/participants')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEnrollmentAuths(data.filter(p => new Date(p.created_at) > new Date(Date.now() - 86400000))); // Last 24h
                }
            })
            .catch(console.error);
    }, []);

    const runPreClaimAudit = async () => {
        setIsProcessing(true);
        // Ping our new pre-claim audit endpoint for one of the participants
        try {
            const result = await fetch('/api/v1/documents/preclaim/P-1001').then(r => r.json());
            setAuditStatus(result);
        } catch (e) {
            console.error("Audit failed", e);
        }
        setIsProcessing(false);
    }

    const handleBatchSubmit = async (method: 'SFTP' | 'DOWNLOAD') => {
        if (!auditStatus?.auditPassed && auditStatus !== null) {
            alert("WARNING: Pre-Claim Audit Failed. Proceeding with dirty claims may result in denials.");
        }
        setIsProcessing(true);
        // Simulated API call to EDIService
        setTimeout(() => {
            setBatchStatus({
                batchId: `BCH_${Date.now()}`,
                method,
                status: method === 'SFTP' ? 'TRANSMITTED' : 'DOWNLOADED',
                transmissionId: method === 'SFTP' ? 'TRM_AV-9921' : null,
                timestamp: new Date().toLocaleTimeString()
            });
            setIsProcessing(false);
            if (method === 'DOWNLOAD') alert("837P EDI Batch downloaded for manual portal upload.");
        }, 2000);
    };

    return (
        <div className="card-grid">
            <div className="card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3><i className="fas fa-file-invoice-dollar"></i> Claim Control Center // 837P_GATEWAY</h3>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', color: '#888', fontWeight: 700 }}>PRE_CLAIM_BATCH_HEALTH</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: aggregateHealth > 90 ? 'var(--status-green)' : aggregateHealth > 70 ? 'var(--status-yellow)' : 'var(--status-red)' }}>
                                {aggregateHealth}%
                            </div>
                        </div>
                        <button className={`status-badge ${batchStatus ? 'green' : 'gray'}`} style={{ border: 'none' }}>
                            {batchStatus?.status || 'AWAITING_BATCH'}
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>VISIT_ID</th>
                                <th>PARTICIPANT</th>
                                <th>DATE</th>
                                <th>UNITS</th>
                                <th>COMPLIANCE</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingVisits.map(v => (
                                <tr key={v.id}>
                                    <td>{v.id}</td>
                                    <td>{v.participant || v.participant_id}</td>
                                    <td>{v.date || (v.created_at && new Date(v.created_at).toLocaleDateString())}</td>
                                    <td>{v.units || 4}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${v.complianceScore}%`, background: v.complianceScore > 90 ? 'var(--status-green)' : v.complianceScore > 70 ? 'var(--status-yellow)' : 'var(--status-red)' }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{v.complianceScore}%</span>
                                            {v.warnings?.length > 0 && (
                                                <i className="fas fa-triangle-exclamation" style={{ color: v.warnings.some((w: any) => w.type === 'CRITICAL') ? 'var(--status-red)' : 'var(--status-yellow)', fontSize: '0.8rem' }} title={v.warnings.map((w: any) => w.message).join('\n')}></i>
                                            )}
                                        </div>
                                    </td>
                                    <td><span className={`status-badge ${v.status === 'READY_TO_BILL' ? 'yellow' : 'blue'}`}>{v.status}</span></td>
                                </tr>
                            ))}
                            {pendingVisits.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No pending claims or visits in queue.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {auditStatus && (
                    <div style={{ marginTop: '20px', padding: '15px', borderLeft: `4px solid ${auditStatus.auditPassed ? '#16a34a' : '#dc2626'}`, background: auditStatus.auditPassed ? '#f0fdf4' : '#fef2f2' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: auditStatus.auditPassed ? '#16a34a' : '#dc2626' }}>
                            <i className="fas fa-shield-virus"></i> Phase 12: Audit Shield Results
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>{auditStatus.message}</p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
                    <button 
                        className="secondary" 
                        onClick={runPreClaimAudit}
                        disabled={isProcessing}
                        style={{ flex: 1 }}
                    >
                        {isProcessing && !auditStatus ? 'SCANNING...' : 'RUN_AUDIT_SHIELD (PRE-CLAIM)'}
                    </button>
                    <button 
                        className="primary" 
                        onClick={() => handleBatchSubmit('SFTP')}
                        disabled={isProcessing}
                        style={{ flex: 1, background: 'var(--accent-terminal)', color: '#000' }}
                    >
                        {isProcessing && auditStatus ? 'UPLOADING_TO_AVAILITY...' : 'SUBMIT_VIA_DIRECT_SFTP (AVAILITY)'}
                    </button>
                </div>
            </div>

            {/* BATCH MONITORING */}
            <div className="card">
                <h3><i className="fas fa-satellite-dish"></i> Batch Transmission Logs</h3>
                {batchStatus ? (
                    <div style={{ background: '#000', padding: '15px', borderLeft: '3px solid var(--accent-terminal)', marginTop: '20px' }}>
                        <div style={{ fontFamily: 'Space Mono', fontSize: '0.65rem', color: 'var(--accent-terminal)', marginBottom: '10px' }}>TRANSMISSION_SUCCESS:</div>
                        <div style={{ fontSize: '0.8rem' }}>
                            ID: {batchStatus.batchId}<br/>
                            METHOD: {batchStatus.method}<br/>
                            TRM_ID: {batchStatus.transmissionId || 'N/A'}<br/>
                            TS: {batchStatus.timestamp}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#444', padding: '40px 0' }}>
                        <p style={{ fontFamily: 'Space Mono' }}>AWAITING_TRANSMISSION</p>
                    </div>
                )}
            </div>

            <div className="card">
                <h3><i className="fas fa-check-double"></i> 835 Reconciliation</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$98,240</div>
                        <div style={{ fontSize: '0.6rem', color: '#888' }}>GROSS_PAYMENT_THIS_PERIOD</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', color: 'var(--accent-action)' }}>1.2%</div>
                        <div style={{ fontSize: '0.6rem', color: '#888' }}>DENIAL_RATE</div>
                    </div>
                </div>
                <button className="primary" style={{ width: '100%', marginTop: '20px', fontSize: '0.7rem' }}>INGEST_ERA_835_REPORT</button>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <h3><i className="fas fa-link"></i> Enrollment Financial Bridge</h3>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '15px' }}>AUTO_AUTHORIZED_BUDGETS (LAST 24H)</div>
                {enrollmentAuths.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {enrollmentAuths.map(auth => (
                            <div key={auth.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{auth.name}</div>
                                <span className="status-badge green" style={{ fontSize: '0.55rem' }}>AUTH_SYNCED</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, fontSize: '0.75rem' }}>No new enrollments authorized.</div>
                )}
            </div>
        </div>
    );
};

export default BillingModule;
