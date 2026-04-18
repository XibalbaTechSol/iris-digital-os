/**
 * IRIS Digital OS - AI Policy Knowledge Base (Task 8.3)
 * MOCK MODE SUPPORTED
 */

class PolicyOracle {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    }

    async ask(question) {
        console.log(`[AI_POLICY] Answering: "${question}" (MOCK MODE)`);

        if (!this.apiKey || this.apiKey === 'undefined') {
            const answer = question.toLowerCase().includes('rent') 
                ? "Per Wisconsin IRIS Policy Manual Section 5.3, IRIS funds cannot be used to pay for 'room and board,' which includes rent, mortgage payments, or property taxes."
                : "According to DHS P-00708, all services must be 'cost-effective' and linked to a specific outcome in your Individual Service and Support Plan (ISSP). Please consult your IRIS Consultant for specific authorization.";

            return {
                success: true,
                answer: answer,
                policyManual: "P-00708 (10/2025)",
                disclaimer: "MOCK_RESPONSE: This AI response is generated using local mock logic.",
                mode: 'MOCK'
            };
        }

        return { success: false, error: "Real AI logic requires valid API key." };
    }
}

module.exports = PolicyOracle;
