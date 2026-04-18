import React, { useState } from 'react';

type RelationshipType = 'PARENT_OF_MINOR' | 'SPOUSE' | 'CHILD_OF_PARENT' | 'NON_RELATIVE';

const HirePacketWizard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [relationship, setRelationship] = useState<RelationshipType>('NON_RELATIVE');

    if (!isOpen) return null;

    const getTaxExemptions = (rel: RelationshipType) => {
        if (rel === 'PARENT_OF_MINOR' || rel === 'SPOUSE') {
            return { fica: 'EXEMPT', futa: 'EXEMPT', suta: 'EXEMPT' };
        }
        if (rel === 'CHILD_OF_PARENT') {
            return { fica: 'SUBJECT', futa: 'EXEMPT', suta: 'EXEMPT' };
        }
        return { fica: 'SUBJECT', futa: 'SUBJECT', suta: 'SUBJECT' };
    };

    const exemptions = getTaxExemptions(relationship);

    return (
        <div className="wizard-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="wizard-content" style={{
                width: '800px', background: '#111', border: '2px solid var(--accent-action)',
                padding: '40px', position: 'relative'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '20px', right: '20px', background: 'none',
                    border: 'none', color: '#888', cursor: 'pointer', fontFamily: 'Space Mono'
                }}>[X] CLOSE</button>

                <div className="wizard-header" style={{ marginBottom: '40px' }}>
                    <span style={{ fontFamily: 'Space Mono', color: 'var(--accent-terminal)' }}>STEP_0{step} // CAREGIVER_HIRE_PACKET</span>
                    <h2 style={{ fontFamily: 'Space Mono', fontSize: '1.5rem', marginTop: '10px' }}>
                        {step === 1 ? 'RELATIONSHIP & TAX LOGIC' : 'BACKGROUND DISCLOSURE (BID)'}
                    </h2>
                </div>

                {step === 1 && (
                    <div className="step-1">
                        <p style={{ marginBottom: '20px', color: '#888' }}>
                            Wisconsin F-01201A Logic: Caregiver relationship to Participant determines tax exemptions.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                            {(['NON_RELATIVE', 'PARENT_OF_MINOR', 'SPOUSE', 'CHILD_OF_PARENT'] as RelationshipType[]).map(rel => (
                                <div 
                                    key={rel}
                                    onClick={() => setRelationship(rel)}
                                    style={{
                                        border: `1px solid ${relationship === rel ? 'var(--accent-action)' : '#333'}`,
                                        padding: '15px', cursor: 'pointer', background: relationship === rel ? '#1e1e1e' : 'transparent'
                                    }}
                                >
                                    <span style={{ fontFamily: 'Space Mono', fontSize: '0.8rem' }}>{rel.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>

                        <div className="tax-prediction" style={{ background: '#000', padding: '20px', border: '1px dashed #444' }}>
                            <h4 style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: '#888', marginBottom: '15px' }}>PREDICTED_TAX_EXEMPTIONS</h4>
                            <div style={{ display: 'flex', gap: '40px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.6rem', color: '#888' }}>FICA (SS/MED)</label>
                                    <span style={{ color: exemptions.fica === 'EXEMPT' ? 'var(--accent-terminal)' : '#FFF', fontFamily: 'Space Mono' }}>{exemptions.fica}</span>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.6rem', color: '#888' }}>FUTA (FED UNEMP)</label>
                                    <span style={{ color: exemptions.futa === 'EXEMPT' ? 'var(--accent-terminal)' : '#FFF', fontFamily: 'Space Mono' }}>{exemptions.futa}</span>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.6rem', color: '#888' }}>SUTA (STATE UNEMP)</label>
                                    <span style={{ color: exemptions.suta === 'EXEMPT' ? 'var(--accent-terminal)' : '#FFF', fontFamily: 'Space Mono' }}>{exemptions.suta}</span>
                                </div>
                            </div>
                        </div>

                        <button className="primary" style={{ width: '100%', marginTop: '40px' }} onClick={() => setStep(2)}>
                            SAVE & CONTINUE TO BID
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-2">
                        <p style={{ marginBottom: '20px', color: '#888' }}>
                            Submitting caregiver data to WORCS for Background Information Disclosure check.
                        </p>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontFamily: 'Space Mono', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>CAREGIVER_LEGAL_NAME</label>
                            <input type="text" style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '10px', color: '#FFF' }} placeholder="JANE DOE" />
                        </div>
                        <div className="form-group" style={{ marginBottom: '40px' }}>
                            <label style={{ display: 'block', fontFamily: 'Space Mono', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>CAREGIVER_MCI_OR_SSN</label>
                            <input type="text" style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '10px', color: '#FFF' }} placeholder="XXX-XX-XXXX" />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <button className="primary" style={{ flex: 1, background: 'transparent', border: '1px solid #333' }} onClick={() => setStep(1)}>BACK</button>
                            <button className="primary" style={{ flex: 2 }} onClick={onClose}>SUBMIT TO STATE</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HirePacketWizard;
