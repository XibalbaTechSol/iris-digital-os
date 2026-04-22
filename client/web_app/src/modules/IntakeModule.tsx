import React, { useState, useEffect, useCallback } from 'react';
import ReferralIntakeWizard from '../components/ReferralIntakeWizard';

/**
 * IRIS OS - Clinical Intake & CRM Module
 * High-Fidelity Kanban for the Referral-to-Active Funnel.
 */
const IntakeModule: React.FC = () => {
    const [referrals, setReferrals] = useState<any[]>([]);
    const [showWizard, setShowWizard] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchReferrals = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/onboarding/referrals');
            const data = await res.json();
            setReferrals(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch referrals', e);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const statuses = ['RECEIVED', 'WELCOME_CALL_LOGGED', 'WELCOME_CALL_COMPLETE', 'ORIENTATION_SCHEDULED', 'DOCS_COLLECTED', 'READY_FOR_SCREEN'];

    const getStatusLabel = (status: string) => status.replace(/_/g, ' ');

    return (
        <div className="module-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Intake Pipeline (ADRC Referral Funnel)</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Managing compliance deadlines for F-00075 arrival.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="secondary" style={{ fontSize: '0.7rem' }} onClick={fetchReferrals}><i className="fas fa-sync"></i> REFRESH_PIPELINE</button>
                    <button className="primary" style={{ fontSize: '0.7rem' }} onClick={() => setShowWizard(true)}><i className="fas fa-plus"></i> NEW_MANUAL_REFERRAL</button>
                </div>
            </div>

            {/* WIZARD MODAL */}
            {showWizard && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                        <ReferralIntakeWizard 
                            onComplete={() => { setShowWizard(false); fetchReferrals(); }} 
                            onClose={() => setShowWizard(false)} 
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '15px' }}></i>
                    <div>Syncing with ADRC...</div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', flex: 1, paddingBottom: '15px' }}>
                    {statuses.map(status => (
                        <div key={status} style={{ minWidth: '280px', background: '#f8fafc', borderRadius: '8px', padding: '15px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{getStatusLabel(status)}</span>
                                <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px' }}>
                                    {referrals.filter(r => r.status === status).length}
                                </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {referrals.filter(r => r.status === status).map(r => (
                                    <div key={r.id} className="card" style={{ padding: '12px', cursor: 'grab', borderLeft: '3px solid var(--primary)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{r.participantName}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px' }}>MCI: {r.id}</div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {status === 'RECEIVED' && r.welcomeCallDeadline && (
                                                <div style={{ fontSize: '0.6rem', padding: '4px', background: '#fff7ed', color: '#9a3412', borderRadius: '4px', border: '1px solid #ffedd5' }}>
                                                    <i className="fas fa-clock"></i> 72h Contact: {new Date(r.welcomeCallDeadline).toLocaleDateString()}
                                                </div>
                                            )}
                                            {r.orientationDeadline && (
                                                <div style={{ fontSize: '0.6rem', padding: '4px', background: '#f0fdf4', color: '#166534', borderRadius: '4px', border: '1px solid #dcfce7' }}>
                                                    <i className="fas fa-calendar-alt"></i> Orientation: {new Date(r.orientationDeadline).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                                            <button style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Edit"><i className="fas fa-edit"></i></button>
                                            <button style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Forms"><i className="fas fa-file-contract"></i></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PERFORMANCE HUD */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
                <div className="card" style={{ flex: 1, padding: '15px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>72h COMPLIANCE RATE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-green)' }}>98.4%</div>
                </div>
                <div className="card" style={{ flex: 1, padding: '15px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AVG CONVERSION DAYS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>24.2</div>
                </div>
                <div className="card" style={{ flex: 1, padding: '15px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCREENING_VELOCITY</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>HIGH</div>
                </div>
            </div>
        </div>
    );
};

export default IntakeModule;
