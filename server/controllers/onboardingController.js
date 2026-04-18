/**
 * IRIS Digital OS - Onboarding Controller (Automation Phase)
 * Goal: Manage participant and worker onboarding with automated screening.
 */

const BackgroundCheckService = require('../services/compliance/background_check_service');
const ReferralIntakeService = require('../services/orchestration/referral_intake_service');
const WorkOrderService = require('../services/financials/work_order_service');
const PFMSMapper = require('../services/compliance/pfms_mapper');
const EmailService = require('../services/security/email_service');
const CryptoService = require('../services/security/crypto_service');
const SecurityAuditService = require('../services/security/audit_service');
const db = require('../database/database');
const submitPFMSIntake = async (req, res) => {
    const { intakeData } = req.body;
    try {
        console.log(`[ONBOARDING_CTRL] PROCESSING_PFMS_INTAKE: ${intakeData.worker.name}`);
        
        // HIPAA HARDENING: Encrypt SSN and MCI before further processing
        const secureIntakeData = {
            ...intakeData,
            worker: {
                ...intakeData.worker,
                ssn: CryptoService.encrypt(intakeData.worker.ssn)
            },
            participant: {
                ...intakeData.participant,
                mciId: CryptoService.encrypt(intakeData.participant.mciId)
            }
        };

        // 1. Generate Mappings
        const mapped1201 = PFMSMapper.mapToF01201(secureIntakeData);
        const mapped82064 = PFMSMapper.mapToF82064(intakeData);
        
        // 2. Resolve Exemptions
        const exemptions = PFMSMapper.resolveTaxExemptions(intakeData.relationship.type);
        
        // 3. Trigger Auto-Email (as requested)
        await EmailService.sendIntakePacket(
            intakeData.worker.email, 
            intakeData.worker.name, 
            ['F-01201_MAPPED.pdf', 'F-82064_MAPPED.pdf']
        );
        
        res.json({ 
            success: true, 
            message: 'INTAKE_PROCESSED_AND_EMAILED',
            exemptions,
            mappedForms: [mapped1201, mapped82064]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Intake automation failed' });
    }
};

const submitParticipantOnboarding = async (req, res) => {
    const { participant, source } = req.body;
    try {
        const referral = await ReferralIntakeService.processReferral(source || 'MANUAL', participant);
        res.json({ success: true, ...referral });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Intake failed' });
    }
};

const getReferrals = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
        const referrals = await db.query('SELECT * FROM referrals');
        
        // HIPAA: Audit access to referral PII
        await SecurityAuditService.logEvent({
            userId,
            action: 'PHI_ACCESS_VIEWED',
            moduleId: 'ONBOARDING',
            metadata: { count: referrals.length, type: 'REFERRAL_LIST' },
            ipAddress: req.ip
        });

        // Format names to camelCase for frontend
        const formatted = referrals.map(r => ({
            id: r.id,
            participantName: r.participant_name,
            status: r.status,
            welcomeCallDeadline: r.welcome_call_deadline,
            orientationDeadline: r.orientation_deadline,
            createdAt: r.created_at
        }));
        res.json(formatted);
    } catch (err) {
        console.error('[ONBOARDING_CTRL] DB_ERR:', err);
        res.json([]);
    }
};

const finalizeOnboarding = async (req, res) => {
    const { participantId, budget } = req.body;
    try {
        const workOrder = await WorkOrderService.generateWorkOrder(participantId, budget);
        res.json({ success: true, workOrder, message: 'WORK_ORDER_AUTOMATED' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Authorization error' });
    }
};

const getHiringStatus = async (req, res) => {
    const { workerId } = req.params;
    try {
        const rows = await db.query(`SELECT status, bg_check, hire_date FROM workers WHERE id = ?`, [workerId]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Worker not found' });
        
        const w = rows[0];
        res.json({
            workerId,
            checks: [
                { name: 'Criminal History', status: w.bg_check === 'CLEARED' ? 'CLEAR' : 'PENDING', date: w.hire_date },
                { name: 'OIG Exclusion', status: w.bg_check === 'CLEARED' ? 'CLEAR' : 'PENDING', date: w.hire_date }
            ],
            hiringStatus: w.status === 'ACTIVE' ? 'READY_TO_START' : 'ONBOARDING_IN_PROGRESS'
        });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Database query failed' });
    }
};

const submitBackgroundCheck = async (req, res) => {
    const { workerId, data } = req.body;
    console.log(`[ONBOARDING_CONTROLLER] TRIGGERING_AUTO_SCREENING: ${workerId}`);
    
    try {
        const result = await BackgroundCheckService.triggerAutomatedCheck(workerId, data || { name: 'MOCK_CANDIDATE' });
        res.json({ success: true, transactionId: result.id, status: 'AUTOMATION_QUEUED' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Automation Engine Error' });
    }
};

const EnrollmentBot = require('../services/compliance/enrollment_bot');

const autoEnrollFHP = async (req, res) => {
    const { vendorId } = req.body;
    try {
        const result = await EnrollmentBot.automateFHPEnrollment(vendorId || 'MOCK_VENDOR_001');
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Enrollment Automation Error' });
    }
};

const CompliancePDFService = require('../services/compliance/compliance_pdf_service');

const downloadDHSForm = async (req, res) => {
    const { formType } = req.params;
    const { intakeData } = req.body;
    
    if (!['F-01201', 'F-82064', 'F-00075', 'F-01309', 'F-01201A', 'F-01293', 'I-9', 'W-2'].includes(formType)) {
        return res.status(400).json({ success: false, error: 'Invalid form type' });
    }

    try {
        console.log(`[ONBOARDING_CTRL] DOWNLOADING_DHS_FORM: ${formType}`);
        
        // Use the new service to generate it
        const pdfBuffer = await CompliancePDFService.generateFilledForm(formType, intakeData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${formType}_${intakeData.worker.name.replace(/\s+/g, '_')}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('[ONBOARDING_CTRL] DHS_DOWNLOAD_FAILED:', err);
        res.status(500).json({ success: false, error: 'Failed to generate DHS form' });
    }
};

module.exports = {
    submitParticipantOnboarding,
    submitPFMSIntake,
    getReferrals,
    finalizeOnboarding,
    getHiringStatus,
    submitBackgroundCheck,
    autoEnrollFHP,
    downloadDHSForm
};
