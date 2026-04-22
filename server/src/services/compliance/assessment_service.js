/**
 * IRIS Digital OS — Assessment Lifecycle Service
 * Phase 21: ICA Consultant Compliance Automation Hub
 * 
 * Manages 60/90-day clinical nursing assessments for IRIS participants.
 * Auto-schedules next assessment on completion. Generates CLINICAL alerts
 * for overdue assessments via the existing AlertService.
 * 
 * Interval Logic:
 *   - HIGH risk → 60-day cycle
 *   - MODERATE / LOW → 90-day cycle
 *   - Per-participant override via `assessment_interval_override` column
 */

const db = require('../../config/database');
const CryptoService = require('../security/crypto_service');
const SecurityAuditService = require('../security/audit_service');

class AssessmentService {

    /**
     * Determine the correct interval (in days) for a participant.
     * Checks for per-participant override first, then falls back to risk-based logic.
     */
    async getIntervalForParticipant(participantId) {
        const rows = await db.query(
            `SELECT risk_level, assessment_interval_override FROM participants WHERE id = ?`,
            [participantId]
        );
        if (rows.length === 0) return 90; // Safe default

        const p = rows[0];
        // Per-participant override takes priority
        if (p.assessment_interval_override && p.assessment_interval_override > 0) {
            return p.assessment_interval_override;
        }
        // Risk-based default
        return p.risk_level === 'HIGH' ? 60 : 90;
    }

    /**
     * Schedule the next assessment for a participant.
     * @param {string} participantId
     * @param {number|null} intervalOverride - Optional explicit interval in days
     * @param {string} nurseId - Assigned nurse
     */
    async scheduleNextAssessment(participantId, intervalOverride = null, nurseId = 'NURSE-UNASSIGNED') {
        const interval = intervalOverride || await this.getIntervalForParticipant(participantId);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + interval);

        const id = `ASM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const assessmentType = interval <= 60 ? '60_DAY' : '90_DAY';

        await db.run(
            `INSERT INTO assessments (id, participant_id, assessment_type, assigned_nurse_id, due_date, status)
             VALUES (?, ?, ?, ?, ?, 'SCHEDULED')`,
            [id, participantId, assessmentType, nurseId, dueDate.toISOString()]
        );

        console.log(`[ASSESSMENT_SVC] Scheduled ${assessmentType} assessment ${id} for ${participantId} due ${dueDate.toISOString()}`);
        return { id, participantId, assessmentType, nurseId, dueDate: dueDate.toISOString(), status: 'SCHEDULED' };
    }

    /**
     * Get all assessments due within the next N days, sorted by urgency.
     */
    async getUpcomingAssessments(withinDays = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + withinDays);

        const rows = await db.query(
            `SELECT a.*, p.name as participant_name, p.risk_level
             FROM assessments a
             LEFT JOIN participants p ON a.participant_id = p.id
             WHERE a.status IN ('SCHEDULED', 'DUE_SOON', 'OVERDUE')
             AND a.due_date <= ?
             ORDER BY a.due_date ASC`,
            [cutoff.toISOString()]
        );

        return rows.map(r => this._enrichAssessment(r));
    }

    /**
     * Get all overdue assessments with escalation severity.
     */
    async getOverdueAssessments() {
        const now = new Date().toISOString();

        const rows = await db.query(
            `SELECT a.*, p.name as participant_name, p.risk_level
             FROM assessments a
             LEFT JOIN participants p ON a.participant_id = p.id
             WHERE a.status != 'COMPLETED'
             AND a.due_date < ?
             ORDER BY a.due_date ASC`,
            [now]
        );

        // Mark them as OVERDUE in the database
        for (const row of rows) {
            if (row.status !== 'OVERDUE') {
                await db.run(`UPDATE assessments SET status = 'OVERDUE' WHERE id = ?`, [row.id]);
            }
        }

        return rows.map(r => {
            const enriched = this._enrichAssessment(r);
            enriched.status = 'OVERDUE';
            return enriched;
        });
    }

    /**
     * Get assessment history for a specific participant.
     */
    async getParticipantAssessments(participantId) {
        try {
            const rows = await db.query(
                `SELECT a.*, p.name as participant_name, p.risk_level
                FROM assessments a
                LEFT JOIN participants p ON a.participant_id = p.id
                WHERE a.participant_id = ?
                ORDER BY a.due_date DESC`,
                [participantId]
            );

            if (!rows || !Array.isArray(rows)) return [];
            return rows.map(r => this._enrichAssessment(r));
        } catch (e) {
            console.error(`[ASSESSMENT_SVC] FAILED_FETCH for P_${participantId}:`, e.message);
            throw e; 
        }
    }

    /**
     * Complete an assessment with clinical findings.
     * Auto-schedules the next assessment in the cycle.
     */
    async completeAssessment(assessmentId, nurseId, findings) {
        const now = new Date().toISOString();
        const encryptedFindings = CryptoService.encrypt(JSON.stringify(findings));

        await db.run(
            `UPDATE assessments
             SET status = 'COMPLETED', completed_date = ?, findings = ?, assigned_nurse_id = ?
             WHERE id = ?`,
            [now, encryptedFindings, nurseId, assessmentId]
        );

        // Get the assessment to determine participant for next scheduling
        const assessments = await db.query(`SELECT * FROM assessments WHERE id = ?`, [assessmentId]);
        if (assessments.length === 0) {
            throw new Error(`Assessment ${assessmentId} not found`);
        }

        const assessment = assessments[0];

        // HIPAA Audit: Log assessment completion
        await SecurityAuditService.logEvent({
            userId: nurseId,
            action: 'ASSESSMENT_COMPLETED',
            moduleId: 'COMPLIANCE_HUB',
            metadata: {
                assessmentId,
                participantId: assessment.participant_id,
                type: assessment.assessment_type
            }
        });

        // Auto-schedule the next assessment in the cycle
        const next = await this.scheduleNextAssessment(
            assessment.participant_id,
            null,
            nurseId
        );

        console.log(`[ASSESSMENT_SVC] Completed ${assessmentId}. Next scheduled: ${next.id}`);
        return { completed: assessmentId, next };
    }

    /**
     * Enrich a raw assessment row with computed fields.
     */
    _enrichAssessment(row) {
        const dueDate = new Date(row.due_date);
        const now = new Date();
        const diffMs = dueDate.getTime() - now.getTime();
        const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let urgency = 'NORMAL';
        if (daysUntilDue < 0) urgency = 'OVERDUE';
        else if (daysUntilDue <= 3) urgency = 'CRITICAL';
        else if (daysUntilDue <= 7) urgency = 'HIGH';
        else if (daysUntilDue <= 14) urgency = 'MEDIUM';

        return {
            id: row.id,
            participantId: row.participant_id,
            participantName: row.participant_name || 'Unknown',
            riskLevel: row.risk_level || 'UNKNOWN',
            assessmentType: row.assessment_type,
            assignedNurseId: row.assigned_nurse_id,
            dueDate: row.due_date,
            completedDate: row.completed_date,
            status: row.status,
            urgency,
            daysUntilDue,
            createdAt: row.created_at
        };
    }
}

module.exports = new AssessmentService();
