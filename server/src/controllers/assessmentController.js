/**
 * IRIS OS — Assessment & Compliance Task Controller
 * Phase 21: ICA Consultant Compliance Automation Hub
 * 
 * API endpoints for the 60/90-day assessment lifecycle
 * and automated compliance task management.
 */

const AssessmentService = require('../services/compliance/assessment_service');
const TaskAutomationService = require('../services/compliance/task_automation_service');

// ===== ASSESSMENT ENDPOINTS =====

const getUpcomingAssessments = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        console.log(`[ASSESSMENT_CTRL] GET_UPCOMING (${days} days)`);
        const assessments = await AssessmentService.getUpcomingAssessments(days);
        res.json({ success: true, assessments });
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch upcoming assessments' });
    }
};

const getOverdueAssessments = async (req, res) => {
    try {
        console.log(`[ASSESSMENT_CTRL] GET_OVERDUE`);
        const assessments = await AssessmentService.getOverdueAssessments();
        res.json({ success: true, assessments });
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch overdue assessments' });
    }
};

const getParticipantAssessments = async (req, res) => {
    try {
        const { participantId } = req.params;
        console.log(`[ASSESSMENT_CTRL] GET_PARTICIPANT_ASSESSMENTS: ${participantId}`);
        const assessments = await AssessmentService.getParticipantAssessments(participantId);
        const interval = await AssessmentService.getIntervalForParticipant(participantId);
        res.json({ success: true, assessments, interval });
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch participant assessments' });
    }
};

const completeAssessment = async (req, res) => {
    try {
        const { assessmentId, nurseId, findings } = req.body;
        if (!assessmentId || !nurseId) {
            return res.status(400).json({ success: false, error: 'assessmentId and nurseId are required' });
        }
        console.log(`[ASSESSMENT_CTRL] COMPLETE: ${assessmentId} by ${nurseId}`);
        const result = await AssessmentService.completeAssessment(assessmentId, nurseId, findings);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to complete assessment' });
    }
};

const scheduleAssessment = async (req, res) => {
    try {
        const { participantId, intervalDays, nurseId } = req.body;
        if (!participantId) {
            return res.status(400).json({ success: false, error: 'participantId is required' });
        }
        console.log(`[ASSESSMENT_CTRL] SCHEDULE: ${participantId}`);
        const result = await AssessmentService.scheduleNextAssessment(participantId, intervalDays, nurseId);
        res.json({ success: true, assessment: result });
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to schedule assessment' });
    }
};

// ===== COMPLIANCE TASK ENDPOINTS =====

const getDailyTasks = async (req, res) => {
    try {
        const consultantId = req.query.consultantId || 'ALL';
        console.log(`[ASSESSMENT_CTRL] GET_DAILY_TASKS: ${consultantId}`);
        const tasks = await TaskAutomationService.generateDailyTaskList(consultantId);
        res.json({ success: true, tasks });
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch daily tasks' });
    }
};

const completeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
        console.log(`[ASSESSMENT_CTRL] COMPLETE_TASK: ${taskId}`);
        const result = await TaskAutomationService.completeTask(taskId, userId);
        res.json(result);
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to complete task' });
    }
};

const snoozeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { days } = req.body;
        const userId = req.headers['x-user-id'] || 'ANONYMOUS_OPERATOR';
        console.log(`[ASSESSMENT_CTRL] SNOOZE_TASK: ${taskId} for ${days || 3} days`);
        const result = await TaskAutomationService.snoozeTask(taskId, days || 3, userId);
        res.json(result);
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to snooze task' });
    }
};

const runAutoGeneration = async (req, res) => {
    try {
        console.log(`[ASSESSMENT_CTRL] RUN_AUTO_GENERATION`);
        const result = await TaskAutomationService.runAutoGeneration();
        res.json(result);
    } catch (err) {
        console.error('[ASSESSMENT_CTRL] Error:', err);
        res.status(500).json({ success: false, error: 'Failed to run auto-generation' });
    }
};

module.exports = {
    getUpcomingAssessments,
    getOverdueAssessments,
    getParticipantAssessments,
    completeAssessment,
    scheduleAssessment,
    getDailyTasks,
    completeTask,
    snoozeTask,
    runAutoGeneration
};
