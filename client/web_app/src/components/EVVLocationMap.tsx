import React from 'react';

/**
 * IRIS OS - EVV Location Map (High-Fidelity Mock)
 * Goal: Visualize visit coordinates and geofence compliance.
 */
const EVVLocationMap: React.FC<{ lat: number, lng: number, accuracy: number, insideGeofence: boolean }> = ({ lat, lng, accuracy, insideGeofence }) => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '220px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
            {/* 1. MOCK MAP TILES (SVG-BASED) */}
            <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.8 }}>
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Mock Neighborhood Roads */}
                <path d="M0 50 L400 50 M100 0 L100 220 M300 0 L300 220" stroke="#fff" strokeWidth="4" opacity="0.6" />
                
                {/* Participant Home Geofence (The Target) */}
                <circle cx="200" cy="110" r="50" fill="rgba(1, 87, 155, 0.1)" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4" />
                <text x="210" y="105" fontSize="10" fill="var(--primary)" fontWeight="bold">HOME_RANGE</text>

                {/* The Visit Check-in Point (The Pin) */}
                <circle cx="190" cy="115" r="6" fill={insideGeofence ? 'var(--status-green)' : 'var(--status-red)'} />
                <circle cx="190" cy="115" r="15" fill="none" stroke={insideGeofence ? 'var(--status-green)' : 'var(--status-red)'} strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" from="6" to="15" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
            </svg>

            {/* 2. OVERLAY DATA */}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.65rem' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>LOCATION_TELEMETRY</div>
                <div style={{ opacity: 0.7 }}>LAT: {lat.toFixed(4)} / LNG: {lng.toFixed(4)}</div>
                <div style={{ opacity: 0.7 }}>ACCURACY: {accuracy}m / HDOP: 1.2</div>
                <div style={{ marginTop: '5px', fontWeight: 'bold', color: insideGeofence ? 'var(--status-green)' : 'var(--status-red)' }}>
                    {insideGeofence ? '✓ GEOFENCE_VERIFIED' : '⚠ GEOFENCE_BREACH'}
                </div>
            </div>

            {/* 3. SATELLITE HUD MOCK */}
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                <span className="status-badge" style={{ fontSize: '0.55rem', padding: '2px 8px', background: '#334155', color: '#fff' }}>SATELLITE_FIX: 8</span>
                <span className="status-badge" style={{ fontSize: '0.55rem', padding: '2px 8px', background: '#334155', color: '#fff' }}>4G_LTE</span>
            </div>
        </div>
    );
};

export default EVVLocationMap;
