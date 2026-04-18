import React from 'react';

const StateBridgeModule: React.FC = () => {
    return (
        <div className="card-grid">
            <div className="card">
                <h3><i className="fas fa-server"></i> Sandata v7.6 Gateway</h3>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <div style={{ 
                        fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-terminal)', 
                        fontFamily: 'Space Mono', border: '4px solid var(--accent-terminal)',
                        display: 'inline-block', padding: '10px 20px', marginBottom: '10px'
                    }}>0.04%</div>
                    <p style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: '#888' }}>PREDICTED_REJECTION_PROBABILITY</p>
                </div>
                <div style={{ marginTop: '20px', background: '#000', padding: '15px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-terminal)', fontFamily: 'Space Mono' }}>✓ AI_PRE_CHECK_COMPLETE</span>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Analyzing 1,204 visits for GPS drift and timing anomalies...</p>
                </div>
            </div>

            <div className="card">
                <h3><i className="fas fa-bridge"></i> Virtual WISITS Bridge</h3>
                <div className="value">CONNECTED</div>
                <p style={{ color: '#888', fontSize: '0.7rem' }}>LAST RPA SYNC: 12m AGO</p>
                <span className="status-badge green">122 RECORDS SIDELOADED</span>
                <button className="primary" style={{ marginTop: '20px', fontSize: '0.7rem' }}>FORCE_SYNC</button>
            </div>

            <div className="card">
                <h3><i className="fas fa-clock"></i> LTC-IES Encounters</h3>
                <div className="value">98.2%</div>
                <p style={{ color: '#888', fontSize: '0.7rem' }}>XML BATCH READY (FY26-Q2-B4)</p>
                <button className="primary" style={{ background: 'transparent', border: '1px solid #333', fontSize: '0.7rem' }}>GENERATE_837P</button>
            </div>
        </div>
    );
};

export default StateBridgeModule;
