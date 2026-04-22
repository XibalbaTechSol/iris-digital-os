const express = require('express');
const router = express.Router();
const auditorController = require('../controllers/auditorController');

router.post('/audit', auditorController.auditNote);
router.post('/generate-ote', auditorController.generateOTE);
router.post('/policy-ask', auditorController.askPolicy);
router.post('/scribe', auditorController.processVoiceScribe);
router.post('/map-pdf', auditorController.mapForm);
router.post('/smart-map', auditorController.smartMap);
router.post('/integrity', (req, res) => {
    require('../services/ai/integrity_service').auditProgressNote(req.body.note).then(r => res.json(r));
});

module.exports = router;
