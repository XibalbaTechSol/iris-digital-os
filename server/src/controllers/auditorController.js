/**
 * IRIS Digital OS - Auditor Controller (Phase 6 & 8)
 * Goal: Expose AI-driven compliance, justification, and policy engines to the frontend.
 */

const ComplianceAuditor = require('../services/ai/compliance_auditor');
const JustificationEngine = require('../services/ai/justification_engine');
const PolicyOracle = require('../services/ai/policy_bot');

const auditor = new ComplianceAuditor();
const oteEngine = new JustificationEngine();
const oracle = new PolicyOracle();

/**
 * Task 6.2: Pre-audit a case note.
 */
const auditNote = async (req, res) => {
    const { noteContent, participantProfile } = req.body;

    if (!noteContent) {
        return res.status(400).json({ error: "Note content is required." });
    }

    try {
        const result = await auditor.auditNote(noteContent, participantProfile || {
            id: 'MOCK-123',
            primaryGoal: 'Stay independent in my home.',
            authorizedServices: ['SHC', 'Respite']
        });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Audit failed." });
    }
};

/**
 * Task 6.4: Generate OTE justification.
 */
const generateOTE = async (req, res) => {
    const { requestData } = req.body;

    try {
        const result = await oteEngine.generateJustification(requestData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Generation failed." });
    }
};

/**
 * Task 8.3: AI Policy Oracle
 */
const askPolicy = async (req, res) => {
    const { question } = req.body;
    try {
        const result = await oracle.ask(question);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Oracle failed." });
    }
};

const { mapDataToPdfFields } = require('../services/pdf_engine/mapping_service');

/**
 * Task 6.1: Ambient Voice Scribe
 */
const processVoiceScribe = async (req, res) => {
    // Mock processing of audio stream
    res.json({
        success: true,
        structuredDraft: "PARTICIPANT CHOICE: Jane indicated she wants to keep her current worker. GOAL PROGRESS: Discussed home independence. ACTION ITEMS: IC to submit OTE for ramp repair.",
        confidence: 0.98,
        entities: {
            participantName: "Jane Doe",
            requestedItem: "Ramp Repair",
            estimatedCost: 1200
        }
    });
};

/**
 * Task 4.4: PDF Mapping
 */
const mapForm = async (req, res) => {
    const { templateId, data } = req.body;
    try {
        const mapping = await mapDataToPdfFields(templateId, data);
        res.json(mapping);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
};

const AIPDFMapper = require('../services/ai/ai_pdf_mapper');

/**
 * Task 4.4: AI Smart-Map
 */
const smartMap = async (req, res) => {
    const { tags } = req.body;
    try {
        const result = await AIPDFMapper.intelligentMap(tags || ['First_Name', 'Last_Name', 'MCI']);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

module.exports = {
    auditNote,
    generateOTE,
    askPolicy,
    processVoiceScribe,
    mapForm,
    smartMap
};
