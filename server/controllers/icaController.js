/**
 * IRIS Digital OS - ICA Controller (Task 5.1 & 5.2)
 * Goal: Automate Consultant workflows for Connections ICA.
 * Features: 40-Hour Exception Wizard, Star-Rating Predictor.
 */

const { logAction } = require('../middleware/audit');

/**
 * Task 5.1: 40-Hour Exception Wizard
 * Logic: Auto-generates justification text based on participant history and health/safety needs.
 */
const generateOvertimeJustification = async (req, res) => {
    const { participantId, workerId, reasonCode } = req.body;

    try {
        // 1. Fetch Participant Health Profile (Mock)
        // In Prod: db.query("SELECT medical_needs, mobility_score FROM health_profiles...")
        const profile = {
            name: "John Doe",
            needs: "24/7 Monitoring",
            recentFalls: 2
        };

        // 2. Logic: The "Justification Engine"
        const reasons = {
            'AGENCY_FAILED': "Despite exhaustive outreach to 5 local agencies, no staff is available to cover these hours. Utilizing existing worker ensures continuity of care.",
            'HEALTH_SAFETY': `Participant ${profile.name} has experienced ${profile.recentFalls} falls recently and requires ${profile.needs}. Splitting care among new unknown workers poses a significant health risk.`,
            'SPECIALIZED_SKILL': "Worker possesses specialized knowledge of the participant's unique non-verbal communication cues that a new agency worker would not have."
        };

        const justificationText = reasons[reasonCode] || "Standard health and safety assurance.";

        res.json({
            success: true,
            form_f01689_draft: {
                justification: justificationText,
                worker_id: workerId,
                hours_requested: 52,
                health_safety_plan: "Worker will provide 1:1 supervision during peak fall hours."
            }
        });

    } catch (error) {
        console.error('[ICA_ERROR]', error);
        res.status(500).json({ error: "Failed to generate justification." });
    }
};

/**
 * Task 5.2: Star-Rating Predictor
 * Logic: Calculates real-time quality score based on 2025 Scorecard methodology.
 */
const calculateRealTimeStarRating = async (req, res) => {
    try {
        // 1. Fetch Metrics (Mock)
        // metric A: Timely Monthly Contact (Target 95%+)
        // metric B: ISSP Accuracy (Target 90%+)
        const stats = {
            totalParticipants: 45,
            contactsLast30Days: 43, // 95.5%
            isspRejections: 1       // 97.7%
        };

        const contactScore = (stats.contactsLast30Days / stats.totalParticipants) * 5;
        const accuracyScore = ((stats.totalParticipants - stats.isspRejections) / stats.totalParticipants) * 5;
        
        const compositeRating = (contactScore + accuracyScore) / 2;

        res.json({
            success: true,
            predictedRating: compositeRating.toFixed(1),
            breakdown: {
                responsiveness: contactScore.toFixed(1),
                accuracy: accuracyScore.toFixed(1)
            },
            recommendation: stats.contactsLast30Days < stats.totalParticipants 
                ? `Urgent: Contact ${stats.totalParticipants - stats.contactsLast30Days} participants today to secure 5 stars.`
                : "Excellent: On track for 5-star rating."
        });

    } catch (error) {
        console.error('[STARS_ERROR]', error);
        res.status(500).json({ error: "Failed to predict rating." });
    }
};

module.exports = {
    generateOvertimeJustification,
    calculateRealTimeStarRating
};
