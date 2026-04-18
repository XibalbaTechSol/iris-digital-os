import React, { useState, useEffect } from 'react';

const RenewalModule: React.FC = () => {
    const [renewals, setRenewals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/case/renewals/ALL') // Or however we expose it
            .then(r => r.json())
            .then(data => {
                if (data.success && data.renewals) {
                    setRenewals(data.renewals);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="module-container">
            <div style={{ padding: '20px' }}>
                <h2 style={{ margin: 0 }}>Clinical Renewal Tracker</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monitor 365-day compliance cycles for LTCFS and ISSPs.</p>
            </div>

            <div className="card-grid">
                {loading ? (
                    <div>Loading renewals...</div>
                ) : Array.isArray(renewals) && renewals.length > 0 ? (
                    renewals.map(r => (
                        <div key={r.id} className="card" style={{ borderLeft: `4px solid ${r.health === 'CRITICAL' ? '#dc2626' : r.health === 'WARNING' ? '#f59e0b' : '#16a34a'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontWeight: 'bold' }}>{r.name}</span>
                                <span className={`status-badge`} style={{ background: r.health === 'CRITICAL' ? '#fef2f2' : r.health === 'WARNING' ? '#fffbeb' : '#f0fdf4', color: r.health === 'CRITICAL' ? '#dc2626' : r.health === 'WARNING' ? '#d97706' : '#16a34a' }}>
                                    {r.health}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', marginBottom: '10px' }}>
                                <strong>Anniversary:</strong> {new Date(r.anniversary).toLocaleDateString()}<br/>
                                <strong>Days Remaining:</strong> {r.daysRemaining}
                            </div>
                            <div style={{ fontSize: '0.7rem' }}>
                                {r.milestones.map((m: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                                        <span>{m.label}</span>
                                        <span>{m.status === 'PASSED' ? '✅' : '⏳'}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <button className="primary" style={{ width: '100%', fontSize: '0.7rem' }}>START_RENEWAL_WORKFLOW</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div>No upcoming renewals detected.</div>
                )}
            </div>
        </div>
    );
};

export default RenewalModule;
