import React from 'react';
import { useUser } from '../context/UserContext';

// Import Modular Components
import CaseMgmtModule from '../modules/CaseMgmtModule';
import FinancialsModule from '../modules/FinancialsModule';
import OnboardingModule from '../modules/OnboardingModule';
import EVVModule from '../modules/EVVModule';
import SchedulingModule from '../modules/SchedulingModule';
import ReportsModule from '../modules/ReportsModule';
import BillingModule from '../modules/BillingModule';
import WorkerPortalModule from '../modules/WorkerPortalModule';
import ClaimsAutomatorModule from '../modules/ClaimsAutomatorModule';
import StateComplianceModule from '../modules/StateComplianceModule';
import MarketingModule from '../modules/MarketingModule';
import SettingsModule from '../modules/SettingsModule';
import IntakeModule from '../modules/IntakeModule';
import RenewalModule from '../modules/RenewalModule';
import AdminModule from '../modules/AdminModule';
import InteropModule from '../modules/InteropModule';
import DocumentVaultModule from '../modules/DocumentVaultModule';
import IncidentModule from '../modules/IncidentModule';
import ComplianceHubModule from '../modules/ComplianceHubModule';
import PcstModule from '../modules/PcstModule';
import ADRCModule from '../modules/ADRCModule';

export const NavItem: React.FC<{ id: string, icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
        <i className={`fas ${icon}`}></i> {label}
    </div>
);

