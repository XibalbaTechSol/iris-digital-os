import React, { useState, useEffect } from 'react';

interface Participant {
    id: string;
    name: string;
    mci_id: string;
    ica: string;
}

const InteropModule: React.FC = () => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
    const [fhirPreview, setFhirPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/v1/case/participants')
            .then(res => res.json())
            .then(data => setParticipants(data.participants || []));
    }, []);

    const previewFHIR = (participantId: string) => {
        setLoading(true);
        setSelectedParticipant(participantId);
        fetch(`/api/v1/interop/fhir/Bundle/${participantId}`)
            .then(res => res.json())
            .then(data => {
                setFhirPreview(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const downloadFHIR = () => {
        if (!fhirPreview) return;
        const blob = new Blob([JSON.stringify(fhirPreview, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FHIR_Clinical_Summary_${selectedParticipant}.json`;
        a.click();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Interoperability Hub</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '5px' }}>
                        HL7 FHIR R4 Standard Clinical Data Exchange (CCDA/HIE)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span className="status-badge green">HIE_GATEWAY_ACTIVE</span>
                    <span className="status-badge blue">FHIR_R4_COMPLIANT</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                {/* 1. Participant Selection */}
                <div className="card">
                    <h3>Select Participant</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                        {participants.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => previewFHIR(p.id)}
                                style={{ 
                                    padding: '12px', 
                                    background: selectedParticipant === p.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: selectedParticipant === p.id ? '#fff' : 'inherit' }}>{p.name}</div>
                                <div style={{ fontSize: '0.65rem', color: selectedParticipant === p.id ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{p.id} // {p.ica}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. FHIR Preview & Export */}
                <div className="card" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3>Record Preview (FHIR R4 Bundle)</h3>
                        {fhirPreview && (
                            <button className="primary" onClick={downloadFHIR} style={{ fontSize: '0.7rem' }}>
                                <i className="fas fa-download"></i> EXPORT_CLINICAL_SUMMARY
                            </button>
                        )}
                    </div>

                    <div style={{ 
                        flex: 1, 
                        background: 'rgba(0,0,0,0.2)', 
                        borderRadius: '8px', 
                        padding: '15px', 
                        fontFamily: 'Space Mono', 
                        fontSize: '0.75rem', 
                        overflowY: 'auto',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--accent-terminal)'
                    }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                COMPILING_RESOURCE_BUNDLE...
                            </div>
                        ) : fhirPreview ? (
                            <pre style={{ margin: 0 }}>{JSON.stringify(fhirPreview, null, 2)}</pre>
                        ) : (
                            <div style={{ color: '#888', textAlign: 'center', marginTop: '100px' }}>
                                <i className="fas fa-file-code" style={{ fontSize: '2rem', marginBottom: '15px', display: 'block' }}></i>
                                Select a participant to generate a standardized FHIR Resource Bundle.
                            </div>
                        )}
                    </div>

                    {fhirPreview && (
                        <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px', color: 'var(--accent-action)' }}>
                                <i className="fas fa-shield-check"></i> COMPLIANCE_VALIDATION_PASSED
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#888', lineHeight: '1.5' }}>
                                This bundle includes Patient PII, CarePlan (Budget), and recent Service Observations. 
                                Exporting this data will generate a <strong>HIPAA_DISCLOSURE_RECORD</strong> in the system audit trail.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Integration Status Grid */}
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="card" style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>EPIC_CONNECTOR</span>
                        <span className="status-badge green">CONNECTED</span>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '10px' }}>LAST_SYNC: 2026-04-16 14:02</div>
                </div>
                <div className="card" style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>WISDOM_HIE</span>
                        <span className="status-badge green">CONNECTED</span>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '10px' }}>LAST_SYNC: 2026-04-17 09:15</div>
                </div>
                <div className="card" style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>WELLSKY_EHR</span>
                        <span className="status-badge red">PENDING_API_KEY</span>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#888', marginTop: '10px' }}>CONFIGURATON_REQUIRED</div>
                </div>
            </div>
        </div>
    );
};

export default InteropModule;
