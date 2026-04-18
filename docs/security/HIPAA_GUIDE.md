# IRIS Digital OS - HIPAA & Security Guide

## 1. Governance & Data Classification
The IRIS Digital OS handles Protected Health Information (PHI) and Personally Identifiable Information (PII), including:
- **Direct Identifiers:** SSN, MCI ID, Date of Birth, Full Name.
- **Health Data:** Long-Term Care Functional Screen (LTCFS) scores, ADL needs, Clinical Notes.
- **Financial Data:** Medicaid Cost Share amounts, Caregiver Payroll records.

## 2. Technical Safeguards (The "Rule of Three")

### A. Encryption at Rest & In-Transit
- **Field-Level Encryption:** Sensitive fields (SSN/MCI) are encrypted using AES-256 via `middleware/encryption.js` before hitting the database.
- **Transport Security:** All API traffic is forced over HTTPS (TLS 1.3). No plain-text data ever leaves the VPC.
- **Local Mobile Storage:** The EVV mobile app uses an encrypted SQLite instance (SQLCipher) for all offline data.

### B. Access Control (RBAC & Multi-Tenancy)
- **Tenant Isolation:** All queries are scoped by `tenant_id` via `middleware/tenant.js`. Connections ICA cannot access Premier FMS data.
- **Least Privilege:** IRIS Consultants have read-only access to payroll; Fiscal Agents have read-only access to case notes.
- **Auditor Access:** The Auditor Portal (Task 5.4) provides time-limited, read-only session tokens for state quality reviews.

### C. Immutable Audit Logs
- Every mutation (INSERT/UPDATE/DELETE) triggers a record in the `audit_logs` table.
- Logs include: `timestamp`, `user_id`, `action`, `old_value`, and `new_value`.
- **Integrity:** Audit logs are append-only. Deletion of logs is disabled at the database level for all users except the Super Admin.

## 3. Administrative Safeguards
- **BAA Ready:** The software is designed to operate under a Business Associate Agreement (BAA) with ICAs and FEAs.
- **Identity Matching:** The MCI Mock System (Task 7.5) emulates the state's "Golden Record" matching to prevent identity duplication errors.

## 4. Physical & Network Security
- **Hosting:** Recommended deployment on **AWS GovCloud** or **Azure Government**.
- **WAF Protection:** CloudFront/Cloudflare WAF is required to block SQL injection and cross-site scripting (XSS).
- **Incident Response:** The **24-Hour Incident Trigger** (Task 7.3) serves as the primary alert system for health and safety violations.

---
*Confidential - For Internal Engineering and Compliance Use Only.*
