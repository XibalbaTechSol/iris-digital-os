const express = require('express');
const router = express.Router();
const evvController = require('../controllers/evvController');

router.post('/submit', evvController.submitVisit);

module.exports = router;
