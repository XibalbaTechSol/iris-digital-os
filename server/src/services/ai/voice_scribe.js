/**
 * IRIS Digital OS - Ambient Voice Scribe (Task 6.1)
 * Goal: Solve "Documentation Debt" for ICs.
 * Core Logic: Whisper Transcription + GPT-4 Structured Drafting.
 */

const fs = require("fs");
const { OpenAI } = require("openai");

class VoiceScribe {
    constructor(apiKey) {
        this.openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    }

    /**
     * Transcribes an audio file and structures it into a WISITS-compliant case note.
     */
    async transcribeAndStructure(audioPath, context) {
        console.log(`[AI_SCRIBE] Transcribing audio from ${audioPath}...`);

        try {
            // 1. Transcription (Whisper-1)
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: "whisper-1",
            });

            console.log(`[AI_SCRIBE] Structuring draft for IC Review...`);

            // 2. Structured Drafting (GPT-4)
            const systemPrompt = `
                You are an Expert IRIS Consultant Scribe. 
                Convert the following raw transcript into a structured WISITS Case Note.
                
                SECTIONS REQUIRED:
                - PARTICIPANT CHOICE: Evidence that the participant led the conversation.
                - GOAL PROGRESS: Discussion on ${context.currentGoal}.
                - HEALTH & SAFETY: Any risks discussed and remediation.
                - ACTION ITEMS: Next steps for the IC.

                STYLE: Clinical, person-centered, professional.
            `;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `TRANSCRIPT: ${transcription.text}` }
                ]
            });

            return {
                success: true,
                rawTranscript: transcription.text,
                structuredDraft: response.choices[0].message.content,
                metadata: {
                    duration: "Mock Duration",
                    words: transcription.text.split(" ").length
                }
            };

        } catch (error) {
            console.error('[AI_SCRIBE_ERROR]', error.message);
            return { success: false, error: "Audio Processing Failed" };
        }
    }
}

module.exports = VoiceScribe;
