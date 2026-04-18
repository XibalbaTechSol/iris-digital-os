import React, { useState } from 'react';

interface ScribeResult {
    structuredDraft: string;
    entities: { participantName: string; workerName: string };
}

const AISuiteModule: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [scribeResult, setScribeResult] = useState<ScribeResult | null>(null);
    const [isSmartMapping, setIsSmartMapping] = useState(false);
    const [smartMapSuggestions, setSmartMapSuggestions] = useState<any[]>([]);

    const toggleRecording = async () => {
        if (isRecording) {
            setIsRecording(false);
            const res = await fetch('/api/v1/ai/scribe', { method: 'POST' });
            const data = await res.json();
            setScribeResult(data);
        } else {
            setIsRecording(true);
            setScribeResult(null);
        }
    };

    const handleMapPdf = async () => {
        if (!scribeResult) return;
        const res = await fetch('/api/v1/ai/map-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateId: 'F-01689', data: scribeResult.entities })
        });
        const data = await res.json();
        alert(`Mapped to ${data.template}. Status: ${data.burnStatus}`);
    };

    const handleSmartMap = async () => {
        setIsSmartMapping(true);
        const pdfTags = ['First_Name_01', 'Last_Name_01', 'DOB_Recipient', 'MCI_ID_PRIMARY'];
        
        try {
            const res = await fetch('/api/v1/ai/smart-map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: pdfTags })
            });
            const data = await res.json();
            setSmartMapSuggestions(data.suggestions);
            alert(`AI Smart-Map Complete. ${data.suggestions.length} fields automapped.`);
        } finally {
            setIsSmartMapping(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
                <h3><i className="fas fa-microphone-lines"></i> Ambient Case Scribe</h3>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    MODE: WHISPER_V3_LIVE_CAPTURE
                </p>
                
                <div style={{ 
                    height: '200px', background: '#000', border: '1px solid #333',
                    padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', marginBottom: '20px'
                }}>
                    {isRecording ? (
                        <>
                            <div className="pulse-circle"></div>
                            <p style={{ marginTop: '20px', fontFamily: 'Space Mono', color: 'var(--accent-action)' }}>RECORDING_VISIT...</p>
                        </>
                    ) : (
                        scribeResult ? (
                            <pre style={{ fontSize: '0.6rem', color: 'var(--accent-terminal)', whiteSpace: 'pre-wrap' }}>
                                {scribeResult.structuredDraft}
                            </pre>
                        ) : (
                            <>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#111' }}></div>
                                <p style={{ marginTop: '20px', fontFamily: 'Space Mono', color: '#444' }}>IDLE_WAITING_FOR_START</p>
                            </>
                        )
                    )}
                </div>

                <button 
                    className="primary" 
                    onClick={toggleRecording}
                    style={{ background: isRecording ? '#555' : 'var(--accent-action)' }}
                >
                    {isRecording ? 'STOP_&_STRUCTURE_NOTE' : 'START_AMBIENT_SCRIBE'}
                </button>
            </div>

            <div className="card">
                <h3><i className="fas fa-magic"></i> Intelligent Document Mapping</h3>
                <div style={{ background: '#080808', border: '1px solid #111', height: '200px', marginBottom: '20px', overflowY: 'auto' }}>
                    {smartMapSuggestions.length > 0 ? (
                        <table style={{ width: '100%', fontSize: '0.6rem', fontFamily: 'Space Mono' }}>
                            <tbody>
                                {smartMapSuggestions.map((s, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ color: '#666' }}>{s.tag}</td>
                                        <td style={{ color: 'var(--accent-terminal)' }}>→ {s.irisKey}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#333', fontSize: '0.6rem' }}>
                            NO_FIELDS_MAPPED
                        </div>
                    )}
                </div>
                <button className="primary" onClick={handleSmartMap} disabled={isSmartMapping}>
                    {isSmartMapping ? 'ANALYZING_GEOMETRY...' : 'RUN_SMART_MAP'}
                </button>
                {scribeResult && <button className="primary" onClick={handleMapPdf} style={{ marginTop: '10px', background: 'transparent', border: '1px solid #333' }}>BURN_TO_DHS_PDF</button>}
            </div>

            <style>{`
                .pulse-circle {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background: var(--accent-action);
                    animation: scribe-pulse 1.5s infinite;
                }
                @keyframes scribe-pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 69, 0, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 69, 0, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 69, 0, 0); }
                }
            `}</style>
        </div>
    );
};

export default AISuiteModule;
