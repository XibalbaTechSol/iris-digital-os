const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

router.post('/', incidentController.submitIncident);
router.get('/active', incidentController.getActiveIncidents);
router.post('/analyze', incidentController.analyzeIncident);
router.post('/sdoh', (req, res) => {
    require('../services/ai/sdoh_service').analyzeRisk(req.body.text).then(r => res.json(r));
});

module.exports = router;
