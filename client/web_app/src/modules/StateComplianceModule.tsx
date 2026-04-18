import React, { useState } from 'react';

/**
 * IRIS OS - State Compliance & Reporting HUD
 * Goal: Centralize SSDW (XML) and Sandata (JSON) monitoring.
 */
const StateComplianceModule: React.FC = () => {
    const [transmissionMode, setTransmissionMode] = useState<'DIRECT' | 'CLEARINGHOUSE'>('DIRECT');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStats, setSyncStats] = useState({ xml: 0, json: 0, lastSync: 'NEVER' });

    const handleGlobalSync = async () => {
        setIsSyncing(true);
        // Simulate multi-pipeline sync
        setTimeout(() => {
            setSyncStats({
                xml: 142, // Monthly Encounter Records
                json: 12,  // Today's EVV Visits
                lastSync: new Date().toLocaleTimeString()
            });
            setIsSyncing(false);
        }, 1500);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '25px' }}>
            {/* 1. COMPLIANCE STATUS PANEL */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <i className="fas fa-shield-check" style={{ color: 'var(--accent-terminal)' }}></i>
                    <h3>STATE_COMPLIANCE_STATUS</h3>
                </div>

                <div className="funnel-container">
                    <div className="funnel-step">
                        <span>SANDATA_API (EVV)</span>
                        <span style={{ color: 'var(--accent-terminal)' }}>ONLINE</span>
                    </div>
                    <div className="funnel-step">
                        <span>DHS_SSDW_GATEWAY</span>
                        <span style={{ color: 'var(--accent-terminal)' }}>READY</span>
                    </div>
                </div>

                <div style={{ marginTop: '25px', padding: '15px', background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '10px' }}>TRANSMISSION_CONFIGURATION</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setTransmissionMode('DIRECT')}
                            style={{ 
                                flex: 1, fontSize: '0.6rem', padding: '8px', borderRadius: '4px',
                                background: transmissionMode === 'DIRECT' ? 'var(--accent-action)' : '#fff',
                                color: transmissionMode === 'DIRECT' ? '#fff' : '#64748b',
                                border: '1px solid #cbd5e1'
                            }}
                        >DIRECT_SFTP</button>
                        <button 
                            onClick={() => setTransmissionMode('CLEARINGHOUSE')}
                            style={{ 
                                flex: 1, fontSize: '0.6rem', padding: '8px', borderRadius: '4px',
                                background: transmissionMode === 'CLEARINGHOUSE' ? 'var(--accent-action)' : '#fff',
                                color: transmissionMode === 'CLEARINGHOUSE' ? '#fff' : '#64748b',
                                border: '1px solid #cbd5e1'
                            }}
                        >CLEARINGHOUSE</button>
                    </div>
                </div>

                <button 
                    className="primary" 
                    onClick={handleGlobalSync}
                    disabled={isSyncing}
                    style={{ width: '100%', marginTop: '25px' }}
                >
                    {isSyncing ? 'SYNCHRONIZING_STATE_DATA...' : 'TRIGGER_DAILY_COMPLIANCE_SYNC'}
                </button>
            </div>

            {/* 2. ANALYTICS & HISTORY */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>TRANSMISSION_MANIFEST</h3>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>LAST_SYNC: {syncStats.lastSync}</div>
                </div>

                <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'transparent', border: 'none' }}>
                    <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>SSDW_XML_RECORDS</div>
                        <div style={{ fontSize: '2rem', color: 'var(--accent-action)' }}>{syncStats.xml}</div>
                        <div style={{ fontSize: '0.5rem', marginTop: '5px' }}>FORMAT: DHS_SSDW_V2.5</div>
                    </div>
                    <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>SANDATA_EVV_VISITS</div>
                        <div style={{ fontSize: '2rem', color: 'var(--accent-terminal)' }}>{syncStats.json}</div>
                        <div style={{ fontSize: '0.5rem', marginTop: '5px' }}>FORMAT: SANDATA_REST_API</div>
                    </div>
                </div>

                <div style={{ marginTop: '25px' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>BATCH_ID</th>
                                <th>TYPE</th>
                                <th>RECORDS</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>SSDW_20260415</td>
                                <td>XML (Monthly)</td>
                                <td>1,240</td>
                                <td><span className="status-badge green">ACCEPTED</span></td>
                            </tr>
                            <tr>
                                <td>SAN_18540412</td>
                                <td>JSON (Daily)</td>
                                <td>42</td>
                                <td><span className="status-badge green">SYNCED</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StateComplianceModule;
