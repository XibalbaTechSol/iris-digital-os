import React, { useState, useEffect } from 'react';

interface Incident {
    id: string;
    type: string;
    status: string;
    reported_at: string;
}

const IncidentModule: React.FC = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [narrative, setNarrative] = useState('');
    const [sdohResult, setSdohResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        fetch('/api/v1/incidents/active', { headers: { 'x-tenant-id': 'CONNECTIONS-ICA' } })
            .then(res => res.json())
            .then(data => setIncidents(data.incidents || []));
    }, []);

    const handleAnalyzeSDOH = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/v1/incidents/sdoh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: narrative })
            });
            const data = await res.json();
            setSdohResult(data);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
            {/* INCIDENT NARRATIVE ENTRY */}
            <div className="card">
                <h3><i className="fas fa-file-signature"></i> Incident Narrative // NLP_ENTRY</h3>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    VHRP_COMPLIANCE_MODE: ACTIVE // AUDIT_READY
                </p>
                <textarea 
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    placeholder="Describe the incident (e.g. 'Participant fell, caregiver absent for 2 shifts...')" 
                    style={{ width: '100%', height: '300px', background: '#000', color: '#FFF', border: '1px solid #333', padding: '15px', fontFamily: 'Space Mono', fontSize: '0.85rem' }}
                />
                <button 
                    className="primary" 
                    onClick={handleAnalyzeSDOH} 
                    disabled={isAnalyzing || !narrative}
                    style={{ width: '100%', marginTop: '20px', background: isAnalyzing ? '#444' : 'var(--accent-action)' }}
                >
                    {isAnalyzing ? 'RUNNING_PREDICTIVE_ANALYSIS...' : 'EXECUTE_SDOH_RISK_SCAN'}
                </button>
            </div>

            {/* PREDICTIVE CLINICAL HUD (Refined per User Feedback) */}
            <div className="card" style={{ borderLeft: '4px solid #FF3333', background: 'rgba(255, 51, 51, 0.05)' }}>
                <h3><i className="fas fa-heart-pulse"></i> Predictive Clinical HUD // SDOH_AI</h3>
                {!sdohResult ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.3 }}>
                        <i className="fas fa-brain-circuit" style={{ fontSize: '2.5rem' }}></i>
                        <p style={{ marginTop: '20px', fontSize: '0.7rem', fontFamily: 'Space Mono' }}>AWAITING_NARRATIVE_DATA</p>
                    </div>
                ) : (
                    <div className="sdoh-output">
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div className="value" style={{ color: sdohResult.vulnerabilityLevel === 'CRITICAL' ? '#FF3333' : '#FFCC00' }}>
                                {sdohResult.hpsScore}%
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#888', fontFamily: 'Space Mono', marginTop: '5px' }}>HOSPITALIZATION_PROPENSITY_SCORE</div>
                            <span className={`status-badge ${sdohResult.vulnerabilityLevel === 'CRITICAL' ? 'red' : 'yellow'}`} style={{ marginTop: '10px' }}>
                                {sdohResult.vulnerabilityLevel}
                            </span>
                        </div>

                        <div style={{ background: '#000', padding: '15px', border: '1px solid #333', marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--accent-terminal)', fontFamily: 'Space Mono', marginBottom: '8px' }}>DETECTED_RISK_FACTORS:</div>
                            {sdohResult.detectedRisks.map((d: any, i: number) => (
                                <div key={i} style={{ marginBottom: '8px', fontSize: '0.75rem' }}>
                                    <span style={{ color: '#FF3333' }}>[!]</span> {d.factor}: "{d.indicator}"
                                </div>
                            ))}
                        </div>

                        <div style={{ background: '#330000', padding: '15px', border: '1px solid #660000', color: '#FF9999', fontSize: '0.7rem' }}>
                            <div style={{ fontFamily: 'Space Mono', marginBottom: '5px' }}>AI_RECOMMENDATION:</div>
                            {sdohResult.recommendation}
                        </div>
                    </div>
                )}
            </div>

            {/* ACTIVE INCIDENT QUEUE */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
                <h3><i className="fas fa-list-check"></i> Recent Incident Ledger</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
                    {incidents.slice(0, 4).map(inc => (
                        <div key={inc.id} style={{ background: '#000', padding: '12px', border: '1px solid #222' }}>
                            <div style={{ fontSize: '0.6rem', color: '#888' }}>{inc.reported_at}</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '5px' }}>{inc.type}</div>
                            <span className="status-badge red" style={{ fontSize: '0.5rem', marginTop: '8px' }}>{inc.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default IncidentModule;
