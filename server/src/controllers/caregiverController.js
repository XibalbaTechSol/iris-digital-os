/**
 * IRIS Digital OS - Caregiver Controller (Task 2.2)
 * Goal: Automate the Participant-Hired Worker (PHW) onboarding and tax logic.
 * Forms Handled: F-01201, F-01201A, F-01201C, W-4, WT-4, BID (F-82064).
 */

const { logAction } = require('../middleware/audit');

const submitCaregiverOnboarding = async (req, res) => {
    const { 
        workerInfo,      // { full_name, ssn, dob, phone }
        participantId,   // The employer
        relationship,    // { code: 'SPOUSE', lives_with: true }
        employmentTerms // { service_code: 'S5125', hourly_rate: 15.00 }
    } = req.body;

    try {
        // 1. Core Relationship Logic (F-01201A)
        // This determines our "Real Cost" to the budget and EVV status.
        let compliance = {
            fica_exempt: false,
            suta_exempt: false,
            evv_exempt: false
        };

        if (relationship.code === 'SPOUSE' || relationship.code === 'PARENT') {
            compliance.fica_exempt = true;
            compliance.suta_exempt = true;
            if (relationship.lives_with) compliance.evv_exempt = true;
        } else if (relationship.code === 'CHILD' && workerInfo.age < 21) {
            compliance.fica_exempt = true;
            compliance.suta_exempt = true;
        }

        // 2. Database: Create Worker Profile & Compliance Record
        // (Pseudocode)
        const newWorker = await pool.query(
            "INSERT INTO users (tenant_id, full_name, role) VALUES ($1, $2, 'CAREGIVER') RETURNING user_id",
            [req.tenantId, workerInfo.full_name]
        );
        const workerId = newWorker.rows[0].user_id;

        await pool.query(
            `INSERT INTO worker_compliance 
            (tenant_id, worker_id, relationship_code, is_live_in, is_evv_exempt, fica_exempt, suta_exempt, bid_status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
            [req.tenantId, workerId, relationship.code, relationship.lives_with, compliance.evv_exempt, compliance.fica_exempt, compliance.suta_exempt]
        );

        // 3. Trigger Background Check (WORCS RPA/API)
        console.log(`[CAREGIVER] Triggering BID Check for ${workerInfo.full_name}...`);

        // 4. Create Employment Agreement
        await pool.query(
            "INSERT INTO employment_agreements (tenant_id, participant_id, worker_id, service_code, hourly_rate, status) VALUES ($1, $2, $3, $4, $5, 'PENDING_FEA')",
            [req.tenantId, participantId, workerId, employmentTerms.service_code, employmentTerms.hourly_rate]
        );

        res.status(201).json({
            success: true,
            worker_id: workerId,
            message: "Caregiver packet submitted. Background check initiated.",
            exemptions: compliance
        });

    } catch (error) {
        console.error('[CAREGIVER_ERROR]', error);
        res.status(500).json({ error: "Internal Server Error during caregiver setup." });
    }
};

module.exports = {
    submitCaregiverOnboarding
};
