import React, { useState } from 'react';

/**
 * IRIS OS - Global Settings Module
 * Goal: Manage system-level preferences (Fonts, Security, Branding, Clinical Config).
 */
const SettingsModule: React.FC = () => {
    const [fontPref, setFontPref] = useState(localStorage.getItem('iris_font') || 'inter');
    const [themePref, setThemePref] = useState(localStorage.getItem('iris_theme') || 'clinical');
    const [auditVerbosity, setAuditVerbosity] = useState(localStorage.getItem('iris_audit_verbosity') || 'NORMAL');
    const [requireDigitalSig, setRequireDigitalSig] = useState(localStorage.getItem('iris_require_sig') !== 'false');
    const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(parseInt(localStorage.getItem('iris_budget_alert') || '15'));
    const [analyticsSync, setAnalyticsSync] = useState(localStorage.getItem('iris_analytics_sync') === 'true');

    const handleFontChange = (font: string) => {
        setFontPref(font);
        localStorage.setItem('iris_font', font);
        window.dispatchEvent(new Event('theme-font-changed'));
    };

    const handleThemeChange = (theme: string) => {
        setThemePref(theme);
        localStorage.setItem('iris_theme', theme);
        window.dispatchEvent(new Event('theme-changed'));
    };

    const handleSigToggle = (val: boolean) => {
        setRequireDigitalSig(val);
        localStorage.setItem('iris_require_sig', val.toString());
    };

    const handleThresholdChange = (val: number) => {
        setBudgetAlertThreshold(val);
        localStorage.setItem('iris_budget_alert', val.toString());
    };

    return (
        <div className="module-container" style={{ padding: 0 }}>
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {/* 1. VISUAL EXPERIENCE & THEMES */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}><i className="fas fa-palette"></i> Interface Branding & Themes</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                            Customize the visual profile of the command center.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div 
                            onClick={() => handleThemeChange('clinical')}
                            style={{ 
                                padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer',
                                background: themePref === 'clinical' ? '#e0f2fe' : '#fff',
                                borderColor: themePref === 'clinical' ? '#01579b' : 'var(--border-color)',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', background: '#01579b', borderRadius: '50%', margin: '0 auto 10px' }}></div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>CLINICAL_LIGHT</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '5px' }}>Standard HIPAA/Medical UI.</div>
                        </div>

                        <div 
                            onClick={() => handleThemeChange('midnight')}
                            style={{ 
                                padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer',
                                background: themePref === 'midnight' ? '#1e293b' : '#0f172a',
                                borderColor: themePref === 'midnight' ? '#10b981' : 'var(--border-color)',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', background: '#10b981', borderRadius: '50%', margin: '0 auto 10px' }}></div>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>MIDNIGHT_TERMINAL</div>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '5px' }}>High-density dark mode.</div>
                        </div>

                        <div 
                            onClick={() => handleThemeChange('iris')}
                            style={{ 
                                padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer',
                                background: themePref === 'iris' ? '#eef2ff' : '#fff',
                                borderColor: themePref === 'iris' ? '#4f46e5' : 'var(--border-color)',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', background: '#4f46e5', borderRadius: '50%', margin: '0 auto 10px' }}></div>
                            <div style={{ fontWeight: 700, color: '#1e1b4b' }}>DEEP_IRIS</div>
                            <div style={{ fontSize: '0.6rem', color: '#4338ca', marginTop: '5px' }}>Official program branding.</div>
                        </div>
                    </div>
                </div>

                {/* 2. BRANDING & TYPOGRAPHY */}
                <div className="card">
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}><i className="fas fa-font"></i> Typography Suite</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                            Configure the authoritative typeface for clinical documentation.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div 
                            onClick={() => handleFontChange('inter')}
                            style={{ 
                                padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                                background: fontPref === 'inter' ? 'var(--primary-light)' : '#fff',
                                borderColor: fontPref === 'inter' ? 'var(--primary)' : 'var(--border-color)'
                            }}
                        >
                            <div style={{ fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Inter (Modern/Tech)</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Default IRIS Digital OS typeface. Optimized for high legibility.</div>
                        </div>

                        <div 
                            onClick={() => handleFontChange('ibm')}
                            style={{ 
                                padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                                background: fontPref === 'ibm' ? 'var(--primary-light)' : '#fff',
                                borderColor: fontPref === 'ibm' ? 'var(--primary)' : 'var(--border-color)'
                            }}
                        >
                            <div style={{ fontWeight: 700, fontFamily: '"IBM Plex Sans", sans-serif' }}>IBM Plex Sans (Authoritative/Corporate)</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Medical-instrument style. High density and professional weight.</div>
                        </div>
                    </div>
                </div>

                {/* 2. SECURITY & ENCRYPTION */}
                <div className="card">
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}><i className="fas fa-shield-check"></i> Security Manifest</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                            HIPAA compliance and field-level encryption status.
                        </p>
                    </div>

                    <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>ENCRYPTION_ENGINE</span>
                            <span className="status-badge green">AES_256_GCM</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>SECRET_STORAGE</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>.ENV_DIRECTOR</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>AUDIT_LOG_VERBOSITY</label>
                        <select 
                            value={auditVerbosity} 
                            onChange={(e) => { setAuditVerbosity(e.target.value); localStorage.setItem('iris_audit_verbosity', e.target.value); }}
                            className="search-input"
                            style={{ marginTop: '5px' }}
                        >
                            <option value="MINIMAL">MINIMAL (Clinical Errors Only)</option>
                            <option value="NORMAL">NORMAL (HIPAA Compliance Standard)</option>
                            <option value="VERBOSE">VERBOSE (Detailed Interaction Log)</option>
                        </select>
                    </div>
                </div>

                {/* 3. CLINICAL MODULE CONFIGURATION */}
                <div className="card">
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}><i className="fas fa-sliders-h"></i> Clinical Module Config</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                            Configure case management behavior and compliance thresholds.
                        </p>
                    </div>

                    {/* Digital Signature Toggle */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Require Digital Signature</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                    When enabled, case notes require an explicit signature action before finalization. When disabled, the user's authenticated session is used for audit compliance.
                                </div>
                            </div>
                            <div 
                                onClick={() => handleSigToggle(!requireDigitalSig)}
                                style={{ 
                                    width: '48px', height: '26px', borderRadius: '13px', cursor: 'pointer',
                                    background: requireDigitalSig ? 'var(--status-green)' : '#cbd5e1',
                                    position: 'relative', transition: 'background 0.2s', flexShrink: 0, marginLeft: '15px'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                                    position: 'absolute', top: '3px', transition: 'left 0.2s',
                                    left: requireDigitalSig ? '25px' : '3px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}></div>
                            </div>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '0.65rem', fontWeight: 700, color: requireDigitalSig ? 'var(--status-green)' : 'var(--text-muted)' }}>
                            {requireDigitalSig ? '✓ DIGITAL_SIGNATURE_REQUIRED' : '○ SESSION_AUTH_ONLY'}
                        </div>
                    </div>

                    {/* Budget Alert Threshold */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '3px' }}>Budget Overspend Alert Threshold</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            System triggers a "Critical Overspend Alert" and recommends F-01205B amendment when remaining budget falls below this percentage.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input 
                                type="range" min="5" max="30" step="5"
                                value={budgetAlertThreshold}
                                onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
                                style={{ flex: 1 }}
                            />
                            <div style={{ 
                                minWidth: '60px', textAlign: 'center', padding: '6px 12px', borderRadius: '6px',
                                background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem'
                            }}>
                                {budgetAlertThreshold}%
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                            <span>5% (Aggressive)</span>
                            <span>30% (Conservative)</span>
                        </div>
                    </div>
                </div>

                {/* 4. SYSTEM INFO */}
                <div className="card">
                    <h3><i className="fas fa-microchip"></i> Node Health &amp; Build</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>OS_VERSION</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>V2.7.0-CLINICAL</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>SYNC_STATUS</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-green)' }}>ACTIVE_SANDATA_GATEWAY</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>AUTH_SCOPE</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>ICA_FEA_ADMIN_OVERRIDE</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>SIG_MODE</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: requireDigitalSig ? 'var(--status-green)' : 'var(--text-muted)' }}>
                                {requireDigitalSig ? 'DIGITAL_SIGNATURE' : 'SESSION_AUTH'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>BUDGET_ALERT</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>{budgetAlertThreshold}%_REMAINING</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModule;
