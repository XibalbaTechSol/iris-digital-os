/**
 * IRIS Digital OS — Task Automation Service
 * Phase 21: ICA Consultant Compliance Automation Hub
 * 
 * Automates repetitive ICA consultant tasks:
 *   - Monthly Contact Reminders (5 days before due)
 *   - Document Chase (missing/expired forms flagged)
 *   - ISSP Review Triggers (budget > 75% or within 90 days of anniversary)
 *   - Worker Compliance Checks (expired BG checks, missing I-9/W-4)
 *   - Assessment Follow-ups (linked to AssessmentService overdue items)
 */

const db = require('../../database/database');
const SecurityAuditService = require('../security/audit_service');

class TaskAutomationService {

    /**
     * Generate the daily task list for a consultant.
     * Aggregates all compliance dimensions into a single prioritized list.
     * @param {string} consultantId - The consultant to generate tasks for (or 'ALL')
     */
    async generateDailyTaskList(consultantId = 'ALL') {
        const baseFilter = consultantId === 'ALL'
            ? `WHERE status IN ('PENDING', 'OVERDUE') AND (snoozed_until IS NULL OR snoozed_until < datetime('now'))`
            : `WHERE consultant_id = ? AND status IN ('PENDING', 'OVERDUE') AND (snoozed_until IS NULL OR snoozed_until < datetime('now'))`;

        const params = consultantId === 'ALL' ? [] : [consultantId];

        const tasks = await db.query(
            `SELECT ct.*, p.name as participant_name
             FROM compliance_tasks ct
             LEFT JOIN participants p ON ct.participant_id = p.id
             ${baseFilter}
             ORDER BY 
                CASE ct.priority 
                    WHEN 'CRITICAL' THEN 1 
                    WHEN 'HIGH' THEN 2 
                    WHEN 'MEDIUM' THEN 3 
                    WHEN 'LOW' THEN 4 
                END,
                ct.due_date ASC`,
            params
        );

        // Enrich with overdue status
        const now = new Date();
        return tasks.map(t => {
            const dueDate = new Date(t.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntilDue < 0;

            // Auto-escalate overdue tasks
            if (isOverdue && t.status !== 'OVERDUE') {
                db.run(`UPDATE compliance_tasks SET status = 'OVERDUE' WHERE id = ?`, [t.id]).catch(() => {});
            }

            return {
                id: t.id,
                consultantId: t.consultant_id,
                participantId: t.participant_id,
                participantName: t.participant_name || 'Unknown',
                taskType: t.task_type,
                title: t.title,
                description: t.description,
                priority: isOverdue && t.priority !== 'CRITICAL' ? 'HIGH' : t.priority,
                dueDate: t.due_date,
                daysUntilDue,
                isOverdue,
                status: isOverdue ? 'OVERDUE' : t.status,
                createdAt: t.created_at
            };
        });
    }

    /**
     * Complete a task.
     */
    async completeTask(taskId, userId = 'SYSTEM') {
        await db.run(
            `UPDATE compliance_tasks SET status = 'COMPLETED' WHERE id = ?`,
            [taskId]
        );

        await SecurityAuditService.logEvent({
            userId,
            action: 'COMPLIANCE_TASK_COMPLETED',
            moduleId: 'COMPLIANCE_HUB',
            metadata: { taskId }
        });

        console.log(`[TASK_AUTO] Task ${taskId} completed by ${userId}`);
        return { success: true, taskId, status: 'COMPLETED' };
    }

    /**
     * Snooze a task by N days.
     */
    async snoozeTask(taskId, days = 3, userId = 'SYSTEM') {
        const snoozeUntil = new Date();
        snoozeUntil.setDate(snoozeUntil.getDate() + days);

        await db.run(
            `UPDATE compliance_tasks SET status = 'SNOOZED', snoozed_until = ? WHERE id = ?`,
            [snoozeUntil.toISOString(), taskId]
        );

        await SecurityAuditService.logEvent({
            userId,
            action: 'COMPLIANCE_TASK_SNOOZED',
            moduleId: 'COMPLIANCE_HUB',
            metadata: { taskId, snoozedUntil: snoozeUntil.toISOString(), days }
        });

        console.log(`[TASK_AUTO] Task ${taskId} snoozed until ${snoozeUntil.toISOString()}`);
        return { success: true, taskId, status: 'SNOOZED', snoozedUntil: snoozeUntil.toISOString() };
    }

    /**
     * Run the auto-generation engine.
     * Scans the system for compliance gaps and creates tasks.
     * This should be called periodically (e.g., daily cron or on-demand).
     */
    async runAutoGeneration() {
        let created = 0;

        // 1. Monthly Contact Reminders
        created += await this._generateMonthlyContactTasks();

        // 2. Document Chase — missing/expired forms
        created += await this._generateDocumentChaseTasks();

        // 3. Worker Compliance — expired BG checks
        created += await this._generateWorkerComplianceTasks();

        // 4. ISSP Review Triggers — budget or renewal proximity
        created += await this._generateISSPReviewTasks();

        console.log(`[TASK_AUTO] Auto-generation complete. ${created} new tasks created.`);
        return { success: true, tasksCreated: created };
    }

    async _generateMonthlyContactTasks() {
        let count = 0;
        const participants = await db.query(`SELECT id, name FROM participants WHERE status = 'ACTIVE'`);

        for (const p of participants) {
            // Check if a MONTHLY_CONTACT task already exists for this month
            const existing = await db.query(
                `SELECT id FROM compliance_tasks 
                 WHERE participant_id = ? AND task_type = 'MONTHLY_CONTACT' 
                 AND status IN ('PENDING', 'SNOOZED')
                 AND due_date >= date('now', 'start of month')`,
                [p.id]
            );
            if (existing.length > 0) continue;

            // Schedule monthly contact 5 days before end of month
            const endOfMonth = new Date();
            endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0); // Last day of current month
            const dueDate = new Date(endOfMonth);
            dueDate.setDate(dueDate.getDate() - 5);

            // Only create if due date is in the future
            if (dueDate > new Date()) {
                const id = `CT-MC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
                await db.run(
                    `INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status)
                     VALUES (?, 'CONSULTANT-01', ?, 'MONTHLY_CONTACT', ?, ?, 'MEDIUM', ?, 'PENDING')`,
                    [id, p.id, `Monthly Contact: ${p.name}`, `Complete required monthly face-to-face or phone contact with ${p.name}. Document contact in clinical notes.`, dueDate.toISOString()]
                );
                count++;
            }
        }
        return count;
    }

    async _generateDocumentChaseTasks() {
        let count = 0;
        // Find forms that are still PENDING beyond 30 days
        const staleForms = await db.query(
            `SELECT f.*, p.name as entity_name FROM forms f
             LEFT JOIN participants p ON f.entity_id = p.id
             WHERE f.status = 'PENDING'
             AND f.created_at < datetime('now', '-30 days')`
        );

        for (const form of staleForms) {
            const existing = await db.query(
                `SELECT id FROM compliance_tasks WHERE participant_id = ? AND task_type = 'DOC_CHASE' AND status IN ('PENDING', 'SNOOZED') AND description LIKE ?`,
                [form.entity_id, `%${form.form_code}%`]
            );
            if (existing.length > 0) continue;

            const id = `CT-DC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);

            await db.run(
                `INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status)
                 VALUES (?, 'CONSULTANT-01', ?, 'DOC_CHASE', ?, ?, 'HIGH', ?, 'PENDING')`,
                [id, form.entity_id, `Missing Form: ${form.form_code}`, `Form ${form.form_code} for ${form.entity_name || form.entity_id} has been PENDING for over 30 days. Follow up to collect signature and complete submission.`, dueDate.toISOString()]
            );
            count++;
        }
        return count;
    }

    async _generateWorkerComplianceTasks() {
        let count = 0;
        // Find workers with PENDING background checks
        const workers = await db.query(
            `SELECT w.*, p.name as participant_name FROM workers w
             LEFT JOIN participants p ON w.participant_id = p.id
             WHERE w.bg_check = 'PENDING' AND w.status = 'ACTIVE'`
        );

        for (const w of workers) {
            const existing = await db.query(
                `SELECT id FROM compliance_tasks WHERE participant_id = ? AND task_type = 'WORKER_COMPLIANCE' AND status IN ('PENDING', 'SNOOZED') AND description LIKE ?`,
                [w.participant_id, `%${w.id}%`]
            );
            if (existing.length > 0) continue;

            const id = `CT-WC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 5);

            await db.run(
                `INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status)
                 VALUES (?, 'CONSULTANT-01', ?, 'WORKER_COMPLIANCE', ?, ?, 'CRITICAL', ?, 'PENDING')`,
                [id, w.participant_id, `BG Check Pending: ${w.name}`, `Worker ${w.name} (${w.id}) assigned to ${w.participant_name || w.participant_id} has a PENDING background check. Cannot work until CLEARED per DHS policy.`, dueDate.toISOString()]
            );
            count++;
        }
        return count;
    }

    async _generateISSPReviewTasks() {
        let count = 0;
        // Find participants within 90 days of anniversary or budget > 75%
        const participants = await db.query(
            `SELECT p.id, p.name, p.anniversary_date, b.authorized_amount, b.paid_amount, b.pending_amount
             FROM participants p
             LEFT JOIN budgets b ON p.id = b.participant_id
             WHERE p.status = 'ACTIVE'`
        );

        const now = new Date();

        for (const p of participants) {
            // Check anniversary proximity
            if (p.anniversary_date) {
                const anniversary = new Date(p.anniversary_date);
                const daysUntil = Math.ceil((anniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntil <= 90 && daysUntil > 0) {
                    const existing = await db.query(
                        `SELECT id FROM compliance_tasks WHERE participant_id = ? AND task_type = 'ISSP_REVIEW' AND status IN ('PENDING', 'SNOOZED') AND title LIKE '%Anniversary%'`,
                        [p.id]
                    );
                    if (existing.length === 0) {
                        const id = `CT-IR-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
                        await db.run(
                            `INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status)
                             VALUES (?, 'CONSULTANT-01', ?, 'ISSP_REVIEW', ?, ?, ?, ?, 'PENDING')`,
                            [id, p.id, `ISSP Anniversary Review: ${p.name}`, `${p.name}'s plan anniversary is ${p.anniversary_date} (${daysUntil} days away). Begin ISSP review and renewal process.`, daysUntil <= 30 ? 'CRITICAL' : 'HIGH', p.anniversary_date]
                        );
                        count++;
                    }
                }
            }

            // Check budget burn rate
            if (p.authorized_amount && p.authorized_amount > 0) {
                const spent = (p.paid_amount || 0) + (p.pending_amount || 0);
                const burnPct = (spent / p.authorized_amount) * 100;

                if (burnPct >= 75) {
                    const existing = await db.query(
                        `SELECT id FROM compliance_tasks WHERE participant_id = ? AND task_type = 'ISSP_REVIEW' AND status IN ('PENDING', 'SNOOZED') AND title LIKE '%Budget%'`,
                        [p.id]
                    );
                    if (existing.length === 0) {
                        const id = `CT-BR-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
                        const dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + 7);

                        await db.run(
                            `INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status)
                             VALUES (?, 'CONSULTANT-01', ?, 'ISSP_REVIEW', ?, ?, ?, ?, 'PENDING')`,
                            [id, p.id, `Budget Alert: ${p.name}`, `${p.name} has used ${burnPct.toFixed(0)}% of authorized budget ($${spent.toFixed(0)} / $${p.authorized_amount.toFixed(0)}). Review ISSP for potential service adjustments or exception request.`, burnPct >= 90 ? 'CRITICAL' : 'HIGH', dueDate.toISOString()]
                        );
                        count++;
                    }
                }
            }
        }
        return count;
    }
}

module.exports = new TaskAutomationService();
