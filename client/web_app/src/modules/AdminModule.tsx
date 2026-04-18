import React, { useState, useEffect } from 'react';

interface SystemStats {
    auditLogs: { total: number; integrity: string };
    serviceBus: { status: string; queueSize: number };
    compliance: {
        pendingAudits: number;
        systemicScore: number;
        highRiskAlerts: number;
    };
    stats: {
        participants: number;
        leads: number;
        activeIncidents: number;
    };
    tenants: Array<{ id: string; status: string; users: number }>;
}

interface AuditLog {
    id: number;
    userId: string;
    action: string;
    moduleId: string;
    timestamp: string;
    metadata: any;
}

const AdminModule: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'AUDIT' | 'ALERTS' | 'INTEGRATIONS'>('DASHBOARD');
    const [newKeyName, setNewKeyName] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    
    // Filters State
    const [userIdFilter, setUserIdFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchAuditLogs = () => {
        const params = new URLSearchParams();
        if (userIdFilter) params.append('userId', userIdFilter);
        if (moduleFilter) params.append('moduleId', moduleFilter);
        if (actionFilter) params.append('action', actionFilter);

        fetch(`/api/v1/security/audit?${params.toString()}`)
            .then(res => res.json())
            .then(data => setAuditLogs(data));
    };

    const fetchAlerts = () => {
        fetch('/api/v1/alerts')
            .then(res => res.json())
            .then(data => setAlerts(data.alerts));
    };

    useEffect(() => {
        // Fetch Live Stats
        fetch('/api/v1/admin/stats', { headers: { 'x-tenant-id': 'SYS-ADMIN' } })
            .then(res => res.json())
            .then(data => setStats(data));

        fetchAuditLogs();
        fetchAlerts();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                <button 
                    onClick={() => setActiveTab('DASHBOARD')}
                    style={{ background: activeTab === 'DASHBOARD' ? 'var(--primary)' : 'transparent', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    AGENCY_HEALTH
                </button>
                <button 
                    onClick={() => setActiveTab('AUDIT')}
                    style={{ background: activeTab === 'AUDIT' ? 'var(--primary)' : 'transparent', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    AUDIT_EXPLORER
                </button>
                <button 
                    onClick={() => setActiveTab('ALERTS')}
                    style={{ background: activeTab === 'ALERTS' ? 'var(--primary)' : 'transparent', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    SYSTEM_ALERTS
                </button>
                <button 
                    onClick={() => setActiveTab('INTEGRATIONS')}
                    style={{ background: activeTab === 'INTEGRATIONS' ? 'var(--primary)' : 'transparent', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    API_INTEGRATIONS
                </button>
            </div>

            {activeTab === 'DASHBOARD' ? (
                <div className="card-grid">
                    <div className="card">
                        <h3><i className="fas fa-lock"></i> Verifiable Audit Trail</h3>
                        {stats ? (
                            <>
                                <div className="value">{stats.auditLogs.total.toLocaleString()}</div>
                                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                                    INTEGRITY: {stats.auditLogs.integrity}
                                </p>
                                <button className="primary" style={{ fontSize: '0.7rem' }} onClick={() => setActiveTab('AUDIT')}>VIEW_FULL_TRAIL</button>
                            </>
                        ) : (
                            <p style={{ fontFamily: 'Space Mono' }}>QUERYING_LEDGER...</p>
                        )}
                    </div>

                    <div className="card">
                        <h3><i className="fas fa-users"></i> Active Participants</h3>
                        <div className="value">{stats?.stats.participants || 0}</div>
                        <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                            LIVE_CASELOAD_AGGREGATE
                        </p>
                        <span className="status-badge green">DATA_CONSISTENT</span>
                    </div>

                    <div className="card">
                        <h3><i className="fas fa-funnel-dollar"></i> Sales Pipeline</h3>
                        <div className="value">{stats?.stats.leads || 0}</div>
                        <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                            OPEN_CRM_LEADS
                        </p>
                    </div>

                    <div className="card">
                        <h3><i className="fas fa-triangle-exclamation"></i> Risks & Incidents</h3>
                        <div className="value" style={{ color: (stats?.stats.activeIncidents || 0) > 0 ? '#ff4444' : 'inherit' }}>
                            {stats?.stats.activeIncidents || 0}
                        </div>
                        <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                            ACTIVE_HIGH_PRIORITY
                        </p>
                    </div>

                    <div className="card">
                        <h3><i className="fas fa-shield-heart"></i> Clinical Audit Shield</h3>
                        <div className="value" style={{ color: (stats?.compliance?.systemicScore ?? 0) < 90 ? '#ffcc00' : 'var(--status-green)' }}>
                            {stats?.compliance?.systemicScore ?? 0}%
                        </div>
                        <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                            SYSTEMIC_COMPLIANCE_SCORE
                        </p>
                        <span className="status-badge" style={{ background: 'rgba(255, 204, 0, 0.1)', color: '#ffcc00' }}>
                            {stats?.compliance?.pendingAudits ?? 0} PENDING_AUDITS
                        </span>
                    </div>

                    <div className="card" style={{ gridColumn: 'span 1' }}>
                        <h3><i className="fas fa-file-circle-check"></i> FHP Enrollment</h3>
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ fontSize: '1.2rem', color: 'var(--accent-action)' }}>PENDING</div>
                            <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'Space Mono', marginTop: '5px' }}>2026_MANDATE</div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'AUDIT' ? (
                <div className="card" style={{ animation: 'fadeIn 0.3s ease-in' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3><i className="fas fa-list-check"></i> System Interaction Explorer</h3>
                        <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'Space Mono' }}>
                            LOGGING_EVERY_CLICK // HIGH_FIDELITY
                        </div>
                    </div>

                    {/* Filter Toolbar */}
                    <div style={{ display: 'flex', gap: '15px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.6rem', color: '#888', marginBottom: '4px' }}>OPERATOR_SEARCH</label>
                            <input 
                                type="text" 
                                placeholder="User ID..." 
                                value={userIdFilter} 
                                onChange={(e) => setUserIdFilter(e.target.value)}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '0.75rem' }} 
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.6rem', color: '#888', marginBottom: '4px' }}>MODULE_FILTER</label>
                            <select 
                                value={moduleFilter} 
                                onChange={(e) => setModuleFilter(e.target.value)}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '0.75rem' }}
                            >
                                <option value="">ALL_MODULES</option>
                                <option value="CASE_MGMT">CASE_MGMT</option>
                                <option value="FINANCIALS">FINANCIALS</option>
                                <option value="BILLING">BILLING</option>
                                <option value="EVV">EVV</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ display: 'block', fontSize: '0.6rem', color: '#888', marginBottom: '4px' }}>ACTION_TYPE</label>
                            <input 
                                type="text" 
                                placeholder="e.g. PHI_ACCESS..." 
                                value={actionFilter} 
                                onChange={(e) => setActionFilter(e.target.value)}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '0.75rem' }} 
                            />
                        </div>
                        <button 
                            className="primary" 
                            style={{ padding: '8px 20px', fontSize: '0.7rem' }}
                            onClick={fetchAuditLogs}
                        >
                            APPLY_FILTERS
                        </button>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', color: '#888' }}>TIMESTAMP</th>
                                    <th style={{ padding: '12px', color: '#888' }}>OPERATOR</th>
                                    <th style={{ padding: '12px', color: '#888' }}>ACTION</th>
                                    <th style={{ padding: '12px', color: '#888' }}>MODULE</th>
                                    <th style={{ padding: '12px', color: '#888' }}>METADATA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                                        <td style={{ padding: '12px', fontFamily: 'Space Mono', color: 'var(--accent-terminal)' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.65rem' }}>
                                                {log.userId}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>
                                            <span style={{ color: log.action === 'PHI_ACCESS_VIEWED' ? '#ff4444' : 'inherit' }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span className="status-badge" style={{ background: 'rgba(64, 196, 255, 0.1)', color: '#40c4ff' }}>
                                                {log.moduleId}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: '#888', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.action === 'PHI_ACCESS_VIEWED' ? `[CHART_ID: ${log.metadata?.participantId || 'LIST'}]` : (log.metadata?.target?.tag ? `${log.metadata?.target?.tag} - ${log.metadata?.target?.text}` : JSON.stringify(log.metadata))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'ALERTS' ? (
                <div className="card" style={{ animation: 'fadeIn 0.3s ease-in' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3><i className="fas fa-triangle-exclamation"></i> Command Center Alerts</h3>
                        <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'Space Mono' }}>
                            REAL_TIME_RISK_SURVEILLANCE
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', color: '#888' }}>SEVERITY</th>
                                    <th style={{ padding: '12px', color: '#888' }}>TYPE</th>
                                    <th style={{ padding: '12px', color: '#888' }}>TITLE</th>
                                    <th style={{ padding: '12px', color: '#888' }}>MESSAGE</th>
                                    <th style={{ padding: '12px', color: '#888' }}>STATUS</th>
                                    <th style={{ padding: '12px', color: '#888' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map(a => (
                                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ 
                                                color: a.severity === 'CRITICAL' ? '#ff4444' : 
                                                       a.severity === 'HIGH' ? '#ff8800' : 
                                                       a.severity === 'MEDIUM' ? '#ffcc00' : '#44bbff',
                                                fontWeight: 700,
                                                fontSize: '0.65rem'
                                            }}>
                                                {a.severity}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>{a.type}</td>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>{a.title}</td>
                                        <td style={{ padding: '12px', color: '#888', maxWidth: '300px' }}>{a.message}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span className={`status-badge ${a.status === 'NEW' ? 'red' : 'green'}`} style={{ fontSize: '0.6rem' }}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {a.status !== 'DISMISSED' && (
                                                <button 
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', cursor: 'pointer' }}
                                                    onClick={async () => {
                                                        await fetch(`/api/v1/alerts/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'DISMISSED' }) });
                                                        fetchAlerts();
                                                    }}
                                                >
                                                    DISMISS
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {alerts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>NO_ACTIVE_SYSTEM_ALERTS</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ animation: 'fadeIn 0.3s ease-in' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3><i className="fas fa-network-wired"></i> External Clinical Integrations</h3>
                        <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'Space Mono' }}>
                            SECURE_HIE_ACCESS_KEYS
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '0.8rem' }}>Generate New Integration Key</h4>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <input 
                                type="text" 
                                placeholder="Partner Name (e.g. WellSky)..." 
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 15px', borderRadius: '4px' }}
                            />
                            <button className="primary" onClick={() => {
                                const key = `iris_sk_live_${Math.random().toString(36).substring(2, 15)}`;
                                setGeneratedKey(key);
                                // Simulation of saving to DB
                                console.log("[ADMIN] Generated key for", newKeyName);
                            }}>
                                GENERATE_KEY
                            </button>
                        </div>
                        {generatedKey && (
                            <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(var(--primary-rgb), 0.1)', border: '1px dashed var(--primary)', borderRadius: '6px' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '5px' }}>COPY_AND_SAVE_SECURELY // ONLY_SHOWN_ONCE</div>
                                <code style={{ fontSize: '1rem', color: '#fff' }}>{generatedKey}</code>
                            </div>
                        )}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: '#888' }}>PARTNER_NAME</th>
                                <th style={{ padding: '12px', color: '#888' }}>PERMISSIONS</th>
                                <th style={{ padding: '12px', color: '#888' }}>CREATED_AT</th>
                                <th style={{ padding: '12px', color: '#888' }}>STATUS</th>
                                <th style={{ padding: '12px', color: '#888' }}>SYSTEM_ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'WELLSKY_INTEGRATION', perm: 'READ_ONLY', date: '2026-04-18', status: 'ACTIVE' },
                                { name: 'DHS_MCI_GATEWAY', perm: 'READ_WRITE', date: '2026-04-10', status: 'ACTIVE' },
                                { name: 'EPIC_HIE_PARTNER', perm: 'READ_ONLY', date: '2026-03-25', status: 'REVOKED' },
                            ].map((k, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>{k.name}</td>
                                    <td style={{ padding: '12px' }}><code>{k.perm}</code></td>
                                    <td style={{ padding: '12px' }}>{k.date}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`status-badge ${k.status === 'ACTIVE' ? 'green' : 'red'}`}>{k.status}</span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {k.status === 'ACTIVE' && (
                                            <button style={{ background: 'none', border: '1px solid #ff4444', color: '#ff4444', fontSize: '0.6rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>REVOKE</button>
                                        )}
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

export default AdminModule;
