const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');

router.post('/audit', (req, res) => securityController.logAction(req, res));
router.get('/audit', (req, res) => securityController.getAuditLogs(req, res));

module.exports = router;
