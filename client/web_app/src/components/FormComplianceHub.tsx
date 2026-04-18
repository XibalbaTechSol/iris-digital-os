import React, { useState, useEffect } from 'react';
import FormViewerModal from './FormViewerModal';

interface Form {
    id: string;
    form_code: string;
    status: 'PENDING' | 'SIGNED' | 'SUBMITTED';
    created_at: string;
}

interface FormComplianceHubProps {
    entityId: string;
    entityType: 'PARTICIPANT' | 'WORKER';
    onFormUpdate?: () => void;
}

const FORM_META: Record<string, string> = {
    'F-01201': 'IRIS PHW Set-Up',
    'F-82064': 'Background Information Disclosure',
    'F-00075': 'IRIS Authorization',
    'F-01201A': 'IRIS ISSP (Service Plan)',
    'F-01309': 'Participant Rights',
    'F-01293': 'FEA Transfer Checklist',
    'I-9': 'Employment Eligibility (Federal)',
    'W-4': 'Employee Withholding (Federal)'
};

interface HealthReport {
    score: number;
    missing: string[];
    expired: string[];
    valid: string[];
}

const FormComplianceHub: React.FC<FormComplianceHubProps> = ({ entityId, entityType, onFormUpdate }) => {
    const [forms, setForms] = useState<Form[]>([]);
    const [health, setHealth] = useState<HealthReport | null>(null);
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);

    const fetchForms = async () => {
        try {
            const res = await fetch(`/api/v1/forms/${entityId}`);
            const data = await res.json();
            if (data.success) setForms(data.forms);
        } catch (err) { }
    };

    const fetchHealth = async () => {
        try {
            const res = await fetch(`/api/v1/compliance/debt/${entityId}?type=${entityType}`);
            const data = await res.json();
            if (data.success) setHealth(data.health);
        } catch (err) { }
    };

    useEffect(() => {
        fetchForms();
        fetchHealth();
    }, [entityId]);

    const handleSignSuccess = () => {
        fetchForms();
        fetchHealth();
        if (onFormUpdate) onFormUpdate();
        setSelectedForm(null);
    };

    const getScoreColor = (score: number) => {
        if (score >= 100) return '#00c853';
        if (score >= 60) return '#ffab00';
        return '#d50000';
    };

    return (
        <div className="compliance-hub">
            {/* Document Debt HUD */}
            {health && (
                <div style={{ 
                    background: '#f8f9fa', 
                    borderRadius: '8px', 
                    padding: '15px', 
                    marginBottom: '20px', 
                    border: '1px solid var(--border-color)',
                    borderLeft: `5px solid ${getScoreColor(health.score)}`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>DOCUMENT_HEALTH_SCORE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: getScoreColor(health.score) }}>{health.score.toFixed(0)}%</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button 
                                onClick={() => alert('Triggering Bulk Regeneration Pattern...')}
                                style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                                <i className="fas fa-magic" style={{ marginRight: '5px' }}></i>
                                BULK_REGENERATE
                            </button>
                        </div>
                    </div>
                    
                    {(health.missing.length > 0 || health.expired.length > 0) && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '15px' }}>
                            {health.missing.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#d50000' }}>MISSING</div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {health.missing.map(m => <span key={m} style={{ fontSize: '0.6rem', background: 'rgba(213,0,0,0.1)', padding: '2px 5px', borderRadius: '3px' }}>{m}</span>)}
                                    </div>
                                </div>
                            )}
                            {health.expired.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ffab00' }}>EXPIRED</div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {health.expired.map(e => <span key={e} style={{ fontSize: '0.6rem', background: 'rgba(255,171,0,0.1)', padding: '2px 5px', borderRadius: '3px' }}>{e}</span>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <h4 style={{ margin: '0 0 15px 0', fontSize: '0.85rem', opacity: 0.7 }}>
                MANDATORY_DOCUMENTS ({entityType})
            </h4>
            
            <div style={{ display: 'grid', gap: '10px' }}>
                {forms.map(form => (
                    <div key={form.id} className="card" style={{ padding: '15px', border: '1px solid var(--border-color)', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800 }}>{form.form_code}</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{FORM_META[form.form_code] || form.form_code}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span className={`status-badge ${form.status === 'SIGNED' ? 'green' : 'yellow'}`} style={{ fontSize: '0.6rem' }}>
                                    {form.status}
                                </span>
                                
                                {form.status === 'PENDING' ? (
                                    <button 
                                        onClick={() => setSelectedForm(form)}
                                        style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        SIGN
                                    </button>
                                ) : (
                                    <a 
                                        href={`/api/v1/forms/download/${form.id}`} 
                                        download
                                        className="button-link"
                                        style={{ color: 'var(--primary)', fontSize: '0.8rem' }}
                                    >
                                        <i className="fas fa-download"></i>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {forms.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                        No digital form requirements found for this entity.
                    </div>
                )}
            </div>

            {selectedForm && (
                <FormViewerModal 
                    form={selectedForm} 
                    entityId={entityId}
                    onClose={() => setSelectedForm(null)}
                    onSuccess={handleSignSuccess}
                />
            )}
        </div>
    );
};

export default FormComplianceHub;
