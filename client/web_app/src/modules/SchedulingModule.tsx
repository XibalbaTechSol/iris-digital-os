import React, { useState } from 'react';

type ViewMode = 'WEEK' | 'MONTH' | 'AGENDA';

const SchedulingModule: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

    return (
        <div className="card-grid" style={{ gridTemplateColumns: '3fr 1fr' }}>
            <div className="card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3><i className="fas fa-calendar-check"></i> Master Schedule // Wisconsin Region</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* View Toggles */}
                        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px', marginRight: '15px' }}>
                            <button 
                                onClick={() => setViewMode('WEEK')}
                                style={{ margin: 0, padding: '4px 12px', fontSize: '0.7rem', background: viewMode === 'WEEK' ? '#fff' : 'transparent', border: 'none', borderRadius: '4px', color: viewMode === 'WEEK' ? '#000' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
                            >
                                WEEK
                            </button>
                            <button 
                                onClick={() => setViewMode('MONTH')}
                                style={{ margin: 0, padding: '4px 12px', fontSize: '0.7rem', background: viewMode === 'MONTH' ? '#fff' : 'transparent', border: 'none', borderRadius: '4px', color: viewMode === 'MONTH' ? '#000' : '#64748b', fontWeight: 600, cursor: 'pointer' }}
                            >
                                MONTH
                            </button>
                        </div>
                        <button className="primary" style={{ margin: 0, fontSize: '0.7rem' }}>PUBLISH_SCHEDULE</button>
                        <button className="primary" style={{ margin: 0, fontSize: '0.7rem', background: 'transparent', border: '1px solid #333', color: '#111' }}>OPTIMIZE_AI</button>
                    </div>
                </div>

                {viewMode === 'WEEK' ? (
                    <div className="scheduling-grid">
                        <div className="sch-cell sch-header">TIME</div>
                        {days.map(d => <div key={d} className="sch-cell sch-header">{d}</div>)}

                        {timeSlots.map(time => (
                            <React.Fragment key={time}>
                                <div className="sch-cell sch-header" style={{ background: '#080808', color: '#fff' }}>{time}</div>
                                {days.map(day => (
                                    <div key={`${day}-${time}`} className="sch-cell">
                                        {day === 'MON' && time === '08:00' && (
                                            <div className="shift-card" style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '8px', borderRadius: '4px' }}>
                                                <strong>MARIA J.</strong><br/>
                                                <span style={{ fontSize: '0.6rem', color: '#166534' }}>SARAH M.</span>
                                            </div>
                                        )}
                                        {day === 'WED' && time === '12:00' && (
                                            <div className="shift-card alert" style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '8px', borderRadius: '4px' }}>
                                                <strong style={{ color: '#991b1b' }}>UNASSIGNED</strong><br/>
                                                <span style={{ fontSize: '0.6rem', color: '#b91c1c' }}>T1019 // RESHAPE</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e2e8f0', border: '1px solid #e2e8f0' }}>
                        {days.map(d => <div key={d} style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>{d}</div>)}
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} style={{ background: '#fff', minHeight: '100px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{i + 1}</span>
                                {i === 14 && <div style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.65rem', padding: '4px', borderRadius: '4px', fontWeight: 'bold' }}>2 OPEN SHIFTS</div>}
                                {i === 19 && <div style={{ background: '#dcfce7', color: '#166534', fontSize: '0.65rem', padding: '4px', borderRadius: '4px', fontWeight: 'bold' }}>ANNUAL RENEWAL: BOB S.</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <h3><i className="fas fa-magic"></i> Smart-Match Sidebar</h3>
                <p style={{ color: '#888', fontSize: '0.65rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    CAREGIVER_RANKING // RADIUS: 15 MILES
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ padding: '15px', background: '#f8fafc', borderLeft: '3px solid var(--accent-action)', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SARAH M.</span>
                            <span style={{ color: 'var(--accent-action)', fontWeight: 'bold' }}>98%</span>
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#555' }}>2.1 MILES // SKILLS_MATCH</div>
                    </div>
                    
                    <div style={{ padding: '15px', background: '#f8fafc', borderLeft: '3px solid #cbd5e1', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>DAWN R.</span>
                            <span style={{ color: '#888' }}>84%</span>
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#555' }}>5.4 MILES // NO_EVV_CERT</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3><i className="fas fa-satellite-dish"></i> Vacancy Broadcast</h3>
                <p style={{ color: '#888', fontSize: '0.65rem', marginBottom: '20px', fontFamily: 'Space Mono' }}>
                    PUSH_TO_CAREGIVER_MOBILE
                </p>
                <div className="value">2</div>
                <p style={{ color: '#b91c1c', fontSize: '0.7rem', fontWeight: 'bold' }}>OPEN_SHIFTS_PENDING</p>
                <button className="primary" style={{ fontSize: '0.7rem', width: '100%' }}>BROADCAST_ALL</button>
            </div>
        </div>
    );
};

export default SchedulingModule;
