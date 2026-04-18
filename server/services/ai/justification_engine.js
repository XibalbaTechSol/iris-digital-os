/**
 * IRIS Digital OS - OTE Justification Engine (Task 6.4)
 * Goal: Generate DHS-compliant justification text for One-Time Expenses (F-01206).
 * Core Logic: Map outcomes, bids, and functional needs to state criteria.
 */

const { OpenAI } = require("openai");

class JustificationEngine {
    constructor(apiKey) {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (key && key !== 'sk-MOCK_KEY') {
            this.openai = new OpenAI({ apiKey: key });
        } else {
            console.warn('[AI_OTE] No valid API key found. Running in MOCK_JUSTIFICATION mode.');
            this.openai = null;
        }
    }

    /**
     * Generates a draft justification for an OTE request.
     */
    async generateJustification(requestData) {
        if (!this.openai) {
            return {
                success: true,
                justification: `[MOCK_JUSTIFICATION] The requested ${requestData.item} is functional the most cost-effective solution for this participant's outcome: ${requestData.outcome}. Exhausted all other natural and community supports. Ensures health and safety in the community related to the functional need: ${requestData.need}.`,
                form_metadata: { form_id: "F-01206", naming_convention: "OTE_Request_JS_04162026.pdf" }
            };
        }
        console.log(`[AI_OTE] Generating justification for ${requestData.item}...`);

        const systemPrompt = `
            You are a Senior IRIS Consultant (IC) in Wisconsin.
            You must write a formal justification for a One-Time Expense (OTE) request (Form F-01206).
            
            DHS JUSTIFICATION REQUIREMENTS:
            1. LINK TO OUTCOME: How does this help the participant's Long-Term Care outcome?
            2. FUNCTIONAL NECESSITY: Connect the request to a specific need in their Functional Screen (LTCFS).
            3. EXHAUSTION OF RESOURCES: Explicitly state that natural supports and ForwardHealth card services were explored and are unavailable/insufficient.
            4. COST-EFFECTIVENESS: Explain why this specific bid/item is the most economical choice.
            5. HEALTH & SAFETY: State how this item prevents a health or safety risk (e.g., prevents institutionalization).

            MANDATORY PHRASES TO INCLUDE:
            - "Most cost-effective solution"
            - "Exhausted all other natural and community supports"
            - "Ensures health and safety in the community"
        `;

        const userPrompt = `
            ITEM: ${requestData.item}
            PARTICIPANT OUTCOME: ${requestData.outcome}
            FUNCTIONAL NEED: ${requestData.need}
            BIDS: ${JSON.stringify(requestData.bids)}
            
            Generate a 2-3 paragraph professional justification for the DHS Review Committee.
        `;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            });

            return {
                success: true,
                justification: response.choices[0].message.content,
                form_metadata: {
                    form_id: "F-01206",
                    naming_convention: "OTE_Request_JS_04162026.pdf"
                }
            };

        } catch (error) {
            console.error('[AI_OTE_ERROR]', error.message);
            return { success: false, error: "AI Generation Failed" };
        }
    }
}

module.exports = JustificationEngine;
