/**
 * IRIS Digital OS - API Entry Point
 * MOCK MODE ENABLED
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// Database Initialization
require('./database/database');

// Controllers
const onboardingController = require('./controllers/onboardingController');
const auditorController = require('./controllers/auditorController');
const incidentController = require('./controllers/incidentController');
const fintechController = require('./controllers/fintechController');
const icaController = require('./controllers/icaController');
const adminController = require('./controllers/adminController');
const evvController = require('./controllers/evvController');
const billingController = require('./controllers/billingController');
const securityController = require('./controllers/securityController');
const caseController = require('./controllers/caseController');
const marketingController = require('./controllers/marketingController');
const paController = require('./controllers/paController');
const documentController = require('./controllers/documentController');
const formController = require('./controllers/formController');
const alertController = require('./controllers/alertController');
const interopController = require('./controllers/interopController');
const scribeController = require('./controllers/scribeController');
const assessmentController = require('./controllers/assessmentController');
const mobileAuthController = require('./controllers/mobileAuthController');
const handoffController = require('./controllers/handoffController');
const apiKeyAuth = require('./middleware/apiKeyAuth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased capability for Document Vault base64 uploads

// Mock Tenant Middleware (for local testing)
app.use((req, res, next) => {
    req.tenantId = req.headers['x-tenant-id'] || 'MOCK-TENANT';
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'active', domain: 'IRIS_DIGITAL_OS', mode: 'MOCK' });
});

// Phase 1: Admin Routes
app.get('/api/v1/admin/stats', adminController.getSystemStats);

// Phase 2: Onboarding Routes
app.post('/api/v1/onboarding/participant', onboardingController.submitParticipantOnboarding);
app.post('/api/v1/onboarding/pfms-intake', onboardingController.submitPFMSIntake);
app.get('/api/v1/onboarding/referrals', onboardingController.getReferrals);
app.post('/api/v1/onboarding/finalize', onboardingController.finalizeOnboarding);
app.get('/api/v1/onboarding/status/:workerId', onboardingController.getHiringStatus);
app.post('/api/v1/onboarding/bid', onboardingController.submitBackgroundCheck);
app.post('/api/v1/onboarding/download-dhs/:formType', onboardingController.downloadDHSForm);
app.post('/api/v1/compliance/enroll', onboardingController.autoEnrollFHP);

// Phase 4: EVV & Sandata Routes
app.post('/api/v1/evv/submit', evvController.submitVisit);
app.post('/api/v1/billing/batch', billingController.submitBatchClaim);
app.post('/api/v1/billing/reconcile', billingController.reconcileRemittance);
app.get('/api/v1/billing/pending', (req, res) => billingController.getPendingClaims(req, res));
app.post('/api/v1/billing/automate', (req, res) => billingController.automateClaims(req, res));
app.post('/api/v1/billing/download-cms1500/:claimId', (req, res) => billingController.downloadCMS1500(req, res));

// Phase 5: ICA & Operations Routes
app.get('/api/v1/ops/star-rating', icaController.calculateRealTimeStarRating);
app.post('/api/v1/ops/justification', icaController.generateOvertimeJustification);
app.get('/api/v1/ops/fea-health', (req, res) => {
    require('./services/orchestration/fea_monitor_service').checkFEAPayrollHealth().then(h => res.json(h));
});

// Phase 5: Fintech Routes
app.get('/api/v1/fintech/liquidity/:workerId', fintechController.getLiquidity);
app.post('/api/v1/fintech/payout', fintechController.requestPayout);
app.get('/api/v1/fintech/global', fintechController.getGlobalFinancials);

// Phase 6: AI Suite Routes
app.post('/api/v1/ai/audit', auditorController.auditNote);
app.post('/api/v1/ai/generate-ote', auditorController.generateOTE);
app.post('/api/v1/ai/policy-ask', auditorController.askPolicy);
app.post('/api/v1/ai/scribe', auditorController.processVoiceScribe);
app.post('/api/v1/ai/map-pdf', auditorController.mapForm);
app.post('/api/v1/ai/smart-map', auditorController.smartMap);
app.post('/api/v1/ai/integrity', (req, res) => {
    require('./services/ai/integrity_service').auditProgressNote(req.body.note).then(r => res.json(r));
});
app.post('/api/v1/incidents/sdoh', (req, res) => {
    require('./services/ai/sdoh_service').analyzeRisk(req.body.text).then(r => res.json(r));
});

// Phase 7: Incident Routes
app.post('/api/v1/incidents', incidentController.submitIncident);
app.get('/api/v1/incidents/active', incidentController.getActiveIncidents);
app.post('/api/v1/incidents/analyze', incidentController.analyzeIncident);

// Phase 8: Security & Audit Routes
app.post('/api/v1/security/audit', (req, res) => securityController.logAction(req, res));
app.get('/api/v1/security/audit', (req, res) => securityController.getAuditLogs(req, res));

// Phase 9: Case Management Routes
app.get('/api/v1/case/participants', caseController.getParticipants);
app.get('/api/v1/case/workers/:participantId', caseController.getWorkers);
app.get('/api/v1/case/notes/:participantId', caseController.getNotes);
app.post('/api/v1/case/notes', caseController.createNote);
app.get('/api/v1/case/budget/:participantId', caseController.getBudget);
app.get('/api/v1/case/renewals/:participantId', caseController.getRenewals);

// Phase 11: Prior Authorization Routes
app.get('/api/v1/case/pa/:participantId', paController.getPriorAuths);
app.post('/api/v1/case/pa', paController.submitPARequest);

// Phase 12: Clinical Document Vault & Audit Shield Routes
app.get('/api/v1/documents', (req, res) => documentController.getAllDocuments(req, res));
app.get('/api/v1/documents/:participantId', (req, res) => documentController.getParticipantDocuments(req, res));
app.post('/api/v1/documents/upload', (req, res) => documentController.uploadDocument(req, res));
app.post('/api/v1/documents/audit', (req, res) => documentController.auditDocument(req, res));
app.get('/api/v1/documents/preclaim/:participantId', (req, res) => documentController.preClaimAudit(req, res));
app.get('/api/v1/documents/export/:participantId', (req, res) => documentController.exportPacket(req, res));
app.get('/api/v1/documents/view/:id', (req, res) => documentController.viewDocument(req, res));
app.get('/api/v1/documents/download/:id', (req, res) => documentController.downloadDocument(req, res));

// Digital Form Engine Routes
app.get('/api/v1/forms/:entityId', formController.getForms);
app.post('/api/v1/forms/sign', formController.signForm);
app.get('/api/v1/forms/download/:formId', formController.downloadForm);

// Phase 10: Marketing CRM Routes
app.get('/api/v1/marketing/leads', marketingController.getLeads);
app.post('/api/v1/marketing/leads/convert', marketingController.convertLead);
app.get('/api/v1/marketing/analytics', marketingController.getAnalytics);

// Phase 20: ADRC & Secure Handoff Routes
app.post('/api/v1/handoff/initiate', handoffController.initiateHandoff);
app.post('/api/v1/handoff/accept', handoffController.acceptReferral);
app.post('/api/v1/handoff/sdpc', handoffController.sdpcReferral);

// Phase 15: Automated Monitoring & Alerts
app.get('/api/v1/alerts', alertController.getAlerts);
app.patch('/api/v1/alerts/:id', alertController.updateAlert);

// Phase 16: Interoperability (FHIR/HIE)
app.get('/api/v1/interop/fhir/Bundle/:participantId', apiKeyAuth, interopController.exportPatientRecord);
app.get('/api/v1/interop/fhir/:resourceType/:id', apiKeyAuth, interopController.getFHIRResource);
app.get('/api/v1/interop/ehi/export/:participantId', apiKeyAuth, interopController.exportEHIRecord);
app.post('/api/v1/interop/stitch/sync/:participantId', apiKeyAuth, (req, res) => interopController.triggerStitchSync(req, res));

// Phase 18: Clinical AI-Scribe
app.post('/api/v1/clinical/scribe/process', scribeController.processSession);
app.post('/api/v1/clinical/scribe/save', scribeController.saveNote);
app.get('/api/v1/clinical/scribe/notes/:participantId', scribeController.getNotes);

// Phase 21: Compliance Automation Hub — Assessments
app.get('/api/v1/assessments/upcoming', assessmentController.getUpcomingAssessments);
app.get('/api/v1/assessments/overdue', assessmentController.getOverdueAssessments);
app.get('/api/v1/assessments/:participantId', assessmentController.getParticipantAssessments);
app.post('/api/v1/assessments/complete', assessmentController.completeAssessment);
app.post('/api/v1/assessments/schedule', assessmentController.scheduleAssessment);

// Phase 21: Compliance Automation Hub — Tasks
app.get('/api/v1/tasks/daily', assessmentController.getDailyTasks);
app.post('/api/v1/tasks/:taskId/complete', assessmentController.completeTask);
app.post('/api/v1/tasks/:taskId/snooze', assessmentController.snoozeTask);
app.post('/api/v1/tasks/auto-generate', assessmentController.runAutoGeneration);

// Phase 23: PCST Automation (Main Web App)
const pcstController = require('./controllers/pcstController');
app.get('/api/v1/pcst/records/:participantId', pcstController.getRecords);
app.post('/api/v1/pcst/draft', pcstController.createDraft);
app.post('/api/v1/pcst/sign', pcstController.signAndSubmit);

// Phase 22: Mobile APIs
app.post('/api/v1/auth/mobile/login', mobileAuthController.login);
app.post('/api/v1/auth/mobile/refresh', mobileAuthController.refresh);
app.post('/api/v1/auth/mobile/logout', mobileAuthController.logout);

app.get('/api/v1/mobile/nurse/schedule', mobileAuthController.authenticateMobile, async (req, res) => {
    // Mock schedule for NURSE
    res.json([
        { id: 'visit-1', participantId: 'part-1', participantName: 'Sarah Connor', time: '09:00', type: 'ROUTINE' },
        { id: 'visit-2', participantId: 'part-2', participantName: 'John Doe', time: '13:00', type: 'ASSESSMENT' }
    ]);
});

app.post('/api/v1/mobile/nurse/assessment', mobileAuthController.authenticateMobile, async (req, res) => {
    try {
        const result = await require('./services/compliance/assessment_service').completeAssessment(
            req.body.assessmentId, req.user.id, req.body.findings
        );
        res.json({ status: 'success', data: result });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.get('/api/v1/mobile/consultant/caseload', mobileAuthController.authenticateMobile, async (req, res) => {
    try {
        const db = require('./database/database');
        const rows = await db.query(`SELECT id, name, risk_level, anniversary_date FROM participants ORDER BY name ASC`);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.post('/api/v1/mobile/sync', mobileAuthController.authenticateMobile, async (req, res) => {
    // Mock batch sync endpoint
    res.json({ status: 'success', synced: req.body.items?.length || 0 });
});

// Mock server start
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\x1b[32m[SERVER] IRIS Digital OS (MOCK MODE) running on port ${PORT}\x1b[0m`);
        console.log(`\x1b[36m[READY] API Endpoints mounted for Phases 1-11 (All Modules)\x1b[0m`);
    });
}

module.exports = app;
