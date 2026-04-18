import React, { useState } from 'react';

const IntegrityModule: React.FC = () => {
    const [noteContent, setNoteContent] = useState('');
    const [auditResult, setAuditResult] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    
    // Governance Settings
    const [severity, setSeverity] = useState<'SOFT_ALERT' | 'HARD_BLOCK'>('SOFT_ALERT');
    const [threshold, setThreshold] = useState(75);

    const handleRunAudit = async () => {
        setIsAuditing(true);
        // Simulated API call to IntegrityService with config
        setTimeout(() => {
            const hasShopping = noteContent.toLowerCase().includes('shopping');
            const hasTV = noteContent.toLowerCase().includes('watched tv');
            
            const score = Math.max(0, 100 - (hasShopping ? 25 : 0) - (hasTV ? 25 : 0));
            const isBillable = score >= threshold;
            const flags: any[] = [];
            if (hasShopping) flags.push({ key: 'shopping', suggestion: "Replace with 'Essential errands for health/safety/nutrition support'." });
            if (hasTV) flags.push({ key: 'watched tv', suggestion: "Non-billable activity. Remove from ADL documentation." });

            setAuditResult({ score, flags, isBillable });
            setIsAuditing(false);
        }, 1500);
    };

    const isSubmitDisabled = severity === 'HARD_BLOCK' && auditResult && !auditResult.isBillable;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* GOVERNANCE SETTINGS CARD (Refined per User Feedback) */}
            <div className="card" style={{ gridColumn: 'span 2', borderLeft: '4px solid var(--accent-terminal)' }}>
                <h3><i className="fas fa-sliders"></i> Governance Settings // AI_GUARD_MODES</h3>
                <div style={{ display: 'flex', gap: '40px', marginTop: '15px' }}>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: '#888', marginBottom: '8px' }}>SEVERITY_LEVEL</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                className={`primary ${severity === 'SOFT_ALERT' ? 'active' : ''}`}
                                onClick={() => setSeverity('SOFT_ALERT')}
                                style={{ margin: 0, padding: '5px 15px', fontSize: '0.65rem', background: severity === 'SOFT_ALERT' ? 'var(--accent-terminal)' : '#000', color: severity === 'SOFT_ALERT' ? '#000' : '#888' }}
                            >
                                SOFT_ALERT (ADVISORY)
                            </button>
                            <button 
                                className={`primary ${severity === 'HARD_BLOCK' ? 'active' : ''}`}
                                onClick={() => setSeverity('HARD_BLOCK')}
                                style={{ margin: 0, padding: '5px 15px', fontSize: '0.65rem', background: severity === 'HARD_BLOCK' ? 'var(--accent-action)' : '#000', color: severity === 'HARD_BLOCK' ? '#FFF' : '#888' }}
                            >
                                HARD_BLOCK (ENFORCEMENT)
                            </button>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', color: '#888', marginBottom: '8px' }}>BILLABILITY_THRESHOLD</div>
                        <input 
                            type="range" min="0" max="100" value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            style={{ width: '150px' }}
                        />
                        <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'var(--accent-terminal)' }}>{threshold}%</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3><i className="fas fa-shield-halved"></i> "The Integrity Shield" // Pre-Audit AI</h3>
                <textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Enter process note content..."
                    style={{ width: '100%', height: '150px', background: '#000', color: '#FFF', border: '1px solid #333', padding: '15px', fontFamily: 'Space Mono', fontSize: '0.8rem', marginTop: '15px' }}
                />

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button 
                        className="primary" 
                        onClick={handleRunAudit}
                        disabled={isAuditing || !noteContent}
                        style={{ flex: 1, background: isAuditing ? '#444' : 'var(--accent-action)' }}
                    >
                        {isAuditing ? 'ANALYZING...' : 'RUN_AUDIT'}
                    </button>
                    <button 
                        className="primary"
                        disabled={isSubmitDisabled || !auditResult}
                        style={{ flex: 1, background: isSubmitDisabled ? '#330000' : 'var(--accent-terminal)', color: isSubmitDisabled ? '#666' : '#000' }}
                    >
                        {isSubmitDisabled ? 'SUBMISSION_HELD' : 'SUBMIT_TO_WISITS'}
                    </button>
                </div>
                {isSubmitDisabled && (
                    <p style={{ color: 'var(--accent-action)', fontSize: '0.65rem', marginTop: '10px', fontFamily: 'Space Mono' }}>
                        ⚠ SUBMISSION_BLOCK: NOTE SCORE ({auditResult.score}%) BELOW GOVERNANCE THRESHOLD ({threshold}%).
                    </p>
                )}
            </div>

            <div className="card">
                <h3><i className="fas fa-microscope"></i> Audit Results</h3>
                {!auditResult ? (
                    <div style={{ textAlign: 'center', color: '#444', marginTop: '60px' }}>
                        <p style={{ fontFamily: 'Space Mono' }}>AWAITING_CONTENT...</p>
                    </div>
                ) : (
                    <div className="audit-output">
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div className="value" style={{ color: auditResult.isBillable ? 'var(--accent-terminal)' : 'var(--accent-action)' }}>
                                {auditResult.score}%
                            </div>
                            <span className={`status-badge ${auditResult.isBillable ? 'green' : 'red'}`} style={{ marginTop: '10px' }}>
                                {auditResult.isBillable ? 'BILLABLE' : 'RISK_DETECTED'}
                            </span>
                        </div>

                        {auditResult.flags.map((f: any, i: number) => (
                            <div key={i} style={{ background: '#000', padding: '12px', borderLeft: '3px solid var(--accent-action)', marginBottom: '10px' }}>
                                <div style={{ color: 'var(--accent-action)', fontSize: '0.6rem', fontFamily: 'Space Mono' }}>{f.key.toUpperCase()}</div>
                                <div style={{ color: '#888', fontSize: '0.7rem' }}>{f.suggestion}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntegrityModule;
