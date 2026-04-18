import React, { useState } from 'react';
import EventBus from '../utils/EventBus';
import EVVLocationMap from '../components/EVVLocationMap';

interface EVVEvent {
    id: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'MANUAL_ENTRY';
    timestamp: string;
    status: 'SYNCED' | 'PENDING' | 'FAILED';
    lat?: number;
    lng?: number;
    reasonCode?: string;
}

const PAYERS = [
    { id: 'PRO-771', name: 'Premier Financial Management Services' },
    { id: 'GTF-102', name: 'GT Independence' },
    { id: 'ILF-441', name: 'iLIFE IRIS FEA' }
];

const REASON_CODES = [
    { code: '01', label: 'Missing Clock-In' },
    { code: '02', label: 'Missing Clock-Out' },
    { code: '03', label: 'Device Failure' },
    { code: '04', label: 'Participant Choice' }
];

const EVVModule: React.FC = () => {
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [selectedPayer, setSelectedPayer] = useState(PAYERS[0].id);
    const [syncQueue, setSyncQueue] = useState<EVVEvent[]>([]);
    const [showManual, setShowManual] = useState(false);
    const [manualReason, setManualReason] = useState(REASON_CODES[0].code);
    const [preCheckStatus, setPreCheckStatus] = useState<{ ok: boolean; errors: string[] } | null>(null);
    const [gpsSimMode, setGpsSimMode] = useState<'HOME' | 'AWAY'>('HOME');
    const [distanceFromHome, setDistanceFromHome] = useState<number | null>(null);

    const HOME_COORDS = { lat: 43.0731, lng: -89.4012 }; // Fixed mock residence

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const p1 = lat1 * Math.PI / 180;
        const p2 = lat2 * Math.PI / 180;
        const dp = (lat2 - lat1) * Math.PI / 180;
        const dl = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleClockAction = async (isManual = false) => {
        const type = isManual ? 'MANUAL_ENTRY' : (isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN');
        const timestamp = new Date().toISOString();
        
        // Mock GPS Data based on Simulator Mode
        const lat = gpsSimMode === 'HOME' ? HOME_COORDS.lat : 43.1500;
        const lng = gpsSimMode === 'HOME' ? HOME_COORDS.lng : -89.5000;

        const dist = calculateDistance(lat, lng, HOME_COORDS.lat, HOME_COORDS.lng);
        setDistanceFromHome(dist);

        const newEvent: EVVEvent = {
            id: `EVV_${Date.now()}`,
            type,
            timestamp,
            status: 'PENDING',
            lat,
            lng,
            reasonCode: isManual ? manualReason : undefined
        };

        setSyncQueue(prev => [newEvent, ...prev]);

        if (type === 'CLOCK_OUT' || type === 'MANUAL_ENTRY' || type === 'CLOCK_IN') {
            try {
                const res = await fetch('/api/v1/evv/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        visit: { 
                            workerId: 'WORKER-123',
                            type,
                            timestamp,
                            location: { lat, lng },
                            manualReason: isManual ? manualReason : null
                        } 
                    })
                });
                const data = await res.json();
                
                if (data.success) {
                    setSyncQueue(prev => prev.map(ev => ev.id === newEvent.id ? { ...ev, status: 'SYNCED' } : ev));
                    EventBus.publish('SHIFT_VERIFIED', { id: newEvent.id, location: { lat, lng } });
                }
            } catch (e) {
                console.error('EVV_SYNC_NETWORK_FAILURE');
            }
        }

        if (type === 'CLOCK_IN') {
            setIsClockedIn(true);
        } else {
            setIsClockedIn(false);
            setShowManual(false);
        }
    };

    return (
        <div className="module-container" style={{ padding: 0 }}>
            <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* 1. COMMAND CENTER */}
                <div className="card" style={{ borderTop: `4px solid ${isClockedIn ? 'var(--status-green)' : 'var(--primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}><i className="fas fa-satellite"></i> EVV Command Center</h3>
                        <span className="status-badge">SANDATA_V2.5_CONNECT</span>
                    </div>

                    <div style={{ background: 'var(--primary-light)', padding: '30px', borderRadius: '8px', textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px' }}>
                            {isClockedIn ? 'ACTIVE_SHIFT_TIMER' : 'SYSTEM_READY'}
                        </div>
                        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-1px' }}>
                            {isClockedIn ? '04:22:15' : '00:00:00'}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>PAYER / FEA_ENTITY</label>
                        <select 
                            value={selectedPayer} 
                            onChange={(e) => setSelectedPayer(e.target.value)}
                            disabled={isClockedIn}
                            className="search-input"
                            style={{ marginTop: '5px' }}
                        >
                            {PAYERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {!showManual ? (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="primary" onClick={() => handleClockAction(false)} style={{ flex: 1, height: '48px', background: isClockedIn ? 'var(--status-red)' : 'var(--status-green)' }}>
                                {isClockedIn ? 'STOP & VERIFY LOCATION' : 'START CLOCK-IN'}
                            </button>
                            {!isClockedIn && <button onClick={() => setShowManual(true)} style={{ background: '#fff', border: '1px solid var(--border-color)', width: '100px' }}>MANUAL</button>}
                        </div>
                    ) : (
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>REASON_FOR_MANUAL_ENTRY</label>
                            <select value={manualReason} onChange={(e) => setManualReason(e.target.value)} className="search-input" style={{ marginTop: '5px' }}>
                                {REASON_CODES.map(rc => <option key={rc.code} value={rc.code}>{rc.label}</option>)}
                            </select>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button className="primary" onClick={() => handleClockAction(true)} style={{ flex: 1 }}>SUBMIT_MANUAL</button>
                                <button onClick={() => setShowManual(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)' }}>CANCEL</button>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>GPS_SIMULATOR</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                    onClick={() => setGpsSimMode('HOME')}
                                    style={{ padding: '4px 8px', fontSize: '0.6rem', borderRadius: '4px', background: gpsSimMode === 'HOME' ? 'var(--status-green)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                >
                                    AT_HOME
                                </button>
                                <button 
                                    onClick={() => setGpsSimMode('AWAY')}
                                    style={{ padding: '4px 8px', fontSize: '0.6rem', borderRadius: '4px', background: gpsSimMode === 'AWAY' ? 'var(--status-red)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}
                                >
                                    AWAY
                                </button>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            Current simulation: {gpsSimMode === 'HOME' ? 'Within 10 meters of residence.' : '8.5 kilometers from residence.'}
                        </div>
                    </div>
                </div>

                {/* 2. GPS TELEMETRY HUB */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}><i className="fas fa-map-marked-alt"></i> GPS Telemetry</h3>
                        {syncQueue.length > 0 && <span className="status-badge green">✓ ACTIVE_TRACKING</span>}
                    </div>

                    <EVVLocationMap 
                        lat={syncQueue[0]?.lat || HOME_COORDS.lat} 
                        lng={syncQueue[0]?.lng || HOME_COORDS.lng} 
                        accuracy={15} 
                        insideGeofence={distanceFromHome !== null ? distanceFromHome <= 500 : true} 
                    />

                    {distanceFromHome !== null && (
                        <div style={{ marginTop: '15px', padding: '10px', background: distanceFromHome <= 500 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', borderRadius: '6px', fontSize: '0.75rem', textAlign: 'center' }}>
                            <i className={`fas fa-${distanceFromHome <= 500 ? 'check-circle' : 'exclamation-triangle'}`} style={{ marginRight: '8px' }}></i>
                            Distance from Home: <strong>{Math.round(distanceFromHome)} meters</strong>
                            {distanceFromHome > 500 && <div style={{ color: 'var(--status-red)', fontWeight: 700, marginTop: '2px' }}>OUT_OF_FENCE_VIOLATION</div>}
                        </div>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}>
                            HISTORICAL_TELEMETRY_LOG
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {syncQueue.map(ev => (
                                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '4px', marginBottom: '8px', fontSize: '0.75rem' }}>
                                    <div>
                                        <strong>{ev.type}</strong>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: ev.status === 'SYNCED' ? 'var(--status-green)' : '#f59e0b', fontWeight: 700 }}>{ev.status}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>GPS: {ev.lat?.toFixed(3)}, {ev.lng?.toFixed(3)}</div>
                                    </div>
                                </div>
                            ))}
                            {syncQueue.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    No telemetry data recorded for current session.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EVVModule;
