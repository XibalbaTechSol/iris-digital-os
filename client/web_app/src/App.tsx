import React, { useState, useEffect } from 'react';
import EventBus from './utils/EventBus';
import './index.css';

import { OrganizationNav, OrganizationModules } from './layouts/OrganizationRouter';
import { useUser, UserRole } from './context/UserContext';

// --- TYPE DEFINITIONS ---
type ModuleType = 
    | 'EVV'
    | 'CASE_MGMT' 
    | 'FINANCIALS' 
    | 'ONBOARDING' 
    | 'SCHEDULING'
    | 'REPORTS' 
    | 'BILLING'
    | 'MARKETING'
    | 'SETTINGS'
    | 'CLAIMS_AUTOMATOR'
    | 'WORKER_PORTAL'
    | 'STATE_COMPLIANCE'
    | 'INTAKE'
    | 'DOCUMENT_VAULT'
    | 'RENEWALS'
    | 'INTEROP'
    | 'INCIDENTS'
    | 'COMPLIANCE_HUB'
    | 'PCST'
    | 'ADMIN';

type TenantType = 'ICA' | 'FEA' | 'SDPC' | 'WORKER';

const App: React.FC = () => {
    const [activeModule, setActiveModule] = useState<ModuleType>('CASE_MGMT');
    const [systemHealth, setSystemHealth] = useState<'STABLE' | 'WARNING' | 'CRITICAL'>('STABLE');
    const [tenant, setTenant] = useState<TenantType>('FEA');
    const [theme, setTheme] = useState(localStorage.getItem('iris_theme') || 'clinical');
    const [fontClass, setFontClass] = useState(localStorage.getItem('iris_font') === 'ibm' ? 'font-ibm' : '');
    const { user, setRole } = useUser();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const telemetryQueue = React.useRef<any[]>([]);

    useEffect(() => {
        // Initial health check
        fetch('/health')
            .then(r => r.json())
            .then(d => {
                if (d.status === 'active') setSystemHealth('STABLE');
            })
            .catch(() => setSystemHealth('CRITICAL'));

        // GLOBAL TELEMETRY ENGINE
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const elementTag = target.tagName;
            const elementClass = target.className;
            const elementId = target.id;
            const textContent = target.innerText?.substring(0, 50) || '';
            const action = `CLICK_${elementTag}`;

            // Add heavily detailed click to the queue
            telemetryQueue.current.push({
                action,
                moduleId: activeModule,
                metadata: {
                    timestamp: new Date().toISOString(),
                    x: e.clientX,
                    y: e.clientY,
                    target: {
                        tag: elementTag,
                        id: elementId,
                        className: typeof elementClass === 'string' ? elementClass : '',
                        text: textContent.replace(/\s+/g, ' ').trim()
                    }
                }
            });

            // Fast flush if buffer hits threshold
            if (telemetryQueue.current.length >= 50) {
                flushTelemetry();
            }
        };

        const flushTelemetry = () => {
            if (telemetryQueue.current.length === 0) return;
            const payload = [...telemetryQueue.current];
            telemetryQueue.current = []; // Clear instantly to prevent duplication
            
            // Native Beacon API provides robust background execution even during unload
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon('/api/v1/security/audit', blob);
            } else {
                fetch('/api/v1/security/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': 'DEMO_USER_01' },
                    body: JSON.stringify(payload)
                }).catch(console.error);
            }
        };

        // Aggressive loop to check buffer
        const intervalId = setInterval(flushTelemetry, 5000);

        const handleBeforeUnload = () => flushTelemetry();

        const handleFontChange = () => {
            setFontClass(localStorage.getItem('iris_font') === 'ibm' ? 'font-ibm' : '');
        };

        const handleThemeChange = () => {
            setTheme(localStorage.getItem('iris_theme') || 'clinical');
        };

        window.addEventListener('click', handleGlobalClick, { capture: true });
        window.addEventListener('theme-font-changed', handleFontChange);
        window.addEventListener('theme-changed', handleThemeChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        const fetchAlerts = () => {
            fetch('/api/v1/alerts')
                .then(res => res.json())
                .then(data => {
                    if (data.success) setAlerts(data.alerts);
                })
                .catch(console.error);
        };

        const alertInterval = setInterval(fetchAlerts, 10000); // 10s Polling for HIPAA alerts
        fetchAlerts();

        return () => {
            window.removeEventListener('click', handleGlobalClick, { capture: true });
            window.removeEventListener('theme-font-changed', handleFontChange);
            window.removeEventListener('theme-changed', handleThemeChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(intervalId);
            clearInterval(alertInterval);
            flushTelemetry(); // Flush whatever remains on unmount
        };
    }, [activeModule]);

    return (
        <div className={`app-shell theme-${theme} ${fontClass}`}>
            {/* 1. SIDEBAR: Clinical Navigation */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src="/assets/iris_logo.png" alt="IRIS OS" style={{ height: '32px' }} />
                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>IRIS OS</span>
                </div>
                
                <div className="identity-context" style={{ padding: '0 20px 20px' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.5px' }}>IDENTITY_OVERSIGHT</div>
                    <select 
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
                        onChange={(e) => {
                            const newRole = e.target.value as UserRole;
                            setRole(newRole);
                            
                            // Unify Role -> Tenant & Default Module
                            switch(newRole) {
                                case 'FEA_SPECIALIST': 
                                    setTenant('FEA'); 
                                    setActiveModule('FINANCIALS');
                                    break;
                                case 'ICA_CONSULTANT': 
                                    setTenant('ICA'); 
                                    setActiveModule('CASE_MGMT');
                                    break;
                                case 'SDPC_NURSE': 
                                    setTenant('SDPC'); 
                                    setActiveModule('PCST');
                                    break;
                                case 'ADRC_AGENT': 
                                    setTenant('ICA'); 
                                    setActiveModule('INTAKE');
                                    break;
                                case 'DHS_AUDITOR': 
                                    setTenant('FEA'); 
                                    setActiveModule('ADMIN');
                                    break;
                                case 'ADMIN':
                                    setTenant('FEA');
                                    setActiveModule('ADMIN');
                                    break;
                            }
                        }} 
                        value={user.role}
                    >
                        <option value="ADMIN">SYSTEM_ADMIN (GOD_MODE)</option>
                        <option value="FEA_SPECIALIST">FEA_SPECIALIST (FINANCIALS)</option>
                        <option value="ICA_CONSULTANT">ICA_CONSULTANT (CASE_MGMT)</option>
                        <option value="SDPC_NURSE">SDPC_NURSE (NURSING)</option>
                        <option value="ADRC_AGENT">ADRC_INTAKE_AGENT (REFERRAL)</option>
                        <option value="DHS_AUDITOR">DHS_COMPLIANCE_AUDITOR</option>
                    </select>
                </div>

                <nav className="sidebar-nav">
                    <OrganizationNav activeModule={activeModule} setActiveModule={setActiveModule} />
                </nav>

                <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>THEME_ENGINE</div>
                        <i className="fas fa-cog" style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={() => setActiveModule('SETTINGS')}></i>
                    </div>
                    <select 
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', fontSize: '0.75rem', borderRadius: '4px' }}
                        value={theme}
                        onChange={(e) => {
                            const newTheme = e.target.value;
                            setTheme(newTheme);
                            localStorage.setItem('iris_theme', newTheme);
                        }}
                    >
                        <option value="clinical">CLINICAL_LIGHT</option>
                        <option value="midnight">MIDNIGHT_TERMINAL</option>
                        <option value="iris">DEEP_IRIS</option>
                    </select>
                </div>
            </aside>

            {/* 2. MAIN AREA: Clinical Modules */}
            <main className="main-content">
                {/* APP HEADER */}
                <header style={{ padding: '0 40px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-dark)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-eye" style={{ color: '#000', fontSize: '1.2rem' }}></i>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>IRIS<span style={{ color: 'var(--primary)', fontWeight: 300 }}>_DIGITAL_OS</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: systemHealth === 'STABLE' ? 'var(--status-green)' : 'var(--status-red)', boxShadow: `0 0 10px ${systemHealth === 'STABLE' ? 'var(--status-green)' : 'var(--status-red)'}` }}></div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.6)' }}>DB_PERSISTENCE: {systemHealth}</span>
                        </div>
                    </div>
                    
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Notification Bell */}
                        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifications(!showNotifications)}>
                            <i className="fas fa-bell" style={{ fontSize: '1.2rem', color: showNotifications ? 'var(--primary)' : 'var(--text-muted)' }}></i>
                            {alerts.filter(a => a.status === 'NEW').length > 0 && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent-action)', color: '#fff', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold' }}>
                                    {alerts.filter(a => a.status === 'NEW').length}
                                </span>
                            )}
                            
                            {showNotifications && (
                                <div className="notification-popover" style={{ position: 'absolute', top: '40px', right: '0', width: '320px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
                                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>SYSTEM_NOTIFICATIONS</span>
                                        <span className="status-badge" style={{ fontSize: '0.6rem' }} onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}>CLOSE</span>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {alerts.length === 0 ? (
                                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>NO_ACTIVE_ALERTS</div>
                                        ) : (
                                            alerts.map(a => (
                                                <div key={a.id} style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: a.status === 'NEW' ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: a.severity === 'CRITICAL' ? '#ff4444' : 'var(--primary)' }}>{a.severity} // {a.type}</span>
                                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>{a.title}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{a.message}</div>
                                                    {a.status === 'NEW' && (
                                                        <button 
                                                            style={{ marginTop: '10px', background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.6rem', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                await fetch(`/api/v1/alerts/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ACKNOWLEDGED' }) });
                                                                // Refresh local state
                                                                setAlerts(prev => prev.map(item => item.id === a.id ? { ...item, status: 'ACKNOWLEDGED' } : item));
                                                            }}
                                                        >
                                                            ACKNOWLEDGE
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--primary)' }} onClick={() => { setActiveModule('ADMIN'); setShowNotifications(false); }}>
                                        VIEW_ALL_MANAGEMENT
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.5px' }}>
                                    {user.role.replace('_', ' ')}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="module-container">
                    <OrganizationModules activeModule={activeModule} />
                </div>
            </main>
        </div>
    );
};

export default App;
