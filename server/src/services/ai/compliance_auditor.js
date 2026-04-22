/**
 * IRIS Digital OS - Compliance NLP Auditor (Task 6.2)
 * MOCK MODE SUPPORTED
 */

class ComplianceAuditor {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    }

    async auditNote(noteContent, participantProfile) {
        console.log(`[AI_AUDIT] Auditing note in MOCK MODE...`);

        if (!this.apiKey || this.apiKey === 'undefined') {
            // High-fidelity mock response
            return {
                success: true,
                score: 0.85,
                status: 'PASS',
                star_prediction: 4.8,
                feedback: [
                    "✓ Note clearly documents participant's personal choice.",
                    "✓ Linked service 'SHC' to primary goal of 'Independence'.",
                    "⚠ Suggest adding more detail on the specific ADL tasks performed.",
                    "✓ Health and safety remediation plan is present."
                ],
                timestamp: new Date().toISOString(),
                note: "MOCK_RESPONSE: OpenAI API Key not detected."
            };
        }

        // Real logic would go here...
        return { success: false, error: "Real AI logic requires valid API key." };
    }
}

module.exports = ComplianceAuditor;
