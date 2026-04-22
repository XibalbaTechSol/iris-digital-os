const express = require('express');
const router = express.Router();
const icaController = require('../controllers/icaController');

router.get('/star-rating', icaController.calculateRealTimeStarRating);
router.post('/justification', icaController.generateOvertimeJustification);
router.get('/fea-health', (req, res) => {
    require('../services/orchestration/fea_monitor_service').checkFEAPayrollHealth().then(h => res.json(h));
});

module.exports = router;
