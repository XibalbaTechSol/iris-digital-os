import React, { useState } from 'react';

interface ReferralIntakeWizardProps {
    onComplete: () => void;
    onClose: () => void;
}

const ReferralIntakeWizard: React.FC<ReferralIntakeWizardProps> = ({ onComplete, onClose }) => {
    const [participantName, setParticipantName] = useState('');
    const [mciId, setMciId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!participantName) return;
        setIsSubmitting(true);
        try {
            await fetch('/api/v1/onboarding/participant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    participant: { participantName, mciId },
                    source: 'MANUAL'
                })
            });
            onComplete();
        } catch (e) {
            console.error('Failed to submit referral', e);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="card" style={{ maxWidth: '500px', margin: '20px auto', background: '#fff', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>ADRC Referral Intake</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                        PARTICIPANT FULL NAME
                    </label>
                    <input 
                        className="search-input"
                        placeholder="Legal Name as per F-00075"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                        MCI NUMBER
                    </label>
                    <input 
                        className="search-input"
                        placeholder="10-digit Master Client Index"
                        value={mciId}
                        onChange={(e) => setMciId(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px', fontSize: '0.7rem' }}>
                    <i className="fas fa-info-circle"></i> Manual entry will trigger the 72-hour compliance clock.
                </div>

                <button 
                    onClick={handleSubmit} 
                    className="primary" 
                    disabled={!participantName || isSubmitting}
                    style={{ padding: '12px' }}
                >
                    {isSubmitting ? 'PROCESSING...' : 'CREATE_REFERRAL_ENTRY'}
                </button>
            </div>
        </div>
    );
};

export default ReferralIntakeWizard;
