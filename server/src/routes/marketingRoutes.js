const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');

router.get('/leads', marketingController.getLeads);
router.post('/leads/convert', marketingController.convertLead);
router.get('/analytics', marketingController.getAnalytics);

module.exports = router;
