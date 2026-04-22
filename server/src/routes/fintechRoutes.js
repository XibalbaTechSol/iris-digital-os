const express = require('express');
const router = express.Router();
const fintechController = require('../controllers/fintechController');

router.get('/liquidity/:workerId', fintechController.getLiquidity);
router.post('/payout', fintechController.requestPayout);
router.get('/global', fintechController.getGlobalFinancials);

module.exports = router;
