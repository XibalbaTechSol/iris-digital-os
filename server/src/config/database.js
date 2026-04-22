const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const CryptoService = require('../services/security/crypto_service');

const dbPath = path.resolve(__dirname, 'iris_core.db');

// Ensure db directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const databaseInstance = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DATABASE] Error opening database', err.message);
    } else {
        console.log('[DATABASE] Connected to SQLite database.');
        initializeSchemas();
    }
});

function initializeSchemas() {
    databaseInstance.serialize(() => {
        // Participants Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS participants (
            id TEXT PRIMARY KEY,
            name TEXT,
            mci_id TEXT,
            county TEXT,
            ica TEXT,
            risk_level TEXT DEFAULT 'LOW',
            status TEXT DEFAULT 'ACTIVE',
            anniversary_date DATETIME,
            last_renewal_date DATETIME,
            assessment_interval_override INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Phase 21: Clinical Assessments (60/90-day nursing assessments)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            participant_id TEXT,
            assessment_type TEXT,
            assigned_nurse_id TEXT,
            due_date DATETIME,
            completed_date DATETIME,
            findings TEXT,
            status TEXT DEFAULT 'SCHEDULED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Phase 21: Compliance Tasks (auto-generated consultant tasks)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS compliance_tasks (
            id TEXT PRIMARY KEY,
            consultant_id TEXT,
            participant_id TEXT,
            task_type TEXT,
            title TEXT,
            description TEXT,
            priority TEXT DEFAULT 'MEDIUM',
            due_date DATETIME,
            snoozed_until DATETIME,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Phase 23: PCST Records
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS pcst_records (
            id TEXT PRIMARY KEY,
            participant_id TEXT,
            nurse_id TEXT,
            adl_data_json TEXT,
            signature_hash TEXT,
            allocated_units INTEGER,
            status TEXT DEFAULT 'DRAFT', -- DRAFT, SIGNED, SUBMITTED, FAILED
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Workers Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS workers (
            id TEXT PRIMARY KEY,
            name TEXT,
            participant_id TEXT,
            relationship TEXT,
            rate REAL,
            weekly_hrs INTEGER,
            status TEXT DEFAULT 'ACTIVE',
            phone TEXT,
            hire_date DATETIME,
            bg_check TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Referrals Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS referrals (
            id TEXT PRIMARY KEY,
            participant_name TEXT,
            status TEXT DEFAULT 'RECEIVED',
            welcome_call_deadline DATETIME,
            orientation_deadline DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Case Notes Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS case_notes (
            id TEXT PRIMARY KEY,
            participant_id TEXT,
            encounter_type TEXT,
            narrative TEXT,
            author_id TEXT,
            status TEXT DEFAULT 'SIGNED',
            signature_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Budgets Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS budgets (
            participant_id TEXT PRIMARY KEY,
            authorized_amount REAL,
            paid_amount REAL,
            pending_amount REAL,
            cost_share_status TEXT,
            plan_year TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // EVV Visits Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS evv_visits (
            id TEXT PRIMARY KEY,
            worker_id TEXT,
            participant_id TEXT,
            service_code TEXT,
            clock_in DATETIME,
            clock_out DATETIME,
            lat REAL,
            lng REAL,
            status TEXT DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Claims Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS claims (
            id TEXT PRIMARY KEY,
            batch_id TEXT,
            participant_id TEXT,
            total_amount REAL,
            compliance_score INTEGER DEFAULT 100,
            audit_warnings TEXT, -- JSON array of detected anomalies
            status TEXT DEFAULT 'GENERATED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Incidents Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            type TEXT,
            status TEXT DEFAULT 'ACTIVE',
            narrative TEXT,
            reported_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Leads Table (CRM)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS leads (
            id TEXT PRIMARY KEY,
            name TEXT,
            source TEXT,
            stage TEXT DEFAULT 'NEW',
            priority TEXT DEFAULT 'MEDIUM',
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Prior Authorizations Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS prior_authorizations (
            id TEXT PRIMARY KEY,
            participant_id TEXT,
            service_code TEXT,
            requested_units INTEGER,
            status TEXT DEFAULT 'PENDING_DHS',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Documents Table (Vault & AI Audit Shield)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            participant_id TEXT,
            category TEXT,
            filename TEXT,
            content_base64 TEXT,
            is_signed BOOLEAN DEFAULT 0,
            expiration_date DATETIME,
            compliance_status TEXT DEFAULT 'PENDING_AUDIT',
            audit_reason TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Digital Forms Tracking Table
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS forms (
            id TEXT PRIMARY KEY,
            entity_id TEXT, -- Participant or Worker ID
            entity_type TEXT, -- 'PARTICIPANT' | 'WORKER'
            form_code TEXT, -- e.g., 'F-01201'
            status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SIGNED', 'SUBMITTED'
            signature_data TEXT, -- Base64 signature
            data_json TEXT, -- Captured form data stored as JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // System Alerts Table (Phase 15)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            severity TEXT, -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'
            title TEXT,
            message TEXT,
            type TEXT, -- 'SECURITY' | 'CLINICAL' | 'BILLING'
            status TEXT DEFAULT 'NEW', -- 'NEW' | 'ACKNOWLEDGED' | 'DISMISSED'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Phase 25: User Management (Hardened identity)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            role TEXT, -- 'ADRC_AGENT' | 'ICA_CONSULTANT' | 'SDPC_NURSE' | 'FEA_SPECIALIST' | 'ADMIN'
            password_hash TEXT,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Performance & Accountability Indexes
        databaseInstance.run(`CREATE INDEX IF NOT EXISTS idx_participants_mci ON participants(mci_id)`);
        databaseInstance.run(`CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)`);
        databaseInstance.run(`CREATE INDEX IF NOT EXISTS idx_claims_batch ON claims(batch_id)`);
        databaseInstance.run(`CREATE INDEX IF NOT EXISTS idx_assessments_participant ON assessments(participant_id)`);

        // Clinical Progress Notes Table (Phase 18)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS progress_notes (
            id TEXT PRIMARY KEY,
            participant_id TEXT,
            author_id TEXT,
            content TEXT, -- Full Transcript
            summary TEXT, -- AI Summary
            action_items TEXT, -- JSON Array of Tasks
            risk_assessment TEXT, -- AI Risk Evaluation
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // API Keys Table (Phase 16.5)
        databaseInstance.run(`CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            key_hash TEXT,
            permissions TEXT DEFAULT 'READ_ONLY',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Mock Seed Data (if empty)
        databaseInstance.get("SELECT COUNT(*) as count FROM referrals", (err, row) => {
            if (row && row.count === 0) {
                console.log("[DATABASE] Seeding initial mock data...");
                databaseInstance.run(`INSERT INTO referrals (id, participant_name, status, welcome_call_deadline, orientation_deadline) 
                        VALUES ('REF-001', 'Alice Johnson', 'RECEIVED', datetime('now', '+2 days'), NULL)`);
                databaseInstance.run(`INSERT INTO referrals (id, participant_name, status, welcome_call_deadline, orientation_deadline) 
                        VALUES ('REF-002', 'Bob Smith', 'WELCOME_CALL_LOGGED', NULL, datetime('now', '+30 days'))`);
            }
        });

        // Seed API Key for testing
        databaseInstance.get("SELECT COUNT(*) as count FROM api_keys", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO api_keys (name, key_hash, permissions) VALUES ('WELLSKY_INTEGRATION', 'iris_sk_test_w3llsky', 'READ_ONLY')`);
            }
        });

        databaseInstance.get("SELECT COUNT(*) as count FROM leads", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO leads (id, name, source, stage, priority, date) VALUES ('LD-101', 'James Wilson', 'ADRC_MILWAUKEE', 'NEW', 'HIGH', '2026-04-12')`);
                databaseInstance.run(`INSERT INTO leads (id, name, source, stage, priority, date) VALUES ('LD-102', 'Maria Garcia', 'HOSPITAL_DISCHARGE', 'CONTACTED', 'MEDIUM', '2026-04-14')`);
                databaseInstance.run(`INSERT INTO leads (id, name, source, stage, priority, date) VALUES ('LD-103', 'Robert Chen', 'WORD_OF_MOUTH', 'QUALIFIED', 'HIGH', '2026-04-15')`);
                databaseInstance.run(`INSERT INTO leads (id, name, source, stage, priority, date) VALUES ('LD-104', 'Sarah Miller', 'SOCIAL_MEDIA', 'NEW', 'LOW', '2026-04-16')`);
            }
        });

        databaseInstance.get("SELECT COUNT(*) as count FROM incidents", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO incidents (id, type, status, narrative, reported_at) VALUES ('INC-A1B2', 'ABUSE_NEGLECT', 'CRITICAL', 'Participant missing meds', '2026-04-15')`);
                databaseInstance.run(`INSERT INTO incidents (id, type, status, narrative, reported_at) VALUES ('INC-C3D4', 'MISAPPROPRIATION', 'HIGH', 'Missing funds from account', '2026-04-16')`);
            }
        });

        // Robust Seed Data for new UI
        databaseInstance.get("SELECT COUNT(*) as count FROM participants", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO participants (id, name, mci_id, county, ica, risk_level, anniversary_date, last_renewal_date) VALUES ('P-1001', 'Alice Johnson', ?, 'Milwaukee', 'Connections', 'MODERATE', '2026-06-15', '2025-06-15')`, [CryptoService.encrypt('MCI-8834721')]);
                databaseInstance.run(`INSERT INTO participants (id, name, mci_id, county, ica, risk_level, anniversary_date, last_renewal_date) VALUES ('P-1002', 'Robert Williams', ?, 'Dane', 'TMG', 'HIGH', '2026-05-01', '2025-05-01')`, [CryptoService.encrypt('MCI-9912044')]);
                databaseInstance.run(`INSERT INTO participants (id, name, mci_id, county, ica, risk_level, anniversary_date, last_renewal_date) VALUES ('P-1003', 'Carmen Reyes', ?, 'Waukesha', 'Connections', 'LOW', '2026-09-20', '2025-09-20')`, [CryptoService.encrypt('MCI-7741938')]);
            }
        });

        databaseInstance.get("SELECT COUNT(*) as count FROM workers", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO workers (id, name, participant_id, relationship, rate, weekly_hrs, status, phone, hire_date, bg_check) VALUES ('W-201', 'Jane Doe', 'P-1001', 'DAUGHTER', 18.50, 40, 'ACTIVE', '(414) 555-0102', '2025-06-15', 'CLEARED')`);
                databaseInstance.run(`INSERT INTO workers (id, name, participant_id, relationship, rate, weekly_hrs, status, phone, hire_date, bg_check) VALUES ('W-202', 'Michael Torres', 'P-1001', 'NON_RELATIVE', 16.00, 20, 'ACTIVE', '(414) 555-0234', '2025-09-01', 'CLEARED')`);
                databaseInstance.run(`INSERT INTO workers (id, name, participant_id, relationship, rate, weekly_hrs, status, phone, hire_date, bg_check) VALUES ('W-203', 'Lisa Smith', 'P-1002', 'NEIGHBOR', 17.50, 15, 'ACTIVE', '(608) 555-9988', '2026-01-10', 'CLEARED')`);
            }
        });

        databaseInstance.get("SELECT COUNT(*) as count FROM documents", (err, row) => {
            if (row && row.count === 0) {
                const dummyPDF = 'JVBERi0xLjQKJScAAAAr'; // Tiny dummy base64
                databaseInstance.run(`INSERT INTO documents (id, participant_id, category, filename, compliance_status, content_base64, uploaded_at) VALUES ('DOC-101', 'P-1001', 'F-00075', 'F-00075 Referral.pdf', 'VERIFIED', ?, '2026-04-10')`, [dummyPDF]);
                databaseInstance.run(`INSERT INTO documents (id, participant_id, category, filename, compliance_status, content_base64, uploaded_at) VALUES ('DOC-102', 'P-1002', 'F-01293', 'F-01293 Choice.pdf', 'MISSING_SIGNATURE', ?, '2026-04-12')`, [dummyPDF]);
                databaseInstance.run(`INSERT INTO documents (id, participant_id, category, filename, compliance_status, content_base64, uploaded_at) VALUES ('DOC-103', 'P-1001', 'F-01309', 'F-01309 Rights.pdf', 'VERIFIED', ?, '2026-04-14')`, [dummyPDF]);
                databaseInstance.run(`INSERT INTO documents (id, participant_id, category, filename, compliance_status, content_base64, uploaded_at) VALUES ('DOC-104', 'P-1003', 'F-01201A', 'F-01201A ISSP.pdf', 'VERIFIED', ?, '2026-04-15')`, [dummyPDF]);
            }
        });

        databaseInstance.get("SELECT COUNT(*) as count FROM prior_authorizations", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO prior_authorizations (id, participant_id, service_code, requested_units, status, created_at) VALUES ('PA-991', 'P-1001', 'T1019 - Personal Care', 120, 'APPROVED', '2026-04-01')`);
                databaseInstance.run(`INSERT INTO prior_authorizations (id, participant_id, service_code, requested_units, status, created_at) VALUES ('PA-992', 'P-1001', 'S5125 - Attendant Care', 60, 'PENDING_DHS', '2026-04-10')`);
            }
        });

        databaseInstance.get("SELECT COUNT(*) as count FROM budgets", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO budgets (participant_id, authorized_amount, paid_amount, pending_amount, cost_share_status, plan_year) VALUES ('P-1001', 48500, 32100, 5400, 'PAID', '2026')`);
                databaseInstance.run(`INSERT INTO budgets (participant_id, authorized_amount, paid_amount, pending_amount, cost_share_status, plan_year) VALUES ('P-1002', 65000, 15000, 2000, 'UNPAID', '2026')`);
            }
        });

        // Seed Digital Forms
        databaseInstance.get("SELECT COUNT(*) as count FROM forms", (err, row) => {
            if (row && row.count === 0) {
                // Participant Forms for Alice
                databaseInstance.run(`INSERT INTO forms (id, entity_id, entity_type, form_code, status) VALUES ('FM-001', 'P-1001', 'PARTICIPANT', 'F-00075', 'SIGNED')`);
                databaseInstance.run(`INSERT INTO forms (id, entity_id, entity_type, form_code, status) VALUES ('FM-002', 'P-1001', 'PARTICIPANT', 'F-01201A', 'PENDING')`);
                databaseInstance.run(`INSERT INTO forms (id, entity_id, entity_type, form_code, status) VALUES ('FM-003', 'P-1001', 'PARTICIPANT', 'F-01309', 'PENDING')`);
                
                // Worker Forms for Jane Doe (P-1001)
                databaseInstance.run(`INSERT INTO forms (id, entity_id, entity_type, form_code, status) VALUES ('FM-004', 'W-201', 'WORKER', 'F-01201', 'PENDING')`);
                databaseInstance.run(`INSERT INTO forms (id, entity_id, entity_type, form_code, status) VALUES ('FM-005', 'W-201', 'WORKER', 'F-82064', 'PENDING')`);
                databaseInstance.run(`INSERT INTO forms (id, entity_id, entity_type, form_code, status) VALUES ('FM-006', 'W-201', 'WORKER', 'I-9', 'PENDING')`);
            }
        });

        // Seed Phase 21: Clinical Assessments
        databaseInstance.get("SELECT COUNT(*) as count FROM assessments", (err, row) => {
            if (row && row.count === 0) {
                // Alice (HIGH risk) → 60-day cycle, due soon
                const due1 = new Date(); due1.setDate(due1.getDate() + 5);
                databaseInstance.run(`INSERT INTO assessments (id, participant_id, assessment_type, assigned_nurse_id, due_date, status) VALUES ('ASM-SEED-001', 'P-1001', '60_DAY', 'NURSE-R01', ?, 'SCHEDULED')`, [due1.toISOString()]);
                // Robert (HIGH risk) → 60-day cycle, overdue
                const due2 = new Date(); due2.setDate(due2.getDate() - 3);
                databaseInstance.run(`INSERT INTO assessments (id, participant_id, assessment_type, assigned_nurse_id, due_date, status) VALUES ('ASM-SEED-002', 'P-1002', '60_DAY', 'NURSE-R01', ?, 'OVERDUE')`, [due2.toISOString()]);
                // Carmen (LOW risk) → 90-day cycle, scheduled
                const due3 = new Date(); due3.setDate(due3.getDate() + 22);
                databaseInstance.run(`INSERT INTO assessments (id, participant_id, assessment_type, assigned_nurse_id, due_date, status) VALUES ('ASM-SEED-003', 'P-1003', '90_DAY', 'NURSE-R02', ?, 'SCHEDULED')`, [due3.toISOString()]);
                // Completed assessment for Alice (history)
                const comp1 = new Date(); comp1.setDate(comp1.getDate() - 55);
                databaseInstance.run(`INSERT INTO assessments (id, participant_id, assessment_type, assigned_nurse_id, due_date, completed_date, status) VALUES ('ASM-SEED-000', 'P-1001', '60_DAY', 'NURSE-R01', ?, ?, 'COMPLETED')`, [comp1.toISOString(), comp1.toISOString()]);
            }
        });

        // Seed Phase 21: Compliance Tasks
        databaseInstance.get("SELECT COUNT(*) as count FROM compliance_tasks", (err, row) => {
            if (row && row.count === 0) {
                const d1 = new Date(); d1.setDate(d1.getDate() + 8);
                databaseInstance.run(`INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status) VALUES ('CT-SEED-001', 'CONSULTANT-01', 'P-1001', 'MONTHLY_CONTACT', 'Monthly Contact: Alice Johnson', 'Complete required monthly face-to-face or phone contact with Alice Johnson. Document contact in clinical notes.', 'MEDIUM', ?, 'PENDING')`, [d1.toISOString()]);
                const d2 = new Date(); d2.setDate(d2.getDate() - 2);
                databaseInstance.run(`INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status) VALUES ('CT-SEED-002', 'CONSULTANT-01', 'P-1002', 'ISSP_REVIEW', 'ISSP Anniversary Review: Robert Williams', 'Robert Williams plan anniversary is 2026-05-01. Begin ISSP review and renewal process.', 'CRITICAL', ?, 'OVERDUE')`, [d2.toISOString()]);
                const d3 = new Date(); d3.setDate(d3.getDate() + 3);
                databaseInstance.run(`INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status) VALUES ('CT-SEED-003', 'CONSULTANT-01', 'P-1001', 'DOC_CHASE', 'Missing Form: F-01201A', 'Form F-01201A for Alice Johnson has been PENDING for over 30 days. Follow up to collect signature and complete submission.', 'HIGH', ?, 'PENDING')`, [d3.toISOString()]);
                const d4 = new Date(); d4.setDate(d4.getDate() + 5);
                databaseInstance.run(`INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status) VALUES ('CT-SEED-004', 'CONSULTANT-01', 'P-1001', 'WORKER_COMPLIANCE', 'BG Check Expiring: Jane Doe', 'Worker Jane Doe (W-201) background check expires in 30 days. Initiate re-check via WORCS.', 'HIGH', ?, 'PENDING')`, [d4.toISOString()]);
                const d5 = new Date(); d5.setDate(d5.getDate() + 2);
                databaseInstance.run(`INSERT INTO compliance_tasks (id, consultant_id, participant_id, task_type, title, description, priority, due_date, status) VALUES ('CT-SEED-005', 'CONSULTANT-01', 'P-1002', 'ASSESSMENT_FOLLOWUP', 'Assessment Overdue: Robert Williams', 'Robert Williams 60-day nursing assessment is past due. Coordinate with nursing staff to complete ASAP.', 'CRITICAL', ?, 'PENDING')`, [d5.toISOString()]);
            }
        });

        // Seed Users
        databaseInstance.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                databaseInstance.run(`INSERT INTO users (id, name, email, role, password_hash) VALUES ('USR-001', 'Sarah Jenkins', 'sarah.j@adrc.wi.gov', 'ADRC_AGENT', 'HASHED_PWD_123')`);
                databaseInstance.run(`INSERT INTO users (id, name, email, role, password_hash) VALUES ('USR-002', 'Mike Consultant', 'mike.c@connections.com', 'ICA_CONSULTANT', 'HASHED_PWD_456')`);
                databaseInstance.run(`INSERT INTO users (id, name, email, role, password_hash) VALUES ('USR-003', 'Nurse Betty', 'betty@sdpc-oversight.com', 'SDPC_NURSE', 'HASHED_PWD_789')`);
                databaseInstance.run(`INSERT INTO users (id, name, email, role, password_hash) VALUES ('USR-004', 'Alan Finance', 'alan.f@premier-fea.com', 'FEA_SPECIALIST', 'HASHED_PWD_000')`);
            }
        });
    });
}

/**
 * PROMISE_WRAPPERS: Standardized for Enterprise Reliability
 */
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        databaseInstance.all(sql, params, (err, rows) => {
            if (err) {
                console.error(`[DB_QUERY_ERROR] SQL: ${sql}`, err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        databaseInstance.run(sql, params, function(err) {
            if (err) {
                console.error(`[DB_RUN_ERROR] SQL: ${sql}`, err);
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};

module.exports = {
    db: databaseInstance, // raw instance for specialized use
    query,
    run
};
