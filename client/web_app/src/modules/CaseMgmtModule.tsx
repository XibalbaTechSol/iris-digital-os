import React, { useState, useEffect } from 'react';
import BudgetTracker from '../components/BudgetTracker';
import SignatureCanvas from '../components/SignatureCanvas';
import FormComplianceHub from '../components/FormComplianceHub';

interface CaseMgmtModuleProps {
    tenant: 'ICA' | 'FEA';
}

type CaseTab = 'OVERVIEW' | 'PROFILE' | 'WORKERS' | 'NARRATIVE' | 'BUDGET' | 'ISSP' | 'RISK' | 'PRIOR_AUTH' | 'YEARLY_RENEWAL' | 'ASSESSMENTS' | 'DOCUMENTS' | 'FORMS' | 'AI_SCRIBE';

const CaseMgmtModule: React.FC<CaseMgmtModuleProps> = ({ tenant }) => {
    const [activeTab, setActiveTab] = useState<CaseTab>('OVERVIEW');
    const [isGenerating, setIsGenerating] = useState(false);
    const [justification, setJustification] = useState<string | null>(null);
    const [selectedParticipant, setSelectedParticipant] = useState('P-1001');
    const [selectedWorkerForForms, setSelectedWorkerForForms] = useState<string | null>(null);

    // Read configurable settings from localStorage
    const requireDigitalSig = localStorage.getItem('iris_require_sig') !== 'false';
    const budgetAlertThreshold = parseInt(localStorage.getItem('iris_budget_alert') || '15');

    const [participants, setParticipants] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    
    // Fetch Participants
    useEffect(() => {
        fetch('/api/v1/case/participants')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.participants) {
                    setParticipants(data.participants);
                    if (data.participants.length > 0 && !selectedParticipant) {
                        setSelectedParticipant(data.participants[0].id);
                    }
                }
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch Workers
    useEffect(() => {
        if (!selectedParticipant) return;
        fetch(`/api/v1/case/workers/${selectedParticipant}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setWorkers(data.workers);
            })
            .catch(err => console.error(err));
    }, [selectedParticipant]);

    const activeParticipant = participants.find(p => p.id === selectedParticipant) || { id: 'P-XXX', name: 'Loading...', county: '...' };

    const mockNotes = [
        { id: 'N-938', date: '2026-04-10', type: 'MONTHLY_CONTACT', author: 'C. Sterling', content: 'Completed home visit. Participant reports satisfaction with self-directed services.', status: 'SIGNED' },
        { id: 'N-939', date: '2026-04-12', type: 'INCIDENT_REPORT', author: 'C. Sterling', content: 'Worker reported missed shift due to vehicle failure.', status: 'SIGNED' },
    ];

    const [priorAuths, setPriorAuths] = useState<any[]>([]);
    const [renewalData, setRenewalData] = useState<any>(null);
    const [signature, setSignature] = useState<string | null>(null);
    
    // AI Scribe State
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [scribeResult, setScribeResult] = useState<any>(null);
    const [historicalNotes, setHistoricalNotes] = useState<any[]>([]);

    // Phase 21: Assessment State
    const [participantAssessments, setParticipantAssessments] = useState<any[]>([]);
    const [assessmentInterval, setAssessmentInterval] = useState<number>(90);

    // Fetch dynamic data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [paRes, renewalRes, notesRes] = await Promise.all([
                    fetch(`/api/v1/case/pa/${selectedParticipant}`).then(r => r.json()),
                    fetch(`/api/v1/case/renewals/${selectedParticipant}`).then(r => r.json()),
                    fetch(`/api/v1/clinical/scribe/notes/${selectedParticipant}`).then(r => r.json())
                ]);
                setPriorAuths(paRes);
                setRenewalData(renewalRes.renewal);
                if (notesRes.success) setHistoricalNotes(notesRes.notes);

                // Phase 21: Fetch participant assessments
                const asmRes = await fetch(`/api/v1/assessments/${selectedParticipant}`).then(r => r.json());
                if (asmRes.success) {
                    setParticipantAssessments(asmRes.assessments);
                    setAssessmentInterval(asmRes.interval || 90);
                }
            } catch (err) {
                console.error("Failed to fetch clinical data", err);
            }
        };
        fetchData();
    }, [selectedParticipant]);

    const riskFactors = [
        { category: 'Fall Risk', score: 7, max: 10, level: 'HIGH', detail: 'History of 2 falls in past 6 months.' },
        { category: 'Caregiver Network', score: 2, max: 10, level: 'LOW', detail: '3 active workers. Backup plan documented.' },
    ];

    const handleGenerateException = async () => {
        setIsGenerating(true);
        setTimeout(() => {
            setJustification("Participant has high fall risk (score: 7/10) and requires 1:1 supervision during bathing and transfers. Current worker network unable to fulfill required hours without exceeding standard 40-hour limit.");
            setIsGenerating(false);
        }, 1000);
    };

    const Tab: React.FC<{ id: CaseTab; label: string; icon: string }> = ({ id, label, icon }) => (
        <div onClick={() => setActiveTab(id)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: activeTab === id ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === id ? 700 : 500, color: activeTab === id ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }}></i> {label}
        </div>
    );

    return (
        <div className="module-container" style={{ padding: 0 }}>
            {/* HIERARCHY / SELECTOR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#fff', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {activeParticipant.name[0]}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{activeParticipant.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{activeParticipant.id} | {activeParticipant.county}</div>
                    </div>
                </div>
                <select className="search-input" style={{ width: '200px' }} value={selectedParticipant} onChange={e => setSelectedParticipant(e.target.value)}>
                    {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            {/* TABS NATIVE NAVIGATION */}
            <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid var(--border-color)', padding: '0 10px', overflowX: 'auto' }}>
                <Tab id="OVERVIEW" label="Operations" icon="fa-th-large" />
                <Tab id="PROFILE" label="Profile" icon="fa-id-card" />
                <Tab id="WORKERS" label="Workers" icon="fa-people-arrows" />
                <Tab id="NARRATIVE" label="Notes" icon="fa-pen-nib" />
                <Tab id="BUDGET" label="Budget" icon="fa-chart-line" />
                <Tab id="ISSP" label="ISSP" icon="fa-clipboard-list" />
                <Tab id="PRIOR_AUTH" label="Prior Auth" icon="fa-file-medical" />
                <Tab id="YEARLY_RENEWAL" label="Renewals" icon="fa-calendar-check" />
                <Tab id="ASSESSMENTS" label="Assessments" icon="fa-stethoscope" />
                <Tab id="DOCUMENTS" label="Documents" icon="fa-file-shield" />
                <Tab id="RISK" label="Risk" icon="fa-exclamation-triangle" />
                <Tab id="FORMS" label="Forms" icon="fa-file-contract" />
                <Tab id="AI_SCRIBE" label="AI Scribe" icon="fa-wand-magic-sparkles" />
            </div>

            <div style={{ padding: '20px' }}>
                {activeTab === 'OVERVIEW' && (
                    <div className="card-grid">
                        <div className="card">
                            <h3><i className="fas fa-star"></i> IRIS Quality Score</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>4.8</div>
                            <span className="status-badge green">TOP_QUARTILE</span>
                        </div>
                        <div className="card">
                            <h3><i className="fas fa-clock"></i> Next Renewal</h3>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{renewalData?.anniversaryDate || '---'}</div>
                            <span className="status-badge" style={{ background: renewalData?.health === 'CRITICAL' ? 'var(--status-red)' : '#f59e0b', color: '#fff' }}>
                                {renewalData?.daysRemaining || 0} DAYS REMAINING
                            </span>
                        </div>
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <h3><i className="fas fa-bolt"></i> F-01689 Exception Engine</h3>
                            <button onClick={handleGenerateException} className="primary" style={{ marginTop: '10px' }}>GENERATE_MEDICAL_JUSTIFICATION</button>
                            {justification && <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.85rem' }}>{justification}</div>}
                        </div>
                    </div>
                )}

                {/* ===== PRIOR AUTH TAB ===== */}
                {activeTab === 'PRIOR_AUTH' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3><i className="fas fa-file-medical"></i> ForwardHealth Prior Authorizations</h3>
                            <button className="primary" style={{ fontSize: '0.75rem' }}><i className="fas fa-plus"></i> NEW_PA_REQUEST</button>
                        </div>
                        <table className="audit-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>PA_ID</th>
                                    <th>SERVICE_TYPE</th>
                                    <th>SUBMITTED</th>
                                    <th>AMOUNT</th>
                                    <th>TRACKING</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priorAuths.map(pa => (
                                    <tr key={pa.id}>
                                        <td style={{ fontWeight: 700 }}>{pa.id}</td>
                                        <td>{pa.service}</td>
                                        <td>{pa.submitted}</td>
                                        <td>${pa.amount.toFixed(2)}</td>
                                        <td><code>{pa.tracking}</code></td>
                                        <td>
                                            <span className={`status-badge ${pa.status === 'APPROVED' ? 'green' : pa.status === 'DENIED' ? 'red' : ''}`} 
                                                  style={pa.status === 'PENDING_DHS' || pa.status === 'MORE_INFO_REQ' ? { background: '#f59e0b', color: '#fff' } : undefined}>
                                                {pa.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ===== YEARLY RENEWAL TAB ===== */}
                {activeTab === 'YEARLY_RENEWAL' && (
                    <div className="card-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                        <div className="card">
                            <h3><i className="fas fa-calendar-check"></i> Annual Renewal Cycle: {activeParticipant.renewalDate}</h3>
                            <div style={{ marginTop: '20px' }}>
                                {[
                                    { step: '1. LTC Functional Screen (LTCFS)', status: 'COMPLETED', date: '2026-04-05', icon: 'fa-check-circle' },
                                    { step: '2. Individual Service Plan (ISSP) Draft', status: 'IN_PROGRESS', date: '---', icon: 'fa-spinner' },
                                    { step: '3. Risk Agreement (F-01201) Review', status: 'PENDING', date: '---', icon: 'fa-clock' },
                                    { step: '4. DHS Submission & Enrollment Sync', status: 'PENDING', date: '---', icon: 'fa-cloud-upload-alt' },
                                ].map((s, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                                        <i className={`fas ${s.icon}`} style={{ color: s.status === 'COMPLETED' ? 'var(--status-green)' : s.status === 'IN_PROGRESS' ? '#f59e0b' : 'var(--text-muted)' }}></i>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.step}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>STATUS: {s.status} {s.date !== '---' && `| ${s.date}`}</div>
                                        </div>
                                        {s.status === 'IN_PROGRESS' && <button style={{ fontSize: '0.65rem', padding: '5px 10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px' }}>CONTINUE</button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card" style={{ background: 'var(--primary)', color: '#fff' }}>
                            <h3 style={{ color: '#fff' }}><i className="fas fa-history"></i> Renewal History</h3>
                            <div style={{ marginTop: '15px' }}>
                                <div style={{ borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: '15px', position: 'relative' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Plan Year 2025</div>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>COMPLETED 2025-06-12</div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Plan Year 2024</div>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>COMPLETED 2024-06-15</div>
                                    </div>
                                </div>
                                <button style={{ width: '100%', marginTop: '30px', background: '#fff', color: 'var(--primary)', border: 'none', borderRadius: '4px', padding: '10px', fontWeight: 700 }}>DOWNLOAD_PLAN_ARCHIVE</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* (Keep other tabs simplified or same as before) */}
                {activeTab === 'BUDGET' && (
                    <BudgetTracker authorizedAmount={48500} paidAmount={32100} pendingAmount={5400} costShareStatus="PAID" alertThreshold={budgetAlertThreshold} />
                )}
                {activeTab === 'NARRATIVE' && (
                    <div className="card">
                         <div style={{ background: requireDigitalSig ? 'var(--primary-light)' : '#f1f5f9', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.65rem', color: requireDigitalSig ? 'var(--primary)' : 'var(--text-muted)' }}>
                            <i className={`fas ${requireDigitalSig ? 'fa-shield-alt' : 'fa-user-check'}`}></i>
                            {requireDigitalSig ? ' DIGITAL_SIGNATURE_REQUIRED' : ' SESSION_AUTH_MODE'}
                        </div>
                        <textarea className="search-input" rows={4} style={{ width: '100%', marginBottom: '15px' }} placeholder="Enter clinical note..."></textarea>
                        
                        {requireDigitalSig && (
                            <div style={{ marginBottom: '15px' }}>
                                <SignatureCanvas onSave={(blob) => setSignature(blob)} />
                            </div>
                        )}
                        
                        <button className="primary" style={{ width: '100%' }} disabled={requireDigitalSig && !signature}>
                            {requireDigitalSig ? 'SIGN_&_FINALIZE' : 'FINALIZE'}
                        </button>
                    </div>
                )}
                {activeTab === 'PROFILE' && (
                    <div className="card"><h3>Profile Details</h3><p>Manage MCI, demographics, and clinical history for {activeParticipant.name}.</p></div>
                )}
                {activeTab === 'WORKERS' && (
                    <div className="card">
                        <h3>Worker Network</h3>
                        <table className="audit-table" style={{ width: '100%', marginTop: '15px' }}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>NAME</th>
                                    <th>RELATIONSHIP</th>
                                    <th>RATE</th>
                                    <th>WEEKLY_HRS</th>
                                    <th>BG_CHECK</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workers.map(w => (
                                    <tr key={w.id}>
                                        <td style={{ fontWeight: 700 }}>{w.id}</td>
                                        <td>{w.name}</td>
                                        <td>{w.relationship}</td>
                                        <td>${w.rate?.toFixed(2)}</td>
                                        <td>{w.weeklyHrs}h</td>
                                        <td><span className={`status-badge ${w.bgCheck === 'CLEARED' ? 'green' : 'red'}`}>{w.bgCheck}</span></td>
                                        <td><span className={`status-badge ${w.status === 'ACTIVE' ? 'green' : 'red'}`}>{w.status}</span></td>
                                    </tr>
                                ))}
                                {workers.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.5 }}>No active workers assigned.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'ISSP' && (
                    <div className="card"><h3>ISSP Manager</h3><p>Individual Service and Support Plan (Form F-01201A).</p></div>
                )}
                {activeTab === 'RISK' && (
                    <div className="card"><h3>Risk Dashboard</h3><p>Composite risk scoring and mitigation strategies.</p></div>
                )}

                {/* ===== ASSESSMENTS TAB (Phase 21) ===== */}
                {activeTab === 'ASSESSMENTS' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}><i className="fas fa-stethoscope"></i> Assessment History</h3>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span className="status-badge blue">{assessmentInterval}-DAY_CYCLE</span>
                                    <button className="primary" style={{ fontSize: '0.7rem', padding: '6px 12px' }}
                                        onClick={async () => {
                                            await fetch('/api/v1/assessments/schedule', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ participantId: selectedParticipant, nurseId: 'NURSE-R01' })
                                            });
                                            const res = await fetch(`/api/v1/assessments/${selectedParticipant}`).then(r => r.json());
                                            if (res.success) setParticipantAssessments(res.assessments);
                                        }}>
                                        <i className="fas fa-plus"></i> SCHEDULE_ASSESSMENT
                                    </button>
                                </div>
                            </div>
                            {participantAssessments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                    <i className="fas fa-clipboard-check" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                                    <p>No assessments recorded. Click SCHEDULE_ASSESSMENT to begin tracking.</p>
                                </div>
                            ) : (
                                <div>
                                    {participantAssessments.map((a: any) => {
                                        const dueDate = new Date(a.dueDate);
                                        const isOverdue = a.status === 'OVERDUE' || a.daysUntilDue < 0;
                                        const isCompleted = a.status === 'COMPLETED';
                                        return (
                                            <div key={a.id} style={{
                                                display: 'flex', gap: '15px', padding: '15px',
                                                borderBottom: '1px solid var(--border-color)',
                                                alignItems: 'center',
                                                opacity: isCompleted ? 0.6 : 1
                                            }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: isCompleted ? '#dcfce7' : isOverdue ? '#fef2f2' : a.daysUntilDue <= 7 ? '#fffbeb' : '#f0f9ff',
                                                    color: isCompleted ? '#16a34a' : isOverdue ? '#dc2626' : a.daysUntilDue <= 7 ? '#f59e0b' : '#3b82f6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    <i className={`fas ${isCompleted ? 'fa-check' : isOverdue ? 'fa-exclamation' : 'fa-clock'}`}></i>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                                        {a.assessmentType.replace('_', '-')} Assessment
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        {a.id} • Nurse: {a.assignedNurseId} • Due: {dueDate.toLocaleDateString()}
                                                        {isCompleted && a.completedDate && ` • Completed: ${new Date(a.completedDate).toLocaleDateString()}`}
                                                    </div>
                                                </div>
                                                <span className={`status-badge ${isCompleted ? 'green' : isOverdue ? 'red' : ''}`}
                                                      style={!isCompleted && !isOverdue && a.daysUntilDue <= 7 ? { background: '#f59e0b', color: '#fff' } : undefined}>
                                                    {a.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="card" style={{ background: 'var(--primary)', color: '#fff', height: 'fit-content' }}>
                            <h3 style={{ color: '#fff', margin: '0 0 15px' }}><i className="fas fa-info-circle"></i> Assessment Schedule</h3>
                            <div style={{ fontSize: '0.75rem', lineHeight: 1.6, opacity: 0.9 }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <strong>Current Interval:</strong> Every {assessmentInterval} days
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <strong>Risk Level:</strong> {activeParticipant.riskLevel || 'UNKNOWN'}
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <strong>Total Completed:</strong> {participantAssessments.filter((a: any) => a.status === 'COMPLETED').length}
                                </div>
                                <div>
                                    <strong>Next Due:</strong> {participantAssessments.find((a: any) => a.status !== 'COMPLETED')?.dueDate
                                        ? new Date(participantAssessments.find((a: any) => a.status !== 'COMPLETED').dueDate).toLocaleDateString()
                                        : 'Not scheduled'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FORMS' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="card">
                            <h3>Participant Forms</h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '20px' }}>Mandatory enrollment and program maintenance forms for {activeParticipant.name}.</p>
                            <FormComplianceHub entityId={activeParticipant.id} entityType="PARTICIPANT" />
                        </div>
                        
                        <div className="card">
                            <h3>Worker Compliance Packets</h3>
                            <div style={{ marginBottom: '20px' }}>
                                <select 
                                    className="search-input" 
                                    value={selectedWorkerForForms || ''} 
                                    onChange={(e) => setSelectedWorkerForForms(e.target.value)}
                                >
                                    <option value="">-- Select Worker --</option>
                                    {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.relationship})</option>)}
                                </select>
                            </div>
                            
                            {selectedWorkerForForms ? (
                                <FormComplianceHub entityId={selectedWorkerForForms} entityType="WORKER" />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                                    <i className="fas fa-user-shield" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                                    <p>Select a worker to view their enrollment and tax forms.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'DOCUMENTS' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3><i className="fas fa-file-shield"></i> Participant Clinical Documents</h3>
                            <button className="secondary" style={{ fontSize: '0.75rem' }}><i className="fas fa-upload"></i> UPLOAD_DOCUMENT</button>
                        </div>
                        <table className="audit-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>FORM_CODE</th>
                                    <th>DESCRIPTION</th>
                                    <th>LAST_VERIFIED</th>
                                    <th>AUDIT_SCORE</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { code: 'F-00075', desc: 'IRIS Referral Form', date: '2026-04-10', score: 98, status: 'VERIFIED' },
                                    { code: 'F-01293', desc: 'IRIS Choice Form', date: '---', score: 40, status: 'SIGNATURE_MISSING' },
                                    { code: 'F-01309', desc: 'Participant Rights', date: '2026-04-11', score: 100, status: 'VERIFIED' },
                                    { code: 'F-01201A', desc: 'ISSP Plan Copy', date: '2025-06-15', score: 70, status: 'STALE_365_DAY' },
                                ].map(doc => (
                                    <tr key={doc.code}>
                                        <td style={{ fontWeight: 700 }}>{doc.code}</td>
                                        <td>{doc.desc}</td>
                                        <td>{doc.date}</td>
                                        <td style={{ color: doc.score > 80 ? 'var(--status-green)' : doc.score > 60 ? '#f59e0b' : 'var(--status-red)', fontWeight: 700 }}>{doc.score}%</td>
                                        <td>
                                            <span className={`status-badge ${doc.status === 'VERIFIED' ? 'green' : doc.status === 'SIGNATURE_MISSING' ? 'red' : ''}`} 
                                                  style={doc.status === 'STALE_365_DAY' ? { background: '#f59e0b', color: '#fff' } : undefined}>
                                                {doc.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="primary" style={{ width: '100%', marginTop: '30px' }}><i className="fas fa-file-zipper"></i> GENERATE_ENCRYPTED_CLINICAL_PACKET</button>
                    </div>
                )}

                {/* ===== AI SCRIBE TAB ===== */}
                {activeTab === 'AI_SCRIBE' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                        <div className="card" style={{ height: 'fit-content' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3><i className="fas fa-microphone-lines"></i> Clinical AI Scribe</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <span className="status-badge blue">HIPAA_SECURE_LLM</span>
                                    <span className="status-badge" style={{ background: '#f8fafc', color: 'var(--text-muted)' }}>MOCK_TRANSCRIPTION</span>
                                </div>
                            </div>

                            <div style={{ background: '#000', borderRadius: '12px', padding: '30px', position: 'relative', overflow: 'hidden', marginBottom: '20px' }}>
                                {isRecording && (
                                    <div className="pulse-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                        <div className="pulse-circle" style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }}></div>
                                    </div>
                                )}
                                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '10px' }}>{isRecording ? 'STREAMING_SESSION_TRANSCRIPT...' : 'READY_FOR_CLINICAL_CAPTURE'}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', minHeight: '80px' }}>
                                        {transcript || 'Press Start to begin AI-assisted documentation...'}
                                    </div>
                                    {!isRecording ? (
                                        <button className="primary" onClick={() => {
                                            setIsRecording(true);
                                            setTranscript('');
                                            setScribeResult(null);
                                            // Mock streaming transcript
                                            const text = "Spoke with Alice today. She mentioned she fell last Tuesday in the bathroom but didn't go to the hospital. She's also confused about her new medication schedule. We need to schedule a follow-up and review her ISSP budget.";
                                            let i = 0;
                                            const interval = setInterval(() => {
                                                setTranscript(prev => prev + text[i]);
                                                i++;
                                                if (i >= text.length) {
                                                    clearInterval(interval);
                                                    setIsRecording(false);
                                                    // Auto-process
                                                    fetch('/api/v1/clinical/scribe/process', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ transcript: text })
                                                    }).then(r => r.json()).then(data => setScribeResult(data.proposal));
                                                }
                                            }, 40);
                                        }}>
                                            <i className="fas fa-play"></i> START_CLINICAL_RECORDING
                                        </button>
                                    ) : (
                                        <button className="primary" style={{ background: 'var(--status-red)' }} onClick={() => setIsRecording(false)}>
                                            <i className="fas fa-stop"></i> TERMINATE_&_PROCESS
                                        </button>
                                    )}
                                </div>
                            </div>

                            {scribeResult && (
                                <div className="scribe-result" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', animation: 'fadeIn 0.5s ease-out' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <h4 style={{ margin: 0 }}>AI-Generated Note Proposal</h4>
                                        <span className={`status-badge ${scribeResult.riskAssessment.includes('HIGH') ? 'red' : 'blue'}`}>{scribeResult.riskAssessment}</span>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', marginBottom: '5px' }}>STRUCTURED_SUMMARY</div>
                                        <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>{scribeResult.summary}</div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', marginBottom: '10px' }}>EXTRACTED_ACTION_ITEMS</div>
                                        {scribeResult.actionItems.map((item: string, idx: number) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '6px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                <i className="fas fa-circle-check"></i> {item}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="primary" style={{ width: '100%' }} onClick={async () => {
                                        await fetch('/api/v1/clinical/scribe/save', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                participantId: selectedParticipant,
                                                authorId: 'CASE-MANAGER-01',
                                                content: transcript,
                                                ...scribeResult
                                            })
                                        });
                                        setScribeResult(null);
                                        setTranscript('');
                                        // Refresh notes
                                        fetch(`/api/v1/clinical/scribe/notes/${selectedParticipant}`)
                                            .then(r => r.json()).then(data => setHistoricalNotes(data.notes));
                                    }}>
                                        <i className="fas fa-save"></i> FINALIZE_TO_PERMANENT_RECORD
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <h3><i className="fas fa-history"></i> Clinical Note History</h3>
                            <div style={{ marginTop: '20px' }}>
                                {historicalNotes.map(note => (
                                    <div key={note.id} style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{note.id}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#888' }}>{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '2px' }}>{note.summary.substring(0, 100)}...</div>
                                        <div className="status-badge" style={{ fontSize: '0.6rem' }}>{note.risk_assessment}</div>
                                    </div>
                                ))}
                                {historicalNotes.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>No AI-generated notes found.</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaseMgmtModule;
