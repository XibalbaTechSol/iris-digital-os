/**
 * IRIS Digital OS - 24-Hour Incident Trigger (Task 7.3)
 * Goal: Use AI to detect "Immediate Reportable Incidents" in real-time.
 * Compliance: DHS P-03131 (24-hour reporting mandate for discovery).
 */

const { OpenAI } = require("openai");

class IncidentTriggerService {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    }

    /**
     * Scans caregiver notes for patterns of abuse, neglect, exploitation, or missing participants.
     */
    async scanNoteForIncidents(noteContent, participantId) {
        console.log(`[AI_INCIDENT] Scanning note for Participant ${participantId}...`);

        const systemPrompt = `
            You are a Critical Incident Specialist for the Wisconsin IRIS program.
            Analyze the following caregiver service note for "Immediate Reportable Incidents" per DHS P-03131.
            
            REPORTABLE CRITERIA:
            1. MISSING PARTICIPANT: Absence of 24+ hours or risk beliefs.
            2. ABUSE/NEGLECT: Physical, sexual, emotional abuse; caregiver neglect; self-neglect.
            3. FINANCIAL MISAPPROPRIATION: Theft or unauthorized use of property.
            4. RESTRAINT/RESTRICTIVE MEASURES: Use of locked rooms, physical/chemical restraints.
            5. STATE INSTITUTION: Admittance to an IMD or intensive treatment.

            If an incident is detected, identify the CATEGORY and provide a brief SUMMARY.
        `;

        const userPrompt = `Note Content: "${noteContent}"\n\nReturn JSON: { "incidentDetected": boolean, "category": "string", "summary": "string", "urgency": "LOW/MEDIUM/HIGH" }`;

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);

            if (result.incidentDetected) {
                console.warn(`[CRITICAL] Incident Detected for ${participantId}: ${result.category}`);
                
                // Starting the 24-Hour Discovery Clock
                const discoveryTime = new Date().toISOString();
                const reportingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

                return {
                    alert: true,
                    discoveryTime,
                    reportingDeadline,
                    ...result,
                    mandatorySteps: [
                        "1. Notify ICA Supervisor immediately.",
                        "2. Ensure Participant Health and Safety.",
                        "3. Notify DHS within 24 hours of discovery.",
                        "4. Refer to Adult Protective Services (APS) if abuse/neglect suspected."
                    ]
                };
            }

            return { alert: false };

        } catch (error) {
            console.error('[AI_INCIDENT_ERROR]', error.message);
            return { alert: false, error: "AI Monitoring Delayed" };
        }
    }
}

module.exports = IncidentTriggerService;
