import React, { useState, useEffect } from 'react';

/**
 * IRIS OS - Marketing CRM
 * Goal: Manage lead lifecycle from ADRC referral to enrollment via real-time SQLite database.
 */
const MarketingModule: React.FC = () => {
    const [viewMode, setViewMode] = useState<'KANBAN' | 'GRID'>('KANBAN');
    const [leads, setLeads] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [leadsRes, analyticsRes] = await Promise.all([
                    fetch('/api/v1/marketing/leads').then(r => r.json()),
                    fetch('/api/v1/marketing/analytics').then(r => r.json())
                ]);
                if (leadsRes.success) setLeads(leadsRes.leads);
                if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
            } catch (err) {
                console.error("Failed to fetch CRM data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const convertLeadStatus = async (leadId: string) => {
        try {
            const res = await fetch('/api/v1/marketing/leads/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId })
            });
            const result = await res.json();
            if (result.success) {
                // Update local state to reflect transition
                setLeads(leads.map(l => l.id === leadId ? { ...l, stage: 'ENROLLMENT_PENDING' } : l));
            }
        } catch(err) {
            console.error("Failed to transition lead", err);
        }
    };

    const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'ENROLLMENT_PENDING'];

    if (loading) return <div style={{ padding: '20px' }}>Loading CRM Datastore...</div>;

    return (
        <div className="module-container" style={{ padding: 0 }}>
            {/* 1. MARKETING HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div className="card" style={{ padding: '15px 30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL_LEADS</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analytics?.totalLeads || leads.length}</div>
                    </div>
                    <div className="card" style={{ padding: '15px 30px', textAlign: 'center', borderLeft: '4px solid var(--status-green)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>CONVERSION_RATE</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{analytics?.conversionRate || '0.0'}%</div>
                    </div>
                </div>

                <div style={{ display: 'flex', background: '#fff', padding: '5px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <button 
                        onClick={() => setViewMode('KANBAN')}
                        style={{ padding: '8px 20px', fontSize: '0.75rem', background: viewMode === 'KANBAN' ? 'var(--primary)' : 'transparent', color: viewMode === 'KANBAN' ? '#fff' : 'var(--text-muted)', border: 'none' }}
                    >KANBAN</button>
                    <button 
                        onClick={() => setViewMode('GRID')}
                        style={{ padding: '8px 20px', fontSize: '0.75rem', background: viewMode === 'GRID' ? 'var(--primary)' : 'transparent', color: viewMode === 'GRID' ? '#fff' : 'var(--text-muted)', border: 'none' }}
                    >GRID_VIEW</button>
                </div>
            </div>

            {/* 2. MAIN CRM VIEW */}
            {viewMode === 'KANBAN' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'start' }}>
                    {stages.map(stage => (
                        <div key={stage} style={{ background: '#f1f5f9', borderRadius: '8px', padding: '15px', minHeight: '600px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                {stage}
                                <span style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                                    {leads.filter(l => l.stage === stage).length}
                                </span>
                            </div>
                            
                            {leads.filter(l => l.stage === stage).map(lead => (
                                <div key={lead.id} className="card" style={{ padding: '15px', marginBottom: '12px', cursor: 'grab' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span className={`status-badge ${lead.priority === 'HIGH' ? 'red' : 'green'}`} style={{ fontSize: '0.55rem' }}>{lead.priority}</span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{lead.id}</span>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{lead.name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '10px' }}>SOURCE: {lead.source}</div>
                                    
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button style={{ flex: 1, padding: '5px', fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} title="Log Call">
                                            <i className="fas fa-phone"></i>
                                        </button>
                                        <button style={{ flex: 1, padding: '5px', fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} title="Send Email">
                                            <i className="fas fa-envelope"></i>
                                        </button>
                                        <button style={{ flex: 1, padding: '5px', fontSize: '0.65rem', background: 'var(--primary)', color: '#fff', border: 'none' }} title="Convert to Enrollment" onClick={() => convertLeadStatus(lead.id)}>
                                            <i className="fas fa-user-check"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>LEAD_ID</th>
                                <th>NAME</th>
                                <th>SOURCE</th>
                                <th>STAGE</th>
                                <th>PRIORITY</th>
                                <th>LAST_OUTREACH</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id}>
                                    <td style={{ fontWeight: 700 }}>{lead.id}</td>
                                    <td>{lead.name}</td>
                                    <td><span className="status-badge">{lead.source}</span></td>
                                    <td><strong>{lead.stage}</strong></td>
                                    <td><span className={`status-badge ${lead.priority === 'HIGH' ? 'red' : ''}`}>{lead.priority}</span></td>
                                    <td>{lead.date}</td>
                                    <td>
                                        <button style={{ padding: '4px 12px', fontSize: '0.7rem' }}>OPEN_CORE</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MarketingModule;
