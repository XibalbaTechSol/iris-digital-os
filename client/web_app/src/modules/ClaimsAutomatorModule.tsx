import React, { useState } from 'react';

interface Claim {
    claimId: string;
    isValid: boolean;
    status: 'READY' | 'NEEDS_CORRECTION';
    errors: string[];
    participant: { name: string; mciId: string };
    service: { hcpcs: string; units: number };
    totalCharged: string;
}

interface ClaimResponse {
    success: boolean;
    batchId: string;
    totalCount: number;
    validCount: number;
    invalidCount: number;
    ediPayload: string;
    claims: Claim[];
    cms1500Mapping: any;
}

const ClaimsAutomatorModule: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ClaimResponse | null>(null);
    const [viewMode, setViewMode] = useState<'EDI' | 'PHYSICAL'>('EDI');

    const MOCK_SHIFTS = [
        { id: 'V-001', participantName: 'MARCUS_WISCONSIN', type: 'CASE_MGMT', durationMinutes: 45, startTime: '2026-04-16T08:00:00Z' },
        { id: 'V-002', participantName: 'UNKNOWN_MEMBER', type: 'CASE_MGMT', durationMinutes: 12, startTime: '2026-04-16T10:00:00Z' },
        { id: 'V-003', participantName: 'MARCUS_WISCONSIN', type: 'CASE_MGMT', durationMinutes: 60, startTime: '2026-04-16T13:00:00Z' }
    ];

    const handleAutomate = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/v1/billing/automate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shifts: MOCK_SHIFTS,
                    participant: { name: 'MARCUS_WISCONSIN', mciId: '12345678', dob: '1985-05-15' }, // Intentional error (8 digits)
                    authorizations: [
                        { serviceType: 'CASE_MGMT', hcpcs: 'T1019', rate: 5.25 }
                    ],
                    metadata: {
                        billingProviderName: 'PREMIER_FEA_SERVICES',
                        billingProviderNpi: '1234567890',
                        renderingProviderNpi: '0987654321',
                        taxId: '99-8887776',
                        facilityAddress: '123_STATE_ST_MADISON_WI'
                    }
                })
            });
            const data = await res.json();
            setResult(data);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '25px' }}>
            <div className="card">
                <h3><i className="fas fa-microchip"></i> DHS Billing Engine</h3>
                <p style={{ color: '#888', fontSize: '0.65rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    FORWARDHEALTH_COMPLIANCE_V2.1
                </p>

                {result && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, padding: '10px', background: '#002200', border: '1px solid var(--accent-terminal)', borderRadius: '4px' }}>
                            <div style={{ fontSize: '1rem', color: 'var(--accent-terminal)' }}>{result.validCount}</div>
                            <div style={{ fontSize: '0.5rem', opacity: 0.7 }}>VALID_CLAIMS</div>
                        </div>
                        <div style={{ flex: 1, padding: '10px', background: result.invalidCount > 0 ? '#330000' : '#111', border: result.invalidCount > 0 ? '1px solid var(--accent-action)' : '1px solid #333', borderRadius: '4px' }}>
                            <div style={{ fontSize: '1rem', color: result.invalidCount > 0 ? 'var(--accent-action)' : '#666' }}>{result.invalidCount}</div>
                            <div style={{ fontSize: '0.5rem', opacity: 0.7 }}>NEEDS_CORRECTION</div>
                        </div>
                    </div>
                )}

                <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                    {(result?.claims || MOCK_SHIFTS).map((c: any) => (
                        <div key={c.id || c.claimId} style={{ 
                            padding: '12px', background: '#080808', border: '1px solid #111', 
                            marginBottom: '10px', borderRadius: '4px',
                            borderLeft: c.status ? `4px solid ${c.isValid ? 'var(--accent-terminal)' : 'var(--accent-action)'}` : 'none'
                        }}>
                            <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'Space Mono' }}>{c.id || c.claimId.slice(-8)}</span>
                                <span style={{ 
                                    fontSize: '0.55rem', padding: '2px 6px', borderRadius: '2px',
                                    background: c.status === 'READY' ? '#003300' : (c.status === 'NEEDS_CORRECTION' ? '#330000' : '#333'),
                                    color: c.status === 'READY' ? 'var(--accent-terminal)' : (c.status === 'NEEDS_CORRECTION' ? 'var(--accent-action)' : '#888')
                                }}>
                                    {c.status || 'UNPROCESSED'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.65rem', marginTop: '5px' }}>{c.participantName || c.participant.name}</div>
                            {c.errors && c.errors.length > 0 && (
                                <div style={{ fontSize: '0.55rem', color: 'var(--accent-action)', marginTop: '8px', fontStyle: 'italic' }}>
                                    {c.errors.map((e: string, i: number) => <div key={i}>⚠ {e}</div>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    className="primary" 
                    onClick={handleAutomate}
                    disabled={isProcessing}
                    style={{ width: '100%', padding: '15px' }}
                >
                    {isProcessing ? 'DHS_VALIDATION_IN_PROGRESS...' : 'RUN_COMPLIANCE_AUTOMATION'}
                </button>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3><i className="fas fa-file-invoice"></i> Batch Manifest</h3>
                    {result && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setViewMode('EDI')}
                                style={{ background: viewMode === 'EDI' ? '#222' : 'transparent', border: '1px solid #333', fontSize: '0.6rem', padding: '5px 12px', borderRadius: '4px' }}
                            >X12 837P</button>
                            <button 
                                onClick={() => setViewMode('PHYSICAL')}
                                style={{ background: viewMode === 'PHYSICAL' ? '#222' : 'transparent', border: '1px solid #333', fontSize: '0.6rem', padding: '5px 12px', borderRadius: '4px' }}
                            >CMS-1500 PREVIEW</button>
                        </div>
                    )}
                </div>

                {result ? (
                    <div style={{ background: '#000', border: '1px solid #111', height: '600px', overflow: 'auto', padding: '20px', position: 'relative' }}>
                        {viewMode === 'EDI' ? (
                            <>
                                <pre style={{ fontSize: '0.65rem', color: 'var(--accent-terminal)', fontFamily: 'Space Mono', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                    {result.ediPayload}
                                </pre>
                                {result.invalidCount > 0 && (
                                    <div style={{ 
                                        position: 'absolute', bottom: '20px', right: '20px', 
                                        padding: '10px', background: '#330000', border: '1px solid var(--accent-action)',
                                        fontSize: '0.6rem', fontFamily: 'Space Mono', color: 'var(--accent-action)',
                                        borderRadius: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                                    }}>
                                        ⚠ BATCH_RESTRICTED: {result.invalidCount} CLAIMS SUPPRESSED DUE TO VALIDATION ERRORS.
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '15px' }}>
                                    <button 
                                        className="primary"
                                        onClick={async () => {
                                            const metadata = {
                                                billingProviderName: 'PREMIER_FEA_SERVICES',
                                                billingProviderNpi: '1234567890',
                                                renderingProviderNpi: '0987654321',
                                                taxId: '99-8887776',
                                                facilityAddress: '123_STATE_ST_MADISON_WI'
                                            };
                                            const claim = result.claims[0]; // For demo, download first claim
                                            const res = await fetch(`/api/v1/billing/download-cms1500/${claim.claimId || 'MOCK'}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ metadata, claim })
                                            });
                                            const blob = await res.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `CMS1500_${claim.claimId || 'MOCK'}.pdf`;
                                            a.click();
                                        }}
                                        style={{ fontSize: '0.7rem', padding: '10px 20px' }}
                                    >
                                        <i className="fas fa-file-download"></i> DOWNLOAD_OFFICIAL_CMS-1500_PDF
                                    </button>
                                    <div style={{ color: '#888', fontSize: '0.6rem', alignSelf: 'center', fontFamily: 'Space Mono' }}>
                                        VERSION: NUCC_1500_02/12_FILLABLE
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                    {Object.entries(result.cms1500Mapping).map(([key, val]: any) => (
                                        <div key={key} style={{ padding: '10px', border: '1px solid #111', background: '#050505', borderRadius: '4px' }}>
                                            <div style={{ fontSize: '0.5rem', color: '#444', marginBottom: '4px' }}>{key}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#AAA', wordBreak: 'break-all' }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '600px', flexDirection: 'column', color: '#222' }}>
                        <i className="fas fa-shield-halved" style={{ fontSize: '4rem', marginBottom: '20px' }}></i>
                        <p style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', opacity: 0.5 }}>DHS_PROTOCOL_IDLE</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClaimsAutomatorModule;
