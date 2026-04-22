const express = require('express');
const router = express.Router();
const interopController = require('../controllers/interopController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

router.get('/fhir/Bundle/:participantId', apiKeyAuth, interopController.exportPatientRecord);
router.get('/fhir/:resourceType/:id', apiKeyAuth, interopController.getFHIRResource);
router.get('/fhir/export/:participantId', apiKeyAuth, interopController.exportEHIRecord);
router.post('/stitch/sync/:participantId', apiKeyAuth, (req, res) => interopController.triggerStitchSync(req, res));

module.exports = router;
