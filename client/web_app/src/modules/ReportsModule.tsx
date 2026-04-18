import React, { useState } from 'react';

const ReportsModule: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const handleGenerateStateReport = async (code: string) => {
        setIsGenerating(code);
        // Simulated API call to ReportingService
        setTimeout(() => {
            setIsGenerating(null);
            alert(`SUCCESS: State Report ${code} generated. Document synced to Snowflake Secure Share for DHS access.`);
        }, 2500);
    };

    return (
        <div className="card-grid">
            {/* ONE-CLICK STATE REPORTS (NEW) */}
            <div className="card" style={{ gridColumn: 'span 2', borderLeft: '4px solid var(--accent-terminal)', background: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3><i className="fas fa-file-contract"></i> One-Click State Reporting // DHS_COMPLIANCE</h3>
                    <span className="status-badge green">SNOWFLAKE_SYNC_ACTIVE</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div style={{ border: '1px solid #222', padding: '15px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>F-02047 Financial Report</div>
                        <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '5px' }}>
                            Aggregate expenditure data formatted for quarterly Wisconsin DHS submission.
                        </p>
                        <button 
                            className="primary" 
                            style={{ margin: '15px 0 0 0', width: '100%', fontSize: '0.65rem' }}
                            onClick={() => handleGenerateStateReport('F-02047')}
                            disabled={isGenerating === 'F-02047'}
                        >
                            {isGenerating === 'F-02047' ? 'AGGREGATING_SNOWFLAKE_DATA...' : 'GENERATE_QUARTERLY_F-02047'}
                        </button>
                    </div>
                    <div style={{ border: '1px solid #222', padding: '15px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>F-02021 CPA Audit Template</div>
                        <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '5px' }}>
                            Comprehensive data bundle for annual IRIS Certified Public Accountant audit.
                        </p>
                        <button 
                            className="primary" 
                            style={{ margin: '15px 0 0 0', width: '100%', fontSize: '0.65rem' }}
                            onClick={() => handleGenerateStateReport('F-02021')}
                            disabled={isGenerating === 'F-02021'}
                        >
                            {isGenerating === 'F-02021' ? 'EXTRACTING_LEDGER...' : 'PREPARE_AUDIT_DATA_F-02021'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 2' }}>
                <h3><i className="fas fa-hospital-user"></i> Hospitalization & Readmission Tracking</h3>
                {/* ... existing chart code ... */}
                <div className="bar-chart" style={{ marginTop: '20px' }}>
                    <div className="bar" style={{ height: '100px' }}><div className="bar-fill" style={{ height: '40%' }}></div><div className="bar-label">JAN</div></div>
                    <div className="bar" style={{ height: '100px' }}><div className="bar-fill" style={{ height: '60%' }}></div><div className="bar-label">FEB</div></div>
                    <div className="bar" style={{ height: '100px' }}><div className="bar-fill" style={{ height: '25%' }}></div><div className="bar-label">MAR</div></div>
                    <div className="bar" style={{ height: '100px' }}><div className="bar-fill" style={{ height: '15%', background: 'var(--accent-action)' }}></div><div className="bar-label">APR*</div></div>
                </div>
            </div>

            <div className="card">
                <h3><i className="fas fa-users"></i> Caregiver Retention</h3>
                <div className="value">92%</div>
                <p style={{ color: 'var(--accent-terminal)', fontSize: '0.7rem' }}>+4% FROM LAST QUARTER</p>
            </div>

            <div className="card">
                <h3><i className="fas fa-file-export"></i> Custom Batch Reports</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                    <label style={{ fontSize: '0.65rem' }}><input type="checkbox" checked readOnly/> EVV_COMPLIANCE_SUMMARY</label>
                    <label style={{ fontSize: '0.65rem' }}><input type="checkbox" checked readOnly/> REVENUE_BY_PAYER</label>
                    <button className="primary" style={{ width: '100%', marginTop: '10px' }}>EXECUTE_BATCH</button>
                </div>
            </div>
        </div>
    );
};

export default ReportsModule;
