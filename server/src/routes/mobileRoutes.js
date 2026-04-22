const express = require('express');
const router = express.Router();
const mobileAuthController = require('../controllers/mobileAuthController');

router.post('/auth/login', mobileAuthController.login);
router.post('/auth/refresh', mobileAuthController.refresh);
router.post('/auth/logout', mobileAuthController.logout);

router.get('/nurse/schedule', mobileAuthController.authenticateMobile, async (req, res) => {
    res.json([
        { id: 'visit-1', participantId: 'part-1', participantName: 'Sarah Connor', time: '09:00', type: 'ROUTINE' },
        { id: 'visit-2', participantId: 'part-2', participantName: 'John Doe', time: '13:00', type: 'ASSESSMENT' }
    ]);
});

router.post('/nurse/assessment', mobileAuthController.authenticateMobile, async (req, res) => {
    try {
        const result = await require('../services/compliance/assessment_service').completeAssessment(
            req.body.assessmentId, req.user.id, req.body.findings
        );
        res.json({ status: 'success', data: result });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.get('/consultant/caseload', mobileAuthController.authenticateMobile, async (req, res) => {
    try {
        const db = require('../config/database');
        const rows = await db.query(`SELECT id, name, risk_level, anniversary_date FROM participants ORDER BY name ASC`);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

router.post('/sync', mobileAuthController.authenticateMobile, async (req, res) => {
    res.json({ status: 'success', synced: req.body.items?.length || 0 });
});

module.exports = router;
