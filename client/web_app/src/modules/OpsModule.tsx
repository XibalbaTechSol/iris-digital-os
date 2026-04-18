import React, { useState, useEffect } from 'react';

interface StarRating {
    predictedRating: string;
    breakdown: {
        responsiveness: string;
        accuracy: string;
    };
    recommendation: string;
}

const OpsModule: React.FC = () => {
    const [rating, setRating] = useState<StarRating | null>(null);

    useEffect(() => {
        fetch('/api/v1/ops/star-rating', { headers: { 'x-tenant-id': 'CONNECTIONS-ICA' } })
            .then(res => res.json())
            .then(data => setRating(data));
    }, []);

    return (
        <div className="card-grid">
            <div className="card">
                <h3><i className="fas fa-star-half-stroke"></i> Star-Rating Predictor</h3>
                {rating ? (
                    <>
                        <div className="value">{rating.predictedRating}</div>
                        <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '15px', fontFamily: 'Space Mono' }}>
                            AGENCY_SCORECARD: 2025_METHODOLOGY
                        </p>
                        <div style={{ fontSize: '0.8rem', background: '#000', padding: '10px', borderLeft: '2px solid var(--accent-terminal)' }}>
                            {rating.recommendation}
                        </div>
                    </>
                ) : (
                    <p style={{ fontFamily: 'Space Mono' }}>CALCULATING_SCORECARD...</p>
                )}
            </div>

            <div className="card">
                <h3><i className="fas fa-eye"></i> Auditor Transparency</h3>
                <div className="value">SECURE</div>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    PORTAL_ACCESS: DQA_STATE_AUDITORS
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="status-badge green">3 ACTIVE SESSIONS</span>
                    <button className="primary" style={{ margin: 0, fontSize: '0.65rem', padding: '5px 10px' }}>REVOKE_ALL</button>
                </div>
            </div>

            <div className="card">
                <h3><i className="fas fa-satellite-dish"></i> Transfer Sentinel</h3>
                <div className="value">SYNCING</div>
                <p style={{ color: '#888', fontSize: '0.7rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    AUTO_WELCOME: 72HR_SEQUENCE
                </p>
                <span className="status-badge green">12 TRANSFERS INBOUND</span>
            </div>
        </div>
    );
};

export default OpsModule;
