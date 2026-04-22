const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const paController = require('../controllers/paController');

router.get('/participants', caseController.getParticipants);
router.get('/workers/:participantId', caseController.getWorkers);
router.get('/notes/:participantId', caseController.getNotes);
router.post('/notes', caseController.createNote);
router.get('/budget/:participantId', caseController.getBudget);
router.get('/renewals/:participantId', caseController.getRenewals);

// PA Routes
router.get('/pa/:participantId', paController.getPriorAuths);
router.post('/pa', paController.submitPARequest);

module.exports = router;
