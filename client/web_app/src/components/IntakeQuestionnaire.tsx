import React, { useState } from 'react';

/**
 * IRIS OS - PFMS Automated Intake Questionnaire
 * Goal: Simplify the complex FEA worker packet into a wizard experience.
 */
const IntakeQuestionnaire: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [isTransfer, setIsTransfer] = useState(false);
    const [formData, setFormData] = useState({
        participant: { name: '', mciId: '' },
        worker: { name: '', dob: '', ssn: '', email: '' },
        relationship: { type: 'NONE', isRelative: false },
        bid: { q1: false, q2: false, q3: false, comments: '' }
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        const res = await fetch('/api/v1/onboarding/pfms-intake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intakeData: { ...formData, isTransfer } })
        });
        const data = await res.json();
        if (data.success) {
            setIsSubmitted(true);
        }
    };

    const handleDownload = async (formType: string) => {
        const res = await fetch(`/api/v1/onboarding/download-dhs/${formType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intakeData: { ...formData, isTransfer } })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formType}_Completed.pdf`;
        a.click();
    };

    if (isSubmitted) {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '20px auto', background: '#fff', textAlign: 'center' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: 'var(--accent-terminal)', marginBottom: '20px' }}></i>
                <h3>INTAKE_PACKET_GENERATED</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '30px' }}>
                    The official Wisconsin DHS paperwork has been automatically mapped with the provided data. Copies have been emailed to the worker.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                    <button 
                        onClick={() => handleDownload('F-01201')} 
                        className="primary" 
                        style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
                    >
                        <i className="fas fa-file-pdf"></i> DOWNLOAD_F-01201 (IRIS WORKER SET-UP)
                    </button>
                    
                    <button 
                        onClick={() => handleDownload('F-82064')} 
                        className="primary" 
                        style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
                    >
                        <i className="fas fa-file-pdf"></i> DOWNLOAD_F-82064 (BACKGROUND DISCLOSURE)
                    </button>
                </div>

                <button onClick={onComplete} className="primary" style={{ width: '100%' }}>RETURN_TO_PIPELINE</button>
            </div>
        );
    }

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '20px auto', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>PFMS_AUTOMATED_INTAKE_WIZARD</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-action)' }}>STEP_{step}_OF_4</span>
            </div>

            {/* STEP 1: PARTICIPANT INFO */}
            {step === 1 && (
                <div className="funnel-container">
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '15px' }}>SECTION_I: PARTICIPANT_EMPLOYER_INFO</div>
                    <input 
                        placeholder="FULL_LEGAL_NAME (PARTICIPANT)" 
                        className="search-input" 
                        value={formData.participant.name}
                        onChange={(e) => setFormData({...formData, participant: {...formData.participant, name: e.target.value}})}
                        style={{ marginBottom: '10px' }}
                    />
                    <input 
                        placeholder="MCI_NUMBER (10_DIGITS)" 
                        className="search-input" 
                        value={formData.participant.mciId}
                        onChange={(e) => setFormData({...formData, participant: {...formData.participant, mciId: e.target.value}})}
                    />
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" checked={isTransfer} onChange={(e) => setIsTransfer(e.target.checked)} />
                        <label style={{ fontSize: '0.7rem' }}>FEA_TRANSFER_ONLY (Skip Background Check Request)</label>
                    </div>
                </div>
            )}

            {/* STEP 2: WORKER INFO */}
            {step === 2 && (
                <div className="funnel-container">
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '15px' }}>SECTION_II: PARTICIPANT_HIRED_WORKER_INFO</div>
                    <input 
                        placeholder="FULL_LEGAL_NAME (WORKER)" 
                        className="search-input" 
                        value={formData.worker.name}
                        onChange={(e) => setFormData({...formData, worker: {...formData.worker, name: e.target.value}})}
                        style={{ marginBottom: '10px' }}
                    />
                    <input 
                        placeholder="EMAIL_ADDRESS" 
                        className="search-input" 
                        value={formData.worker.email}
                        onChange={(e) => setFormData({...formData, worker: {...formData.worker, email: e.target.value}})}
                        style={{ marginBottom: '10px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            placeholder="DOB (YYYY-MM-DD)" 
                            className="search-input" 
                            style={{ flex: 1 }}
                            value={formData.worker.dob}
                            onChange={(e) => setFormData({...formData, worker: {...formData.worker, dob: e.target.value}})}
                        />
                        <input 
                            placeholder="SSN (XXX-XX-XXXX)" 
                            className="search-input" 
                            style={{ flex: 1 }}
                            value={formData.worker.ssn}
                            onChange={(e) => setFormData({...formData, worker: {...formData.worker, ssn: e.target.value}})}
                        />
                    </div>
                </div>
            )}

            {/* STEP 3: RELATIONSHIP & TAXES */}
            {step === 3 && (
                <div className="funnel-container">
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '15px' }}>SECTION_III: RELATIONSHIP_&_TAX_EXEMPTIONS</div>
                    <select 
                        className="search-input" 
                        value={formData.relationship.type}
                        onChange={(e) => setFormData({...formData, relationship: {type: e.target.value, isRelative: e.target.value !== 'NONE'}})}
                        style={{ marginBottom: '20px' }}
                    >
                        <option value="NONE">NO_FAMILY_RELATIONSHIP</option>
                        <option value="PARENT">PARENT_OF_PARTICIPANT</option>
                        <option value="SPOUSE">SPOUSE_OF_PARTICIPANT</option>
                        <option value="CHILD">CHILD_OF_PARTICIPANT (OVER 21)</option>
                        <option value="OTHER">OTHER_RELATIVE (BROTHER/SISTER/COUSIN)</option>
                    </select>
                    {formData.relationship.isRelative && (
                        <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid var(--accent-terminal)', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-terminal)' }}>✓ TAX_EXEMPTIONS_DETECTED</div>
                            <div style={{ fontSize: '0.55rem', marginTop: '5px' }}>Based on Wisconsin DHS rules, this relationship may be exempt from FICA/FUTA taxes. Forms F-01201A will be auto-generated.</div>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 4: BACKGROUND INFORMATION DISCLOSURE (BID) */}
            {step === 4 && (
                <div className="funnel-container">
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '15px' }}>SECTION_IV: BACKGROUND_DISCLOSURE (F-82064)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem' }}>Have you ever been convicted of a crime?</span>
                            <input type="checkbox" checked={formData.bid.q1} onChange={(e) => setFormData({...formData, bid: {...formData.bid, q1: e.target.checked}})} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem' }}>Do you have any pending criminal charges?</span>
                            <input type="checkbox" checked={formData.bid.q2} onChange={(e) => setFormData({...formData, bid: {...formData.bid, q2: e.target.checked}})} />
                        </div>
                        <textarea 
                            placeholder="Additional comments for disclosure..."
                            className="search-input"
                            style={{ height: '80px', paddingTop: '10px' }}
                            value={formData.bid.comments}
                            onChange={(e) => setFormData({...formData, bid: {...formData.bid, comments: e.target.value}})}
                        />
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button 
                    onClick={() => setStep(step - 1)} 
                    disabled={step === 1}
                    style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '10px 20px', cursor: 'pointer', opacity: step === 1 ? 0.3 : 1 }}
                >BACK</button>
                {step < 4 ? (
                    <button onClick={() => setStep(step + 1)} className="primary">NEXT_STEP</button>
                ) : (
                    <button onClick={handleSubmit} className="primary" style={{ background: 'var(--accent-terminal)', color: '#000' }}>FINALIZE_INTAKE_&_GENERATE_PACKET</button>
                )}
            </div>
        </div>
    );
};

export default IntakeQuestionnaire;
