const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.post('/batch', billingController.submitBatchClaim);
router.post('/reconcile', billingController.reconcileRemittance);
router.get('/pending', (req, res) => billingController.getPendingClaims(req, res));
router.post('/automate', (req, res) => billingController.automateClaims(req, res));
router.post('/download-cms1500/:claimId', (req, res) => billingController.downloadCMS1500(req, res));

module.exports = router;
