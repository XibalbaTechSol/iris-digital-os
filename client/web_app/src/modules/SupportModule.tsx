import React, { useState } from 'react';

interface OracleResponse {
    answer: string;
    policyManual: string;
    disclaimer: string;
}

const SupportModule: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState<OracleResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const askOracle = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/ai/policy-ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            const data = await res.json();
            setResponse(data);
        } catch (e) {
            console.error('Oracle failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-grid">
            <div className="card" style={{ gridColumn: 'span 2' }}>
                <h3><i className="fas fa-book-open"></i> AI Policy Knowledge Base</h3>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    KNOWLEDGE_SOURCE: WISCONSIN_IRIS_POLICY_MANUAL_OCT_2025
                </p>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <input 
                        type="text" 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a policy question (e.g., 'Can I pay rent?')..." 
                        style={{ flex: 1, background: '#000', border: '1px solid #333', padding: '12px', color: '#FFF', fontFamily: 'Space Mono' }} 
                    />
                    <button 
                        className="primary" 
                        style={{ marginTop: 0 }}
                        onClick={askOracle}
                        disabled={loading || !question}
                    >
                        {loading ? 'CONSULTING...' : 'ASK ORACLE'}
                    </button>
                </div>
                
                {response && (
                    <div style={{ marginTop: '20px', background: '#000', padding: '20px', borderLeft: '3px solid var(--accent-terminal)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-terminal)', fontFamily: 'Space Mono', marginBottom: '10px' }}>
                            CITATION: {response.policyManual}
                        </div>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '15px' }}>{response.answer}</p>
                        <p style={{ fontSize: '0.65rem', color: '#555', fontStyle: 'italic' }}>{response.disclaimer}</p>
                    </div>
                )}
            </div>
            
            <div className="card">
                <h3><i className="fas fa-headset"></i> Human Support</h3>
                <div className="value">4 ONLINE</div>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '10px' }}>AGENCY SUPPORT AGENTS</p>
                <button className="primary" style={{ fontSize: '0.7rem', background: 'transparent', border: '1px solid #333' }}>START_CHAT</button>
            </div>
        </div>
    );
};

export default SupportModule;
