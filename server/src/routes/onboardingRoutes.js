const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');

router.post('/participant', onboardingController.submitParticipantOnboarding);
router.post('/pfms-intake', onboardingController.submitPFMSIntake);
router.get('/referrals', onboardingController.getReferrals);
router.post('/finalize', onboardingController.finalizeOnboarding);
router.get('/status/:workerId', onboardingController.getHiringStatus);
router.post('/bid', onboardingController.submitBackgroundCheck);
router.post('/download-dhs/:formType', onboardingController.downloadDHSForm);
router.post('/compliance/enroll', onboardingController.autoEnrollFHP);

module.exports = router;
