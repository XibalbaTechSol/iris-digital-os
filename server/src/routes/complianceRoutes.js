const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const scribeController = require('../controllers/scribeController');
const pcstController = require('../controllers/pcstController');
const mobileAuthController = require('../controllers/mobileAuthController');

// Assessments
router.get('/assessments/upcoming', assessmentController.getUpcomingAssessments);
router.get('/assessments/overdue', assessmentController.getOverdueAssessments);
router.get('/assessments/:participantId', assessmentController.getParticipantAssessments);
router.post('/assessments/complete', assessmentController.completeAssessment);
router.post('/assessments/schedule', assessmentController.scheduleAssessment);

// Tasks
router.get('/tasks/daily', assessmentController.getDailyTasks);
router.post('/tasks/:taskId/complete', assessmentController.completeTask);
router.post('/tasks/:taskId/snooze', assessmentController.snoozeTask);
router.post('/tasks/auto-generate', assessmentController.runAutoGeneration);

// Scribe
router.post('/scribe/process', scribeController.processSession);
router.post('/scribe/save', scribeController.saveNote);
router.get('/scribe/notes/:participantId', scribeController.getNotes);

// PCST
router.get('/pcst/records/:participantId', pcstController.getRecords);
router.post('/pcst/draft', pcstController.createDraft);
router.post('/pcst/sign', pcstController.signAndSubmit);

module.exports = router;
