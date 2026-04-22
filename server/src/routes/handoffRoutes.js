const express = require('express');
const router = express.Router();
const handoffController = require('../controllers/handoffController');

router.post('/initiate', handoffController.initiateHandoff);
router.post('/accept', handoffController.acceptReferral);
router.post('/sdpc', handoffController.sdpcReferral);

module.exports = router;
