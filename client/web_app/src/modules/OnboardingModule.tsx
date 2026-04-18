import React, { useState, useEffect } from 'react';
import SignatureCanvas from '../components/SignatureCanvas';
import HirePacketWizard from '../components/HirePacketWizard';
import IntakeQuestionnaire from '../components/IntakeQuestionnaire';

type ViewMode = 'WORKERS' | 'REFERRALS' | 'AUTOMATED_INTAKE';

const OnboardingModule: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('REFERRALS');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
    const [activeReferral, setActiveReferral] = useState<any>(null);

    useEffect(() => {
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        const res = await fetch('/api/v1/onboarding/referrals');
        const data = await res.json();
        setReferrals(data);
    };

    const handleFinalizeWorkOrder = async (signature: string) => {
        if (!activeReferral) return;
        
        const res = await fetch('/api/v1/onboarding/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                participantId: activeReferral.id,
                budget: { lines: [{ serviceCode: 'T1019', units: 40, rate: 22.50 }] },
                signature
            })
        });

        const data = await res.json();
        if (data.success) {
            alert(`SUCCESS: Work Order ${data.workOrder.id} Automated.`);
            setIsWorkOrderModalOpen(false);
            fetchReferrals();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. PIPELINE SWITCHER */}
            <div className="card" style={{ padding: '10px', background: '#fff' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                        onClick={() => setViewMode('REFERRALS')}
                        style={{ flex: 1, padding: '10px', fontSize: '0.7rem', border: 'none', borderRadius: '4px', background: viewMode === 'REFERRALS' ? 'var(--accent-action)' : 'transparent', color: viewMode === 'REFERRALS' ? '#fff' : '#64748b', cursor: 'pointer' }}
                    >PARTICIPANT_REFERRALS (ADRC)</button>
                    <button 
                        onClick={() => setViewMode('WORKERS')}
                        style={{ flex: 1, padding: '10px', fontSize: '0.7rem', border: 'none', borderRadius: '4px', background: viewMode === 'WORKERS' ? 'var(--accent-action)' : 'transparent', color: viewMode === 'WORKERS' ? '#fff' : '#64748b', cursor: 'pointer' }}
                    >WORKER_RECRUITMENT (ATS)</button>
                    <button 
                        onClick={() => setViewMode('AUTOMATED_INTAKE')}
                        style={{ flex: 1, padding: '10px', fontSize: '0.7rem', border: 'none', borderRadius: '4px', background: viewMode === 'AUTOMATED_INTAKE' ? 'var(--accent-terminal)' : 'transparent', color: viewMode === 'AUTOMATED_INTAKE' ? '#000' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
                    >⚡ START_AUTOMATED_INTAKE</button>
                </div>
            </div>

            {/* 2. MAIN PIPELINE VIEW */}
            {viewMode === 'AUTOMATED_INTAKE' ? (
                <IntakeQuestionnaire onComplete={() => setViewMode('REFERRALS')} />
            ) : viewMode === 'REFERRALS' ? (
                <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {['RECEIVED', 'WELCOME_CALL', 'CHOICE_SIGNED', 'ACTIVE'].map(status => (
                        <div key={status} style={{ background: '#f8fafc', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b', marginBottom: '15px' }}>{status}</div>
                            {referrals.filter(r => r.status === status || (status === 'RECEIVED' && r.status === 'RECEIVED')).map(r => (
                                <div key={r.id} className="card" style={{ background: '#fff', borderLeft: '4px solid var(--accent-action)', marginBottom: '10px', padding: '12px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{r.participantName}</div>
                                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '5px' }}>ID: {r.id}</div>
                                    
                                    {r.welcomeCallDeadline && (
                                        <div style={{ marginTop: '10px', padding: '5px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '0.55rem', color: '#e11d48' }}>
                                            <i className="fas fa-clock"></i> 72H_DEADLINE_IN: 14h 22m
                                        </div>
                                    )}

                                    {status === 'CHOICE_SIGNED' && (
                                        <button 
                                            onClick={() => { setActiveReferral(r); setIsWorkOrderModalOpen(true); }}
                                            className="primary" 
                                            style={{ marginTop: '10px', fontSize: '0.55rem', padding: '5px' }}
                                        >AUTOMATE_WORK_ORDER</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <h3>WORKER_RECRUITMENT_MODE</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Hiring pipeline and BG check engine active.</p>
                </div>
            )}

            {/* 3. WORK ORDER AUTOMATION MODAL */}
            {isWorkOrderModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '500px', background: '#fff' }}>
                        <h3>AUTOMATE_SERVICE_AUTHORIZATION</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '20px' }}>
                            Finalizing compliance for <strong>{activeReferral?.participantName}</strong>. 
                            This will generate work orders for T1019/S5125 based on the approved ISSP budget.
                        </p>
                        
                        <SignatureCanvas onSave={(img) => console.log('Signature Captured')} />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setIsWorkOrderModalOpen(false)} style={{ flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '4px' }}>CANCEL</button>
                            <button onClick={() => handleFinalizeWorkOrder('MOCK_SIG')} className="primary" style={{ flex: 2 }}>APPROVE_AND_GENERATE_WORK_ORDER</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingModule;
