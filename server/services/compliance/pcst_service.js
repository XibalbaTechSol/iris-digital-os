/**
 * IRIS Digital OS - PCST Service
 * Orchestrates DB tracking and Playwright execution
 */
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const db = require('../../database/database');
const crypto = require('crypto');

class PcstService {
    async createDraft(participantId, nurseId, adlData, allocatedUnits = 0) {
        const id = 'PCST-' + crypto.randomBytes(4).toString('hex');
        await db.run(
            `INSERT INTO pcst_records (id, participant_id, nurse_id, adl_data_json, allocated_units, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, participantId, nurseId, JSON.stringify(adlData), allocatedUnits, 'DRAFT']
        );
        return { id, status: 'DRAFT', allocatedUnits };
    }

    async signAndSubmit(pcstId, signatureBase64) {
        // 1. Mark as signed
        const signatureHash = crypto.createHash('sha256').update(signatureBase64).digest('hex');
        await db.run(
            `UPDATE pcst_records SET status = 'SIGNED', signature_hash = ? WHERE id = ?`,
            [signatureHash, pcstId]
        );

        // 2. Fetch data for bot
        const records = await db.query(`SELECT * FROM pcst_records WHERE id = ?`, [pcstId]);
        if (records.length === 0) throw new Error('PCST not found');
        const pcstData = records[0];

        // 3. Write payload to temp file
        const payloadPath = path.join(__dirname, `../../../tmp/pcst_payload_${pcstId}.json`);
        // Ensure tmp dir exists
        const tmpDir = path.dirname(payloadPath);
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        fs.writeFileSync(payloadPath, JSON.stringify({
            participant_id: pcstData.participant_id,
            adl_data: JSON.parse(pcstData.adl_data_json),
            signature_hash: pcstData.signature_hash
        }));

        // 4. Trigger Playwright Bot asynchronously
        this.runRpaBot(pcstId, payloadPath);

        return { status: 'QUEUED_FOR_SUBMISSION', id: pcstId };
    }

    runRpaBot(pcstId, payloadPath) {
        const botPath = path.join(__dirname, '../../../automation/pcst_bot.js');
        exec(`node ${botPath} ${payloadPath}`, async (error, stdout, stderr) => {
            try {
                // Find JSON output from stdout
                const lines = stdout.split('\\n');
                let result = null;
                for (const line of lines) {
                    if (line.startsWith('{') && line.includes('status')) {
                        result = JSON.parse(line);
                    }
                }

                if (result && result.status === 'SUCCESS') {
                    await db.run(`UPDATE pcst_records SET status = 'SUBMITTED', allocated_units = ? WHERE id = ?`, 
                        [result.allocated_units, pcstId]);
                    console.log(`[PCST_SERVICE] PCST ${pcstId} successfully submitted via RPA.`);
                } else {
                    await db.run(`UPDATE pcst_records SET status = 'FAILED' WHERE id = ?`, [pcstId]);
                    console.error(`[PCST_SERVICE] RPA Bot failed for ${pcstId}.`);
                }
            } catch (e) {
                await db.run(`UPDATE pcst_records SET status = 'FAILED' WHERE id = ?`, [pcstId]);
                console.error(`[PCST_SERVICE] Error parsing bot output:`, e);
            }
            // Cleanup temp
            if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);
        });
    }
}

module.exports = new PcstService();
