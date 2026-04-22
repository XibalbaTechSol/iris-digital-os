const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const formController = require('../controllers/formController');

router.get('/', (req, res) => documentController.getAllDocuments(req, res));
router.get('/:participantId', (req, res) => documentController.getParticipantDocuments(req, res));
router.post('/upload', (req, res) => documentController.uploadDocument(req, res));
router.post('/audit', (req, res) => documentController.auditDocument(req, res));
router.get('/preclaim/:participantId', (req, res) => documentController.preClaimAudit(req, res));
router.get('/export/:participantId', (req, res) => documentController.exportPacket(req, res));
router.get('/view/:id', (req, res) => documentController.viewDocument(req, res));
router.get('/download/:id', (req, res) => documentController.downloadDocument(req, res));

// Forms
router.get('/forms/:entityId', formController.getForms);
router.post('/forms/sign', formController.signForm);
router.get('/forms/download/:formId', formController.downloadForm);

module.exports = router;