export const OrganizationNav: React.FC<{ activeModule: string, setActiveModule: (m: any) => void }> = ({ activeModule, setActiveModule }) => {
    const { user } = useUser();

    switch (user.role) {
        case 'FEA_SPECIALIST':
            return (
                <>
                    <div style={{ padding: '20px 24px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>FEA_OPERATIONS</div>
                    <NavItem id="nav-financials" icon="fa-wallet" label="Financials Command" active={activeModule === 'FINANCIALS'} onClick={() => setActiveModule('FINANCIALS')} />
                    <NavItem id="nav-onboarding" icon="fa-user-plus" label="Worker Onboarding" active={activeModule === 'ONBOARDING'} onClick={() => setActiveModule('ONBOARDING')} />
                    <NavItem id="nav-evv" icon="fa-clock" label="EVV Logistics" active={activeModule === 'EVV'} onClick={() => setActiveModule('EVV')} />
                    <NavItem id="nav-billing" icon="fa-file-invoice-dollar" label="Billing Gateway" active={activeModule === 'BILLING'} onClick={() => setActiveModule('BILLING')} />
                    <NavItem id="nav-claims" icon="fa-robot" label="Claims Automator" active={activeModule === 'CLAIMS_AUTOMATOR'} onClick={() => setActiveModule('CLAIMS_AUTOMATOR')} />
                    <NavItem id="nav-scheduling" icon="fa-calendar-alt" label="Scheduling" active={activeModule === 'SCHEDULING'} onClick={() => setActiveModule('SCHEDULING')} />
                    <NavItem id="nav-worker-portal" icon="fa-mobile-alt" label="Worker App View" active={activeModule === 'WORKER_PORTAL'} onClick={() => setActiveModule('WORKER_PORTAL')} />
                </>
            );
        case 'ICA_CONSULTANT':
            return (
                <>
                    <div style={{ padding: '20px 24px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>ICA_OPERATIONS</div>
                    <NavItem id="nav-case" icon="fa-house-user" label="Case Management" active={activeModule === 'CASE_MGMT'} onClick={() => setActiveModule('CASE_MGMT')} />
                    <NavItem id="nav-renewals" icon="fa-calendar-check" label="Clinical Renewals" active={activeModule === 'RENEWALS'} onClick={() => setActiveModule('RENEWALS')} />
                    <NavItem id="nav-vault" icon="fa-vault" label="Document Vault" active={activeModule === 'DOCUMENT_VAULT'} onClick={() => setActiveModule('DOCUMENT_VAULT')} />
                    <NavItem id="nav-incidents" icon="fa-triangle-exclamation" label="Incident Tracking" active={activeModule === 'INCIDENTS'} onClick={() => setActiveModule('INCIDENTS')} />
                    <NavItem id="nav-marketing" icon="fa-bullhorn" label="Referral CRM" active={activeModule === 'MARKETING'} onClick={() => setActiveModule('MARKETING')} />
                </>
            );
        case 'SDPC_NURSE':
            return (
                <>
                    <div style={{ padding: '20px 24px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>SDPC_OVERSIGHT_AGENCY</div>
                    <NavItem id="nav-pcst" icon="fa-file-medical" label="PCST Assessment" active={activeModule === 'PCST'} onClick={() => setActiveModule('PCST')} />
                    <NavItem id="nav-case" icon="fa-stethoscope" label="Oversight Narrative" active={activeModule === 'CASE_MGMT'} onClick={() => setActiveModule('CASE_MGMT')} />
                    <NavItem id="nav-vault" icon="fa-folder-open" label="Clinical Records" active={activeModule === 'DOCUMENT_VAULT'} onClick={() => setActiveModule('DOCUMENT_VAULT')} />
                    <NavItem id="nav-incidents" icon="fa-shield-virus" label="Quality Incidents" active={activeModule === 'INCIDENTS'} onClick={() => setActiveModule('INCIDENTS')} />
                </>
            );
        case 'ADRC_AGENT':
            return (
                <>
                    <div style={{ padding: '20px 24px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>ADRC_PORTAL</div>
                    <NavItem id="nav-adrc-crm" icon="fa-users-cog" label="ADRC CRM" active={activeModule === 'INTAKE'} onClick={() => setActiveModule('INTAKE')} />
                    <NavItem id="nav-referrals" icon="fa-forward" label="Referral Submission" active={activeModule === 'INTAKE'} onClick={() => setActiveModule('INTAKE')} />
                </>
            );
        case 'DHS_AUDITOR':
            return (
                <>
                    <div style={{ padding: '20px 24px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>DHS_OVERSIGHT</div>
                    <NavItem id="nav-admin" icon="fa-shield-halved" label="Audit Shield" active={activeModule === 'ADMIN'} onClick={() => setActiveModule('ADMIN')} />
                    <NavItem id="nav-compliance-hub" icon="fa-clipboard-check" label="Document Debt" active={activeModule === 'COMPLIANCE_HUB'} onClick={() => setActiveModule('COMPLIANCE_HUB')} />
                    <NavItem id="nav-state-compliance" icon="fa-building-columns" label="State Compliance Alerts" active={activeModule === 'STATE_COMPLIANCE'} onClick={() => setActiveModule('STATE_COMPLIANCE')} />
                    <NavItem id="nav-reports" icon="fa-chart-pie" label="System Telemetry" active={activeModule === 'REPORTS'} onClick={() => setActiveModule('REPORTS')} />
                    <NavItem id="nav-interop" icon="fa-network-wired" label="FHIR Interoperability" active={activeModule === 'INTEROP'} onClick={() => setActiveModule('INTEROP')} />
                </>
            );
        case 'ADMIN':
        default:
            return (
                <>
                    <div style={{ padding: '0 24px 10px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>SYSTEM_ADMIN</div>
                    <NavItem id="nav-admin" icon="fa-shield-halved" label="God Mode Dashboard" active={activeModule === 'ADMIN'} onClick={() => setActiveModule('ADMIN')} />
                    <NavItem id="nav-settings" icon="fa-cogs" label="Global Settings" active={activeModule === 'SETTINGS'} onClick={() => setActiveModule('SETTINGS')} />
                </>
            );
    }
};

export const OrganizationModules: React.FC<{ activeModule: string }> = ({ activeModule }) => {
    const { user } = useUser();
    switch(activeModule) {
        case 'EVV': return <EVVModule />;
        case 'CASE_MGMT': return <CaseMgmtModule tenant="ICA" />; // Hardcoded generic for now
        case 'FINANCIALS': return <FinancialsModule />;
        case 'SCHEDULING': return <SchedulingModule />;
        case 'ONBOARDING': return <OnboardingModule />;
        case 'REPORTS': return <ReportsModule />;
        case 'BILLING': return <BillingModule />;
        case 'MARKETING': return <MarketingModule />;
        case 'SETTINGS': return <SettingsModule />;
        case 'CLAIMS_AUTOMATOR': return <ClaimsAutomatorModule />;
        case 'STATE_COMPLIANCE': return <StateComplianceModule />;
        case 'WORKER_PORTAL': return <WorkerPortalModule />;
        case 'INTAKE': return user.role === 'ADRC_AGENT' ? <ADRCModule /> : <IntakeModule />;
        case 'DOCUMENT_VAULT': return <DocumentVaultModule />;
        case 'RENEWALS': return <RenewalModule />;
        case 'INCIDENTS': return <IncidentModule />;
        case 'COMPLIANCE_HUB': return <ComplianceHubModule />;
        case 'PCST': return <PcstModule />;
        case 'ADMIN': return <AdminModule />;
        case 'INTEROP': return <InteropModule />;
        default: return <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Module not found.</div>;
    }
};
