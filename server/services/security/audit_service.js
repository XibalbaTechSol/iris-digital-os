const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const AlertService = require('./alert_service');

/**
 * IRIS Digital OS - Dedicated Audit Service (SQLite)
 * Goal: Professional-grade persistence for all system interactions.
 */
class AuditService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../database/audit.db');
        this.db = new sqlite3.Database(this.dbPath);
        this.initSchema();
    }

    initSchema() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                action TEXT,
                moduleId TEXT,
                metadata TEXT,
                ipAddress TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Record a system event in the dedicated database.
     */
    async logEvent(event) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO audit_logs (userId, action, moduleId, metadata, ipAddress)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                event.userId, 
                event.action, 
                event.moduleId, 
                JSON.stringify(event.metadata), 
                event.ipAddress,
                (err) => {
                    if (err) {
                        console.error('[DATABASE_ERROR] AUDIT_LOG_FAILED:', err);
                        reject(err);
                    } else {
                        console.log(`[AUDIT_DB] PERSISTED: ${event.action}`);
                        // HIPAA: Real-time risk evaluation
                        AlertService.processEvent(event).catch(e => console.error('[ALERT_ERR]', e));
                        resolve({ success: true });
                    }
                }
            );
            stmt.finalize();
        });
    }

    /**
     * Bulk insert multiple events using a single transaction for maximum performance.
     */
    async logBatchEvents(events) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(events) || events.length === 0) return resolve({ success: true, count: 0 });

            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION;');

                const stmt = this.db.prepare(`
                    INSERT INTO audit_logs (userId, action, moduleId, metadata, ipAddress)
                    VALUES (?, ?, ?, ?, ?)
                `);

                for (const event of events) {
                    stmt.run(
                        event.userId || 'ANONYMOUS_OPERATOR',
                        event.action,
                        event.moduleId || 'UNKNOWN',
                        JSON.stringify(event.metadata || {}),
                        event.ipAddress || 'UNKNOWN'
                    );
                    // HIPAA: Real-time risk evaluation for batches
                    AlertService.processEvent(event).catch(e => console.error('[ALERT_ERR]', e));
                }

                stmt.finalize();

                this.db.run('COMMIT;', (err) => {
                    if (err) {
                        console.error('[DATABASE_ERROR] BULK_AUDIT_LOG_FAILED:', err);
                        this.db.run('ROLLBACK;');
                        reject(err);
                    } else {
                        console.log(`[AUDIT_DB] PERSISTED_BATCH: ${events.length} target interactions.`);
                        resolve({ success: true, count: events.length });
                    }
                });
            });
        });
    }

    /**
     * Retrieve audit history with granular filtering.
     */
    async getAuditHistory(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM audit_logs WHERE 1=1';
            let params = [];
            
            if (filters.userId) {
                query += ' AND userId = ?';
                params.push(filters.userId);
            }

            if (filters.moduleId) {
                query += ' AND moduleId = ?';
                params.push(filters.moduleId);
            }

            if (filters.action) {
                query += ' AND action LIKE ?';
                params.push(`%${filters.action}%`);
            }

            if (filters.dateStart) {
                query += ' AND timestamp >= ?';
                params.push(filters.dateStart);
            }

            if (filters.dateEnd) {
                query += ' AND timestamp <= ?';
                params.push(filters.dateEnd);
            }
            
            query += ' ORDER BY timestamp DESC LIMIT 200';

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => ({ ...r, metadata: JSON.parse(r.metadata || '{}') })));
            });
        });
    }
}

module.exports = new AuditService();
