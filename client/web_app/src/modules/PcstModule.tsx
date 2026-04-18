import React, { useState, useEffect } from 'react';
import FormViewerModal from '../components/FormViewerModal';

const PcstModule: React.FC = () => {
    const [participants, setParticipants] = useState<any[]>([]);
    const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [isSigning, setIsSigning] = useState(false);
    const [pendingSignId, setPendingSignId] = useState<string | null>(null);

    // Form state
    const [bathing, setBathing] = useState(0);
    const [dressing, setDressing] = useState(0);
    const [mobility, setMobility] = useState(0);

    const calculateUnits = () => {
        const score = (bathing * 10) + (dressing * 10) + (mobility * 10);
        return score;
    };

    useEffect(() => {
        fetch('/api/v1/case/participants')
            .then(res => res.json())
            .then(data => setParticipants(Array.isArray(data.participants) ? data.participants : []))
            .catch(err => console.error('Failed to fetch caseload', err));
    }, []);

    useEffect(() => {
        if (selectedParticipant) {
            fetch(`/api/v1/pcst/records/${selectedParticipant}`)
                .then(res => res.json())
                .then(data => setRecords(Array.isArray(data) ? data : []));
        } else {
            setRecords([]);
        }
    }, [selectedParticipant]);

    const handleCreateDraft = async () => {
        if (!selectedParticipant) return;
        
        try {
            const sessionRes = await fetch('/api/v1/auth/session', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
            const sessionData = await sessionRes.json();
            
            const res = await fetch('/api/v1/pcst/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: selectedParticipant,
                    nurseId: sessionData.session?.userId || 'unknown',
                    adlData: { bathing, dressing, mobility },
                    allocatedUnits: calculateUnits()
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setPendingSignId(data.data.id);
                setIsSigning(true);
            }
        } catch (e) {
            console.error('Failed to create draft', e);
        }
    };

    const handleSignatureSuccess = () => {
        setIsSigning(false);
        setPendingSignId(null);
        // Refresh records
        if (selectedParticipant) {
            fetch(`/api/v1/pcst/records/${selectedParticipant}`)
                .then(res => res.json())
                .then(data => setRecords(Array.isArray(data) ? data : []));
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--primary)' }}>PCST Compliance Hub</h1>
                <span style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.9rem', fontWeight: 600 }}>
                    State Portal Integration (RPA)
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
                {/* Left Col - Roster */}
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Participant Roster</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {participants.map(p => (
                            <li 
                                key={p.id} 
                                onClick={() => setSelectedParticipant(p.id)}
                                style={{ 
                                    padding: '12px 15px', 
                                    borderBottom: '1px solid #eee', 
                                    cursor: 'pointer',
                                    background: selectedParticipant === p.id ? 'var(--blue-light)' : 'transparent',
                                    fontWeight: selectedParticipant === p.id ? 600 : 400
                                }}
                            >
                                {p.name} <span style={{ color: '#888', fontSize: '0.8rem' }}>({p.id})</span>
                            </li>
                        ))}
                        {participants.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>No participants found.</p>}
                    </ul>
                </div>

                {/* Right Col - PCST Tool */}
                <div className="card">
                    {!selectedParticipant ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Select a participant from the roster to manage PCST screenings.</div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ marginTop: 0 }}>Screening Tool (PCST)</h3>
                                <div style={{ textAlign: 'right', background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 700 }}>PROJECTED_UNITS</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{calculateUnits()}</div>
                                </div>
                            </div>
                            
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', marginTop: '10px' }}>
                                <h4 style={{ margin: '0 0 15px 0' }}>ADL Dependencies</h4>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px' }}>Bathing Dependency (0-2)</label>
                                    <input type="range" min="0" max="2" value={bathing} onChange={e => setBathing(Number(e.target.value))} style={{ width: '100%' }} />
                                    <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{bathing}</div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px' }}>Dressing Dependency (0-2)</label>
                                    <input type="range" min="0" max="2" value={dressing} onChange={e => setDressing(Number(e.target.value))} style={{ width: '100%' }} />
                                    <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{dressing}</div>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px' }}>Mobility Constraints (0-3)</label>
                                    <input type="range" min="0" max="3" value={mobility} onChange={e => setMobility(Number(e.target.value))} style={{ width: '100%' }} />
                                    <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{mobility}</div>
                                </div>

                                <button 
                                    onClick={handleCreateDraft}
                                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                                >
                                    Review & Sign Electronically
                                </button>
                            </div>

                            <h3 style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>Previous Submissions</h3>
                            {records.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.9rem' }}>No PCST records found.</p>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Allocated Units</th>
                                            <th>ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map(r => (
                                            <tr key={r.id}>
                                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span style={{ 
                                                        background: r.status === 'SUBMITTED' ? '#dcfce7' : (r.status === 'FAILED' ? '#fee2e2' : '#fef9c3'),
                                                        color: r.status === 'SUBMITTED' ? '#166534' : (r.status === 'FAILED' ? '#991b1b' : '#854d0e'),
                                                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600
                                                    }}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{r.allocated_units || '-'}</td>
                                                <td style={{ color: '#888', fontSize: '0.8rem' }}>{r.id.substring(0, 10)}...</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isSigning && pendingSignId && (
                <FormViewerModal 
                    form={{ id: pendingSignId, form_code: 'PCST-Assessment' }}
                    entityId={selectedParticipant!}
                    onClose={() => setIsSigning(false)}
                    onSuccess={handleSignatureSuccess}
                />
            )}
        </div>
    );
};

export default PcstModule;
