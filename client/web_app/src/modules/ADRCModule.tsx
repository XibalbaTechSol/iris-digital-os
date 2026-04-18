import React, { useState, useEffect, useRef } from 'react';
import { CounselingAdvisorWizard } from '../components/CounselingAdvisorWizard';
import SignatureCanvas from '../components/SignatureCanvas';

/**
 * IRIS OS - ADRC CRM & Options Counseling Portal
 * Goal: Empower ADRC agents to manage leads, perform unbiased options counseling, 
 * and execute a "Digital Handshake" for secure ICA handoff.
 */
const ADRCModule: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [activeLead, setActiveLead] = useState<any>(null);
    const [counselingMode, setCounselingMode] = useState(false);
    const [handoffMode, setHandoffMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [programMode, setProgramMode] = useState<'ADRC' | 'MCO' | 'ICA'>('ADRC');
    const [capturedSignatures, setCapturedSignatures] = useState<{ participant?: string; agent?: string }>({});
    const [showSignatureModal, setShowSignatureModal] = useState<'participant' | 'agent' | null>(null);

    const participantSigRef = useRef<any>(null);
    const agentSigRef = useRef<any>(null);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                // In a real app, this would be a specific ADRC leads endpoint
                const res = await fetch('/api/v1/marketing/leads');
                const data = await res.json();
                if (data.success) {
                    // Filter or augment for ADRC context
                    setLeads(data.leads.map((l: any) => ({
                        ...l,
                        ltcfsStatus: l.id === 'L-001' ? 'COMPLETE' : 'PENDING',
                        ltcfsScore: l.id === 'L-001' ? 'Nursing Home Level of Care' : 'N/A'
                    })));
                }
            } catch (err) {
                console.error("Failed to load ADRC leads", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    const handleHandoff = async () => {
        if (!activeLead) return;
        
        try {
            const res = await fetch('/api/v1/handoff/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    leadId: activeLead.id,
                    targetIca: 'CONNECTIONS_ICA', // Demo target
                    agentSignature: 'DigitalSign_ADRC_Agent_01'
                })
            });
            const result = await res.json();
            if (result.success) {
                setLeads(leads.filter(l => l.id !== activeLead.id));
                setActiveLead(null);
                setHandoffMode(false);
                alert("Referral released successfully! Secure trail initiated.");
            }
        } catch (err) {
            console.error("Handoff failed", err);
        }
    };

    if (loading) return <div className="module-container">Syncing with DHS Data Gateway...</div>;

    return (
        <div className="module-container" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px', height: 'calc(100vh - 120px)' }}>
            
            {/* 1. LEAD ROSTER (CRM SIDEBAR) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>Agency Hub</h3>
                        <select 
                            value={programMode} 
                            onChange={(e) => setProgramMode(e.target.value as any)}
                            style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 700 }}
                        >
                            <option value="ADRC">ADRC_MODE</option>
                            <option value="MCO">MCO_MODE</option>
                            <option value="ICA">ICA_MODE</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {programMode === 'ADRC' && "Resource & Discovery Center Context"}
                        {programMode === 'MCO' && "Managed Care Organization (Family Care)"}
                        {programMode === 'ICA' && "IRIS Consultant Agency (Self-Directed)"}
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search MCI or Name..." 
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-light)', fontSize: '0.8rem' }}
                    />
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {leads.map(lead => (
                        <div 
                            key={lead.id} 
                            onClick={() => setActiveLead(lead)}
                            style={{ 
                                padding: '15px', 
                                marginBottom: '10px', 
                                borderRadius: '8px', 
                                background: activeLead?.id === lead.id ? 'var(--primary-light)' : '#fff',
                                border: activeLead?.id === lead.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: activeLead?.id === lead.id ? 'var(--primary)' : 'inherit' }}>{lead.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>MCI: {lead.id} // PRIORITY: {lead.priority}</div>
                            <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                                <span className={`status-badge ${lead.ltcfsStatus === 'COMPLETE' ? 'green' : 'orange'}`} style={{ fontSize: '0.55rem' }}>SCREEN: {lead.ltcfsStatus}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. CLINICAL WORKSPACE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {activeLead ? (
                    <>
                        {/* HEADER: LEAD CONTEXT */}
                        <div className="card" style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--primary)' }}>
                            <div>
                                <h1 style={{ margin: 0 }}>{activeLead.name}</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assigned ADRC Counselor: Sarah Jenkins // Ref Source: ADRC Walk-in</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="secondary" onClick={() => setCounselingMode(true)}><i className="fas fa-balance-scale"></i> OPTIONS_COUNSELING</button>
                                <button className="primary" onClick={() => setHandoffMode(true)} disabled={activeLead.ltcfsStatus !== 'COMPLETE'}><i className="fas fa-paper-plane"></i> INITIATE_HANDOFF</button>
                            </div>
                        </div>

                        {/* COUNSELING / HANDOFF MODALS */}
                        {counselingMode && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                                <div style={{ width: '90%', maxWidth: '900px' }}>
                                    <CounselingAdvisorWizard 
                                        onComplete={(rec, score) => {
                                            alert(`Recommendation: ${rec}\nIRIS Score: ${score.iris}\nFamily Care Score: ${score.fcare}`);
                                            setCounselingMode(false);
                                        }}
                                        onCancel={() => setCounselingMode(false)}
                                    />
                                </div>
                            </div>
                        )}

                        {showSignatureModal && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
                                    <h3>Capture {showSignatureModal === 'participant' ? 'Participant' : 'Counselor'} Signature</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                        Please sign below to authorize the Choice/Enrollment form F-00075.
                                    </p>
                                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                                        <SignatureCanvas onSave={(data) => {
                                            setCapturedSignatures(prev => ({ ...prev, [showSignatureModal]: data }));
                                            setShowSignatureModal(null);
                                        }} />
                                    </div>
                                    <button 
                                        onClick={() => setShowSignatureModal(null)}
                                        className="secondary" 
                                        style={{ width: '100%', marginTop: '20px' }}
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </div>
                        )}

                        {handoffMode && (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
                                    <h3>Secure Referral Handoff (The Handshake)</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Releasing participant data packet to <strong>CONNECTIONS_ICA</strong>.</p>
                                    
                                    <div className="audit-table-mini" style={{ marginBottom: '25px', fontSize: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                            <span>F-00075 Auth Form</span>
                                            <span style={{ color: 'var(--status-green)' }}><i className="fas fa-check-circle"></i> VERIFIED</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                            <span>LTCFS Score (Nursing Home)</span>
                                            <span style={{ color: 'var(--status-green)' }}><i className="fas fa-check-circle"></i> VERIFIED</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                                            <span>MCI Identity Sync</span>
                                            <span style={{ color: 'var(--status-green)' }}><i className="fas fa-check-circle"></i> VERIFIED</span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>COUNSELOR SIGNATURE (DIGITAL_释放)</label>
                                        <input type="text" value="SARAH_JENKINS_ADRC" readOnly style={{ width: '100%', padding: '12px', background: '#f1f5f9', border: '2px dashed var(--primary)', borderRadius: '6px', fontFamily: 'monospace' }} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="secondary" style={{ flex: 1 }} onClick={() => setHandoffMode(false)}>CANCEL</button>
                                        <button className="primary" style={{ flex: 2 }} onClick={handleHandoff}>CONFIRM_RELEASE</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DASHBOARD: FUNCTIONAL SCREEN & ELIGIBILITY */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                            <div className="card" style={{ padding: '25px' }}>
                                <h4 style={{ marginTop: 0 }}>LTCFS Outcome</h4>
                                <div style={{ background: 'var(--bg-light)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>FUNCTIONAL_LEVEL</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{activeLead.ltcfsScore}</div>
                                </div>
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '10px' }}>DHS REQUIREMENTS CHECKLIST</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '0.75rem' }}><i className="fas fa-check-square" style={{ color: 'var(--status-green)' }}></i> FINANCIAL_ELIGIBILITY (ForwardHealth)</div>
                                        <div style={{ fontSize: '0.75rem' }}><i className="fas fa-check-square" style={{ color: 'var(--status-green)' }}></i> AGE / RESIDENCY VERIFIED</div>
                                        <div style={{ fontSize: '0.75rem' }}><i className="fas fa-square" style={{ color: '#ccc' }}></i> ENROLLMENT_COUNSELING_SIGNED</div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '25px' }}>
                                <h4 style={{ marginTop: 0 }}>Activity Timeline</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ paddingLeft: '20px', borderLeft: '2px solid var(--primary)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Lead Created via Walk-in</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Today at 10:45 AM</div>
                                    </div>
                                    <div style={{ paddingLeft: '20px', borderLeft: '2px solid #ccc', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: '#ccc' }}></div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>LTCFS Completed</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Yesterday at 2:15 PM</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </>
                ) : (
                    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <i className="fas fa-id-card-alt" style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.2 }}></i>
                        <h3>Select a Lead to Begin Counseling</h3>
                        <p style={{ fontSize: '0.85rem' }}>Access MCI records and functional screens from this hub.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ADRCModule;
