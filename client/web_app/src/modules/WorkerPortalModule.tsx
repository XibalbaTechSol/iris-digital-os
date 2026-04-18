import React, { useState, useEffect } from 'react';
import EventBus from '../utils/EventBus';

const WorkerPortalModule: React.FC = () => {
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockTimer, setClockTimer] = useState('00:00:00');
    const [netPayEstimate, setNetPayEstimate] = useState(142.50);

    // Simulated Clock Logic
    useEffect(() => {
        let interval: any;
        if (isClockedIn) {
            let seconds = 0;
            interval = setInterval(() => {
                seconds++;
                const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
                const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
                const s = (seconds % 60).toString().padStart(2, '0');
                setClockTimer(`${h}:${m}:${s}`);
                // Update net pay every minute (mock)
                if (seconds % 60 === 0) setNetPayEstimate(prev => prev + 0.45);
            }, 1000);
        } else {
            setClockTimer('00:00:00');
        }
        return () => clearInterval(interval);
    }, [isClockedIn]);

    const handleClockToggle = () => {
        const action = isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN';
        setIsClockedIn(!isClockedIn);
        
        EventBus.publish('EVV_EVENT', {
            action,
            workerId: 'WORKER-123',
            geo: { lat: 43.0389, lng: -87.9065 }, // Milwaukee GPS
            timestamp: new Date().toISOString()
        });
    };

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', background: '#000', minHeight: '100vh', padding: '20px', fontFamily: 'Space Mono' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--accent-terminal)', letterSpacing: '2px' }}>IRIS_OS // WORKER_PORTAL</div>
                <h2 style={{ color: '#FFF', fontSize: '1.2rem', marginTop: '10px' }}>Hi, Marcus 👋</h2>
            </div>

            {/* CLOCK CONTROL */}
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', border: isClockedIn ? '1px solid var(--accent-terminal)' : '1px solid #333' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: isClockedIn ? 'var(--accent-terminal)' : '#444' }}>
                    {clockTimer}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '10px' }}>
                    {isClockedIn ? 'SHIFT_ACTIVE (GPS_VERIFIED)' : 'READY_TO_START_SHIFT'}
                </div>
                
                <button 
                    onClick={handleClockToggle}
                    style={{ 
                        marginTop: '30px', 
                        width: '100%', 
                        padding: '20px', 
                        borderRadius: '50px', 
                        border: 'none', 
                        background: isClockedIn ? 'var(--accent-action)' : 'var(--accent-terminal)',
                        color: isClockedIn ? '#FFF' : '#000',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                    }}
                >
                    {isClockedIn ? 'STOP_SHIFT' : 'START_SHIFT'}
                </button>
            </div>

            {/* EARNINGS HUD */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                <div className="card" style={{ padding: '15px' }}>
                    <div style={{ fontSize: '0.6rem', color: '#888' }}>GROSS_EARNED</div>
                    <div style={{ fontSize: '1rem', color: '#FFF', marginTop: '5px' }}>$1,240.20</div>
                </div>
                <div className="card" style={{ padding: '15px', borderLeft: '3px solid var(--accent-terminal)' }}>
                    <div style={{ fontSize: '0.6rem', color: '#888' }}>EST_NET_PAY</div>
                    <div style={{ fontSize: '1rem', color: 'var(--accent-terminal)', marginTop: '5px' }}>${netPayEstimate.toFixed(2)}</div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div style={{ marginTop: '30px' }}>
                <button className="primary" style={{ width: '100%', background: 'transparent', border: '1px solid #333', color: '#888', marginBottom: '10px', fontSize: '0.75rem' }}>
                    <i className="fas fa-bolt"></i> CASHOUT_NOW (WAGES_NOW)
                </button>
                <button className="primary" style={{ width: '100%', background: 'transparent', border: '1px solid #333', color: '#888', fontSize: '0.75rem' }}>
                    <i className="fas fa-list-check"></i> VIEW_ADL_TASKS
                </button>
            </div>

            {/* GPS STATUS */}
            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.55rem', color: '#444' }}>
                <i className="fas fa-location-dot"></i> 43.0389 N, 87.9065 W // MILWAUKEE_CENTRAL
            </div>
        </div>
    );
};

export default WorkerPortalModule;
