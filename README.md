# IRIS Digital OS — Clinical Command Center

> A HIPAA-compliant, production-grade operating system for Wisconsin IRIS program administration. Designed for Fiscal Employer Agents (FEAs) and IRIS Consultant Agencies (ICAs).

---

## Table of Contents

1. [Project Vision](#-project-vision)
2. [Tech Stack](#-tech-stack)
3. [Quick Start](#-quick-start)
4. [Project Structure](#-project-structure)
5. [Module Registry](#-module-registry)
6. [API Reference](#-api-reference)
7. [Database Schema](#-database-schema)
8. [State Integration Strategy](#-state-integration-strategy)
9. [Document & PDF Pipeline](#-document--pdf-pipeline)
10. [Security & Compliance](#-security--compliance)
11. [Architecture Diagrams](#-architecture-diagrams)
12. [Implementation Roadmap](#-implementation-roadmap)
13. [Environment Variables](#-environment-variables)
14. [Contributing](#-contributing)

---

## 🚀 Project Vision

To digitize every aspect of the Wisconsin IRIS (Include, Respect, I Self-Direct) program—replacing legacy manual workflows, paper forms, and disconnected state portals with a unified, real-time, API-driven ecosystem.

**Who is this for?**
- **Fiscal Employer Agents (FEAs):** Companies like Public Partnerships (PPL) and Premier Financial Management Services that handle payroll, tax filings, and budget management for IRIS participants.
- **IRIS Consultant Agencies (ICAs):** Organizations like Connections Counseling and TMG that provide support coordination, care planning, and annual ISSP renewals.
- **ADRC Lead Hub**: High-fidelity intake and CRM for Aging and Disability Resource Centers, featuring an AI-guided Options Counseling Advisor.
- **Service Neutrality**: Multi-agency support for both Self-Directed (IRIS) and Managed Care (Family Care/MCO) models via a dynamic Program Context engine.
- **Compliance Form Engine**: Production-ready PDF mapping for official DHS forms (F-01201, F-00075, F-01022) with multi-signer electronic signature support.
- **Clinical Command Center**: Real-time auditing and risk monitoring for ICAs and FEAs.

**What problem does it solve?**
Wisconsin IRIS agencies currently rely on a patchwork of state systems (WISITS, ForwardHealth Portal, Sandata EVV), paper-based DHS forms (F-01201, F-82064, I-9), and disconnected spreadsheets. IRIS Digital OS consolidates all of these into a single clinical operating system with automated compliance, real-time budget monitoring, and AI-driven documentation.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 (TypeScript) | Single-page clinical shell with module-based routing |
| **Design System** | Inter + IBM Plex Sans (CSS Custom Properties) | Medical-grade typography with dark/light theme support |
| **Backend** | Node.js 18+ (Express 4.18) | RESTful API layer with middleware pipeline |
| **Primary Database** | SQLite3 (`iris_core.db`) | Operational data: participants, workers, budgets, visits, claims |
| **Audit Database** | SQLite3 (`audit.db`) | Immutable click-telemetry and security event log |
| **State Integration** | Sandata REST v2.5, X12 837P EDI, WORCS CSV | External data exchange with state databases |
| **Interoperability** | HL7 FHIR R4 (JSON) | Healthcare data exchange via Patient/Practitioner/Observation resources |
| **Security** | AES-256-GCM (Node `crypto`) | Field-level PHI encryption for SSN, MCI, and clinical identifiers |
| **PDF Engine** | `pdf-lib` (1.17) | Automated form filling and digital signature embedding |
| **RPA** | Playwright | Web scraping for WISITS state enrollment data |
| **AI/ML** | OpenAI API (GPT-4) | Clinical scribe, policy bot, compliance NLP auditor |

### Key Dependencies (`package.json`)
```
express ^4.18.2          — HTTP server and modular routing
express-async-errors     — Enhanced async error handling
morgan                   — HTTP request logging
sqlite3 ^6.0.1           — Embedded SQL database
pdf-lib ^1.17.1          — PDF form manipulation
helmet ^7.1.0            — HTTP security headers
cors ^2.8.5              — Cross-origin resource sharing
openai ^4.24.1           — AI/ML integration
redis ^4.6.10            — Service bus (event-driven architecture)
playwright ^1.40.1       — Browser automation for state portals
dotenv ^16.3.1           — Environment variable management
```

---

## 🏃 Quick Start

### Prerequisites
- Node.js ≥ 18.x
- npm ≥ 9.x
- (Optional) Redis server for Service Bus features

### Installation
```bash
# Clone the repository
git clone <repo-url> && cd iris-digital-os

# Install server dependencies
npm install

# Start the backend (Modular Architecture)
npm start
# Server starts on http://localhost:3100

# In a separate terminal, install and start the frontend
cd client/web_app
npm install
PORT=3000 npm start
# React app starts on http://localhost:3000
```

---

## 📂 Project Structure

```
/iris-os-fresh/
├── server/
│   └── src/
│       ├── config/           # Database initialization and configs
│       ├── controllers/      # Modular business logic
│       ├── middleware/       # Shared Express middlewares
│       ├── routes/           # RESTful API route definitions
│       ├── services/         # Orchestration and clinical services
│       ├── utils/            # Shared utilities (logger, etc.)
│       └── index.js          # Unified entry point
├── client/
│   └── web_app/              # Main React application
├── automation/               # State-portal scrapers & bots
├── database/                 # Raw SQL schemas
├── services/                 # Cross-platform core services
└── docs/                     # Architecture & Security documentation
```

### Verifying the Installation
```bash
# Health check
curl http://localhost:3100/health
# Expected: {"status":"active","domain":"IRIS_DIGITAL_OS","mode":"MOCK"}

# Fetch participants
curl http://localhost:3100/api/v1/case/participants
# Expected: JSON array of seeded participants
```

### Development Mode
```bash
# Auto-reload server on file changes
npm run dev

# Run the WISITS state enrollment scraper
npm run scrape
```

---

## 📁 Project Structure

```
iris-digital-os/
│
├── client/web_app/src/                    # FRONTEND (React 18 + TypeScript)
│   ├── App.tsx                            # Root shell: sidebar nav, module routing, RBAC
│   ├── index.css                          # Design system tokens (colors, fonts, spacing)
│   ├── styles.css                         # Component-level styles
│   │
│   ├── modules/                           # Page-level feature modules
│   │   ├── AdminModule.tsx                # Enterprise dashboard, RBAC, click-telemetry
│   │   ├── AISuiteModule.tsx              # Clinical AI-Scribe & SDOH risk profiling
│   │   ├── BillingModule.tsx              # 837P EDI generation, CMS-1500 mapping
│   │   ├── CaseMgmtModule.tsx             # 4-tab hub: Overview, Narrative, Budget, ISSP
│   │   ├── ClaimsAutomatorModule.tsx      # Automated claim processing with integrity checks
│   │   ├── DocumentVaultModule.tsx        # Encrypted document repository
│   │   ├── EVVModule.tsx                  # GPS-verified clock-in/out with Sandata sync
│   │   ├── FinancialsModule.tsx           # Payroll ledger, cost-share, ACH/Plaid mock
│   │   ├── IncidentModule.tsx             # 24-hour incident reporting (abuse/neglect)
│   │   ├── IntakeModule.tsx               # New participant referral intake wizard
│   │   ├── IntegrityModule.tsx            # Fraud detection & audit scorecards
│   │   ├── InteropModule.tsx              # FHIR R4 interoperability dashboard
│   │   ├── MarketingModule.tsx            # CRM: Kanban + Grid lead management
│   │   ├── OnboardingModule.tsx           # Worker hiring wizard (PFMS, BID, WORCS)
│   │   ├── OpsModule.tsx                  # Star-rating predictor, 40-hour exception
│   │   ├── RenewalModule.tsx              # 365-day ISSP/LTC-FS renewal tracker
│   │   ├── ReportsModule.tsx              # Analytics & reporting dashboard
│   │   ├── SchedulingModule.tsx           # Shift calendar and management
│   │   ├── SettingsModule.tsx             # Typography, encryption config, branding
│   │   ├── StateBridgeModule.tsx          # Legacy state portal bridge
│   │   ├── StateComplianceModule.tsx      # DHS compliance validation engine
│   │   ├── SupportModule.tsx              # Help desk & knowledge base
│   │   └── WorkerPortalModule.tsx         # Mobile-optimized caregiver view
│   │
│   ├── components/                        # Shared UI components
│   │   ├── BudgetTracker.tsx              # Burn-rate analytics widget
│   │   ├── EVVLocationMap.tsx             # GPS satellite HUD with geofence overlay
│   │   ├── FormComplianceHub.tsx          # Document Debt dashboard + bulk actions
│   │   ├── FormViewerModal.tsx            # PDF viewer with signature pad
│   │   └── IntakeQuestionnaire.tsx        # Smart onboarding form
│   │
│   └── contexts/
│       └── UserContext.tsx                # RBAC: role-based UI filtering
│
├── server/                                # BACKEND (Node.js + Express)
│   ├── index.js                           # Express app: all route definitions
│   │
│   ├── controllers/                       # Request handlers (thin layer → delegates to services)
│   │   ├── adminController.js             # Dashboard stats, RBAC, click-telemetry
│   │   ├── alertController.js             # Security alert lifecycle
│   │   ├── auditorController.js           # AI audit, policy bot, voice scribe
│   │   ├── billingController.js           # 837P batch submission, CMS-1500
│   │   ├── caregiverController.js         # Worker profile management
│   │   ├── caseController.js              # Clinical narrative, budget, ISSP
│   │   ├── documentController.js          # Document vault CRUD + Document Debt audit
│   │   ├── evvController.js               # GPS-verified clock events + Sandata sync
│   │   ├── formController.js              # Digital form lifecycle (sign, download PDF)
│   │   ├── incidentController.js          # Incident reporting (abuse/neglect triggers)
│   │   ├── interopController.js           # FHIR R4 export + legacy EHR sync
│   │   ├── marketingController.js         # CRM lead lifecycle + analytics
│   │   ├── onboardingController.js        # PFMS intake wizard, DHS form download
│   │   ├── paController.js               # Prior Authorization tracking
│   │   ├── scribeController.js            # Clinical AI-Scribe audio→SOAP pipeline
│   │   ├── securityController.js          # Audit log read/write
│   │   └── vaultController.js             # Encrypted binary access for PHI documents
│   │
│   ├── services/                          # Business logic layer
│   │   ├── ai/                            # AI & Machine Learning
│   │   │   ├── compliance_auditor.js      # NLP scan for "Person-Centered" keywords
│   │   │   ├── fraud_engine.js            # Visit anomaly detection (ghost billing)
│   │   │   ├── integrity_service.js       # Budget burn-rate profiling
│   │   │   ├── justification_engine.js    # OTE clinical justification generator
│   │   │   ├── policy_bot.js              # P-00708 policy Q&A bot
│   │   │   ├── sdoh_service.js            # Social determinants risk flagging
│   │   │   └── voice_scribe.js            # Ambient audio → structured SOAP notes
│   │   │
│   │   ├── analytics/
│   │   │   ├── reporting_service.js       # Dashboard analytics aggregation
│   │   │   └── snowflake_sync.js          # Data warehouse sync with PII masking
│   │   │
│   │   ├── clinical/
│   │   │   └── scribe_service.js          # Clinical progress note orchestration
│   │   │
│   │   ├── compliance/                    # State & federal compliance
│   │   │   ├── audit_service.js           # AI document scanner simulation
│   │   │   ├── background_check_service.js # WORCS/BID background check logic
│   │   │   ├── compliance_engine.js       # P-00708 hard-block budget guardrails
│   │   │   ├── compliance_pdf_service.js  # DHS + Federal form PDF generator
│   │   │   ├── document_lifecycle_service.js # Document Debt tracking engine
│   │   │   ├── enrollment_bot.js          # Automated ForwardHealth enrollment
│   │   │   ├── fhir_adapter.js            # HL7 FHIR 4.0 resource mapper
│   │   │   ├── geo_service.js             # Point-in-polygon geofence compliance
│   │   │   ├── pfms_mapper.js             # DHS XFA + Federal I-9/W-2 field mapping
│   │   │   ├── renewal_service.js         # 365-day ISSP renewal logic
│   │   │   ├── sandata_proxy.js           # Sandata v2.5 REST client
│   │   │   ├── sandata_validator.js       # Pre-submission validation rules
│   │   │   ├── verify_fhir.js             # FHIR resource validation
│   │   │   └── worcs_service.js           # Wisconsin background check automation
│   │   │
│   │   ├── financials/                    # Billing & claims
│   │   │   ├── billing_audit_service.js   # Pre-claim audit logic
│   │   │   ├── claim_engine.js            # Automated claim adjudication
│   │   │   ├── claim_schema.js            # X12 837P segment definitions
│   │   │   ├── cms1500_mapper.js          # CMS-1500 paper claim field mapper
│   │   │   ├── cms1500_service.js         # CMS-1500 PDF generation
│   │   │   ├── edi_service.js             # HIPAA 837P EDI X12 generator
│   │   │   ├── state_xml_service.js       # LTC-IES encounter XML generator
│   │   │   └── work_order_service.js      # Service authorization management
│   │   │
│   │   ├── orchestration/                 # System coordination
│   │   │   ├── fea_monitor_service.js     # FEA payroll health monitoring
│   │   │   ├── migration_service.js       # Legacy system data importer
│   │   │   ├── packet_export_service.js   # Clinical packet ZIP generator
│   │   │   ├── referral_intake_service.js # State referral CSV ingestion
│   │   │   ├── sandata_api_service.js     # Sandata Open EVV API client
│   │   │   ├── service_bus.js             # Redis-backed event publisher
│   │   │   └── state_gateway.js           # Managed state API persistence layer
│   │   │
│   │   ├── pdf_engine/
│   │   │   └── mapping_service.js         # Generic PDF field mapper
│   │   │
│   │   └── security/                      # HIPAA & audit
│   │       ├── alert_service.js           # Automated threat detection rules
│   │       ├── audit_service.js           # Immutable audit log writer
│   │       ├── crypto_service.js          # AES-256-GCM field-level encryption
│   │       └── email_service.js           # Notification service
│   │
│   ├── middleware/                         # Express middleware pipeline
│   │   ├── apiKeyAuth.js                  # API key validation for external consumers
│   │   ├── audit.js                       # Request/response audit logger
│   │   ├── encryption.js                  # Auto-encrypt/decrypt PHI fields
│   │   ├── tenant.js                      # Multi-tenant data isolation (X-Tenant-Id)
│   │   └── validation.js                  # Input sanitization
│   │
│   ├── database/
│   │   ├── database.js                    # SQLite connection + schema init + seed data
│   │   ├── iris_core.db                   # Primary operational database
│   │   └── audit.db                       # Immutable audit log database
│   │
│   └── db/
│       └── schema.sql                     # Reference SQL schema
│
├── services/                              # External microservices (standalone)
│   ├── tax_engine/engine.js               # FICA/FUTA/SUTA calculation engine
│   ├── payroll/payroll_ledger.js           # Real-time net pay calculator
│   ├── fintech/wages_now.js               # Daily pay (instant caregiver liquidity)
│   ├── financials/burn_rate_service.js     # Budget burn-rate forecast
│   └── compliance/sandata_proxy.js        # Alternate Sandata client
│
├── automation/                            # RPA & validation scripts
│   ├── wisits_scraper.js                  # Playwright bot for WISITS data ingestion
│   ├── pcst_bot.js                        # Playwright bot for state portal PCST submission
│   └── dhs105_validator.js                # NPI/ForwardHealth enrollment validator
│
├── tests/                                 # E2E & Unit Tests
│   └── e2e/
│       └── test_organizations.py          # Organization Portal Validation (Playwright)
│
├── docs/                                  # Technical documentation
│   ├── architecture/
│   │   ├── ENTERPRISE_MAP.md              # System architecture diagrams
│   │   └── COMPETITOR_BENCHMARK.md        # Feature comparison vs PPL, TMG, iLIFE
│   ├── compliance/                        # DHS/CMS compliance notes
│   ├── security/
│   │   └── HIPAA_GUIDE.md                 # HIPAA technical safeguards reference
│   └── SERVICE_INVENTORY.md               # Master component registry
│
├── data/                                  # Data files & templates
├── TASK.md                                # Current development task tracker
├── IMPLEMENTATION_PLAN.md                 # Active implementation plan
├── WALKTHROUGH.md                         # Latest change walkthrough
└── PITCH.md                               # Business pitch document
```

---

## 📦 Module Registry

### Core Clinical Suite
| Module | File | Description |
|--------|------|-------------|
| **Case Management** | `CaseMgmtModule.tsx` | 4-tab clinical hub: Operations Overview → participant roster with risk indicators. Clinical Narrative → immutable, SHA-256 signed progress notes. Budget Intelligence → burn-rate analytics with predictive overspend forecasting. Digital ISSP Manager → service authorization tracking within LTC-FS budget limits. |
| **EVV Logistics** | `EVVModule.tsx` | Electronic Visit Verification with GPS telemetry HUD. Satellite-style map with geofence verification. Real-time accuracy indicators. Automatic Sandata v2.5 sync on verified visits. |
| **Onboarding** | `OnboardingModule.tsx` | Automated PFMS intake wizard. Downloads and pre-fills DHS forms (F-01201 Worker Set-Up, F-82064 Background Disclosure). Includes WORCS/BID background check automation. |
| **Financials** | `FinancialsModule.tsx` | Payroll ledger with tax engine (automatic FICA/FUTA exemptions for family relationships). Cost-share tracking. Mock ACH/Plaid payment flow. |
| **Billing** | `BillingModule.tsx` | HIPAA 837P EDI X12 claim generator. CMS-1500 paper claim mapper. Pre-claim audit step that validates visit data against DHS P-00708 budget rules before submission. |

### Interoperability & Data Exchange (Cures Act Compliant)
| Feature | Implementation | Description |
|---------|----------------|-------------|
| **FHIR R4 Hub** | `interopController.js` | Full HL7 FHIR R4 implementation for Patient, Practitioner, CarePlan, and Observation resources. Supports JSON and XML formats for HIE integration. |
| **Stitch HIE Sync** | `stitch_service.js` | Secure, HIPAA-compliant clinical record exchange with regional HIEs utilizing the Stitch Health API gateway. |
| **EHI Export** | `packet_export_service.js` | Automated "Electronic Health Information" export as required by the 21st Century Cures Act. Generates encrypted, machine-readable packets of all participant clinical data. |
| **State Gateway** | `state_gateway.js` | High-reliability persistent queue for state API transmissions (Sandata, ForwardHealth, WORCS). |
| **EDI Engine** | `edi_837p_service.js` | Native generation of X12 837P Professional claims for direct Medicaid billing. |

### Administrative Suite
| Module | File | Description |
|--------|------|-------------|
| **Admin** | `AdminModule.tsx` | Enterprise dashboard with live SQL-aggregated stats. RBAC role-switcher. System Interaction Explorer (click-telemetry). Security alert management. |
| **Settings** | `SettingsModule.tsx` | Typography selection (Inter / IBM Plex Sans). Encryption key configuration. Audit log viewer. |

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`. The server runs in **Mock Mode** by default—no external state connections are required.

### Authentication
- **Internal UI:** No auth required in mock mode. In production, use session-based auth.
- **External API consumers:** Must provide `X-API-Key` header (validated via `apiKeyAuth.js` middleware).
- **Tenant isolation:** All requests should include `X-Tenant-Id` header (e.g., `CONNECTIONS_ICA` or `PREMIER_FMS`).

### Core Endpoints

| Method | Endpoint | Controller | Description |
|--------|----------|------------|-------------|
| `GET` | `/health` | — | Server health check |
| `GET` | `/api/v1/admin/stats` | `adminController` | System-wide aggregate statistics |

### Onboarding & Enrollment
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/onboarding/participant` | Submit new participant enrollment |
| `POST` | `/api/v1/onboarding/pfms-intake` | PFMS automated intake wizard submission |
| `GET` | `/api/v1/onboarding/referrals` | List all referrals with deadline tracking |
| `POST` | `/api/v1/onboarding/finalize` | Finalize onboarding and trigger worker setup |
| `GET` | `/api/v1/onboarding/status/:workerId` | Public hiring progress tracker |
| `POST` | `/api/v1/onboarding/bid` | Submit Background Information Disclosure |
| `POST` | `/api/v1/onboarding/download-dhs/:formType` | Generate and download filled DHS PDF |
| `POST` | `/api/v1/compliance/enroll` | Auto-enroll worker in ForwardHealth Portal |

### EVV & Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/evv/submit` | Submit GPS-verified clock event |
| `POST` | `/api/v1/billing/batch` | Submit 837P EDI batch claim |
| `POST` | `/api/v1/billing/reconcile` | Process 835 remittance advice |
| `GET` | `/api/v1/billing/pending` | List pending claims |
| `POST` | `/api/v1/billing/automate` | Trigger automated claim processing |
| `POST` | `/api/v1/billing/download-cms1500/:claimId` | Download CMS-1500 paper claim PDF |

### Case Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/case/participants` | List all active participants |
| `GET` | `/api/v1/case/workers/:participantId` | List workers for a participant |
| `GET` | `/api/v1/case/notes/:participantId` | Fetch signed clinical notes |
| `POST` | `/api/v1/case/notes` | Create and sign a new clinical note |
| `GET` | `/api/v1/case/budget/:participantId` | Get budget burn-rate data |
| `GET` | `/api/v1/case/renewals/:participantId` | Get ISSP renewal timeline |
| `GET` | `/api/v1/case/pa/:participantId` | List Prior Authorizations |
| `POST` | `/api/v1/case/pa` | Submit new PA request |

### Document Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/documents` | List all documents (vault view) |
| `GET` | `/api/v1/documents/:participantId` | Documents for a specific participant |
| `POST` | `/api/v1/documents/upload` | Upload document with auto AI-audit |
| `POST` | `/api/v1/documents/audit` | Trigger manual AI compliance scan |
| `GET` | `/api/v1/documents/preclaim/:participantId` | Pre-claim document audit |
| `GET` | `/api/v1/compliance/debt/:id?type=WORKER` | Document Debt health score |

### Digital Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/forms/:entityId` | Get required forms for entity |
| `POST` | `/api/v1/forms/sign` | Submit digital signature |
| `GET` | `/api/v1/forms/download/:formId` | Download filled PDF with signature |

### AI & Clinical Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/ai/audit` | NLP compliance audit on clinical note |
| `POST` | `/api/v1/ai/generate-ote` | Generate OTE clinical justification |
| `POST` | `/api/v1/ai/policy-ask` | P-00708 policy question answering |
| `POST` | `/api/v1/ai/scribe` | Process voice recording → SOAP note |
| `POST` | `/api/v1/ai/integrity` | Audit a progress note for integrity |
| `POST` | `/api/v1/incidents/sdoh` | Analyze text for SDOH risk factors |
| `POST` | `/api/v1/clinical/scribe/process` | Full clinical scribe session processing |
| `POST` | `/api/v1/clinical/scribe/save` | Persist AI-generated progress note |
| `GET` | `/api/v1/clinical/scribe/notes/:participantId` | Fetch scribe-generated notes |

### Interoperability (FHIR R4) — Requires API Key
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/interop/fhir/Bundle/:participantId` | Export full FHIR Patient Bundle (JSON/XML) |
| `GET` | `/api/v1/interop/fhir/:resourceType/:id` | Get specific FHIR resource (Patient, Practitioner, etc.) |
| `POST` | `/api/v1/interop/stitch/sync/:participantId` | Sync clinical record with HIE via Stitch |

### Data Exchange (EHI / Cures Act) — Requires API Key
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/interop/ehi/export/:participantId` | Full EHI Clinical Export (Cures Act compliant) |
| `POST` | `/api/v1/billing/batch` | Submit 837P EDI batch claim to state |

### Marketing & Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/marketing/leads` | List CRM leads |
| `POST` | `/api/v1/marketing/leads/convert` | Convert lead to participant |
| `GET` | `/api/v1/marketing/analytics` | CRM conversion analytics |
| `GET` | `/api/v1/ops/star-rating` | Real-time IC star rating |
| `POST` | `/api/v1/ops/justification` | Generate 40-hour exception text |
| `GET` | `/api/v1/ops/fea-health` | FEA payroll health check |

### Security & Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/security/audit` | Log a user action to audit trail |
| `GET` | `/api/v1/security/audit` | Retrieve audit log entries |
| `GET` | `/api/v1/alerts` | List active security alerts |
| `PATCH` | `/api/v1/alerts/:id` | Acknowledge or dismiss an alert |

---

## 🗄 Database Schema

The primary database (`iris_core.db`) contains these tables, auto-created on startup by `database.js`:

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `participants` | `id`, `name`, `mci_id` (encrypted), `county`, `ica`, `risk_level`, `anniversary_date` | IRIS program participants (the "employers") |
| `workers` | `id`, `name`, `participant_id`, `relationship`, `rate`, `bg_check` | Hired caregivers (the "employees") |
| `referrals` | `id`, `participant_name`, `status`, `welcome_call_deadline` | Referral intake pipeline |
| `case_notes` | `id`, `participant_id`, `narrative`, `signature_hash` | Immutable clinical progress notes |
| `budgets` | `participant_id`, `authorized_amount`, `paid_amount`, `pending_amount` | Annual budget tracking |
| `evv_visits` | `id`, `worker_id`, `participant_id`, `clock_in`, `clock_out`, `lat`, `lng` | GPS-verified service visits |
| `claims` | `id`, `batch_id`, `total_amount`, `compliance_score`, `audit_warnings` | Billing claims (837P/CMS-1500) |
| `prior_authorizations` | `id`, `participant_id`, `service_code`, `requested_units`, `status` | DHS PA tracking |
| `documents` | `id`, `participant_id`, `category`, `filename`, `compliance_status` | Document vault with AI audit status |
| `forms` | `id`, `entity_id`, `entity_type`, `form_code`, `status`, `signature_data` | Digital form lifecycle tracking |
| `incidents` | `id`, `type`, `status`, `narrative` | Abuse/neglect incident reports |
| `leads` | `id`, `name`, `source`, `stage`, `priority` | Marketing CRM leads |
| `alerts` | `id`, `severity`, `title`, `message`, `type`, `status` | System security alerts |
| `progress_notes` | `id`, `participant_id`, `content`, `summary`, `action_items`, `risk_assessment` | AI-generated clinical notes |
| `api_keys` | `id`, `name`, `key_hash`, `permissions` | API key management for external consumers |
| `state_transmissions` | `id`, `service_type`, `payload`, `status`, `attempts`, `last_error` | StateGateway persistence queue |

### Seed Data
On first startup, `database.js` seeds realistic mock data including 3 participants, 3 workers, 4 leads, 2 incidents, referrals, budget records, prior authorizations, documents, and digital forms. This allows full-stack development without external dependencies.

---

## 🌐 State Integration Strategy

IRIS Digital OS connects to Wisconsin state databases through a **StateGateway Architecture** — a managed persistence layer that queues, retries, and tracks all external transmissions.

### Sandata EVV (Visit Verification)
- **Protocol:** REST API v2.5 (Wisconsin DHS Addendum)
- **Auth:** HTTP Basic Auth + Account header
- **Endpoints:**
  - Production: `https://api.sandata.com/interfaces/intake/visits/rest/api/v1.1`
  - UAT: `https://uat-api.sandata.com/interfaces/intake/visits/rest/api/v1.1`
- **Implementation:** `sandata_proxy.js` maps IRIS visits to the exact JSON schema from the v2.5 spec (ProviderIdentification, Calls segment for electronic visits, AdjInDateTime/AdjOutDateTime for manual entries, VisitChanges for edits).
- **Key fields:** `EmployeeQualifier: "EmployeeCustomID"`, `PayerProgram: "WIIRISFEA"`, `ProcedureCode: T1019/S5125`

### ForwardHealth (Medicaid Claims)
- **Protocol:** X12 837P EDI via SFTP (simulated)
- **Implementation:** `edi_service.js` generates HIPAA-compliant 837P segments. `state_gateway.js` handles queuing for SFTP upload.
- **NPI Validation:** Real-time lookup against CMS NPPES Registry API before claim submission.

### WORCS (Background Checks)
- **Protocol:** CSV batch upload (simulated)
- **Implementation:** `worcs_service.js` + `background_check_service.js` generate the Wisconsin DQA-compliant CSV format.
- **Fields:** FirstName, LastName, DOB, Race, Sex, SSN

### ForwardHealth Portal (Enrollment)
- **Protocol:** Web scraping via Playwright
- **Implementation:** `enrollment_bot.js` automates the ForwardHealth provider enrollment workflow.

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────────┐
│   EVV Visit  │────▶│   StateGateway     │────▶│  Sandata v2.5   │
│   Verified   │     │   (Persistent DB)  │     │  REST API       │
└──────────────┘     │                    │     └─────────────────┘
                     │  ┌──────────────┐  │     ┌─────────────────┐
                     │  │ Retry Logic  │  │────▶│  ForwardHealth  │
                     │  │ 5 attempts   │  │     │  SFTP (837P)    │
                     │  └──────────────┘  │     └─────────────────┘
                     │                    │     ┌─────────────────┐
                     │  ┌──────────────┐  │────▶│  WORCS/DQA      │
                     │  │ Telemetry UI │  │     │  CSV Upload     │
                     │  └──────────────┘  │     └─────────────────┘
                     └───────────────────┘
```

---

## 📄 Document & PDF Pipeline

IRIS OS solves the "document debt" problem — the industry-wide challenge of tracking paper forms across participants and workers.

### Supported Forms

| Form Code | Name | Entity | Source |
|-----------|------|--------|--------|
| `F-01201` | IRIS PHW Set-Up | Worker | Wisconsin DHS |
| `F-01201A` | IRIS ISSP (Individual Service & Support Plan) | Participant | Wisconsin DHS |
| `F-82064` | Background Information Disclosure (BID) | Worker | Wisconsin DHS |
| `F-00075` | IRIS Authorization | Participant | Wisconsin DHS |
| `F-01309` | Participant Rights | Participant | Wisconsin DHS |
| `F-01293` | FEA Transfer Checklist | Participant | Wisconsin DHS |
| `I-9` | Employment Eligibility Verification | Worker | Federal (USCIS) |
| `W-2` | Wage and Tax Statement | Worker | Federal (IRS) |

### How the Pipeline Works

1. **Data Mapping** (`pfms_mapper.js`): Raw participant/worker data from SQLite is mapped to exact PDF field IDs (e.g., `PARTICIPANT_NAME`, `WORKER_SSN`, `LName` for I-9).
2. **PDF Generation** (`compliance_pdf_service.js`): Uses `pdf-lib` to either fill an official template PDF or generate a manifest document if the template is not yet available.
3. **Signature Embedding**: Digital signatures captured in the browser are embedded as PNG images on the last page of the PDF.
4. **Lifecycle Tracking** (`document_lifecycle_service.js`): Monitors expiration (F-82064 = 4 years, W-2/ISSP = annual) and flags missing documents.
5. **Health Score**: The `FormComplianceHub.tsx` component displays a percentage score with color coding (Green ≥100%, Yellow ≥60%, Red <60%).
6. **Automated Publishing**: Once a digital form is signed, the system automatically flattens, encodes, and publishes the immutable PDF artifact to the Clinical Document Vault for long-term audit readiness.

### High-Fidelity Viewing Strategy
IRIS OS supports two distinct PDF viewing modes, configurable via vault settings:
- **NATIVE Mode**: Leverages the browser's built-in PDF engine for maximum security and zero-JS processing.
- **CUSTOM Mode**: Provides a premium, branded viewing experience with custom zoom, rotation, and navigation controls.

---

## 🏛 Clinical Document Vault
The Document Vault acts as the single source of truth for all clinical and employment records. It features:
- **Real-time Scoring**: Instant compliance health check on every uploaded file.
- **Secure Stream**: Documents are served via a transient base64-to-stream pipeline, ensuring PHI never touches the browser's persistent cache in plaintext.
- **Audit Shield**: Seamlessly linked to the AI Audit Shield for automatic field-level validation and signature detection.

### PII Security During PDF Generation
SSN and MCI data is stored encrypted (AES-256-GCM) in the database. It is decrypted only at the moment of PDF generation ("Transient Buffer Mapping") and never written to disk in plaintext.

---

## 🔐 Security & Compliance

### HIPAA Technical Safeguards

| Control | Implementation | File |
|---------|---------------|------|
| **PHI Encryption** | AES-256-GCM field-level encryption for SSN and MCI | `crypto_service.js` |
| **Key Format** | `[IV(hex)]:[AuthTag(hex)]:[CipherText(hex)]` | `crypto_service.js` |
| **Audit Trail** | Every user action (button click, form view) logged to `audit.db` | `audit.js` middleware |
| **Note Immutability** | Signed clinical notes receive SHA-256 hash; editing disabled post-signature | `caseController.js` |
| **Multi-Tenancy** | `X-Tenant-Id` header isolates data between agencies | `tenant.js` middleware |
| **API Security** | External consumers must present valid `X-API-Key` | `apiKeyAuth.js` |
| **HTTP Hardening** | Helmet.js sets security headers (CSP, HSTS, X-Frame-Options) | `index.js` |
| **Threat Detection** | Automated rules detect PHI scraping patterns and critical incidents | `alert_service.js` |

### Role-Based Access Control (RBAC)
The system supports 4 roles, managed via `UserContext.tsx`:
- **ADMIN** — Full access to all modules and system configuration
- **ICA** — Case management, clinical notes, renewals (no payroll access)
- **FEA** — Financials, billing, onboarding, EVV (no clinical notes access)
- **AUDITOR** — Read-only access for state quality reviews (time-limited sessions)

---

## 🏛 Architecture Diagrams

### Event-Driven Architecture (Service Bus)
```
Frontend (React) ──▶ Express API ──▶ Service Bus (Redis)
                                          │
                      ┌───────────────────┼────────────────────┐
                      ▼                   ▼                    ▼
               Budget Service      Sandata Proxy        Audit Store
              (Burn-rate calc)    (State sync)       (Immutable log)
```

### FHIR R4 Resource Mapping

| IRIS Internal Object | FHIR Resource | Standard |
|---------------------|---------------|----------|
| Participant | [Patient](https://hl7.org/fhir/R4/patient.html) | Demographics, MCI |
| Caregiver/Worker | [Practitioner](https://hl7.org/fhir/R4/practitioner.html) | Identity, certifications |
| EVV Visit | [Observation](https://hl7.org/fhir/R4/observation.html) | GPS-verified service event |
| Care Plan (ISSP) | [CarePlan](https://hl7.org/fhir/R4/careplan.html) | Authorized tasks |

---

## 🗺 Implementation Roadmap

| Phase | Title | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| 1–3 | Core Infrastructure | ✅ | Schema, onboarding wizard, payroll engine, tax engine |
| 4 | Compliance Gateway | ✅ | Sandata proxy, Mobile EVV, 837P EDI, LTC-IES encounters |
| 5 | ICA Optimization | ✅ | Star-rating predictor, Wages Now, Auditor portal |
| 6 | AI Nervous System | ✅ | Voice scribe, NLP auditor, anomaly billing, OTE justification |
| 7 | Mission-Critical Bridging | ✅ | Transfer sentinel, DHS 105 validator, incident triggers |
| 8 | Competitive Dominance | ✅ | Offline sync, real-time payroll, policy bot, WISITS sideload |
| 9 | Enterprise Architecture | ✅ | Service Bus (Redis), Snowflake sync, FHIR adapter |
| 10 | Clinical Ecosystem | ✅ | Marketing CRM, Clinical narrative, Budget HUD, GPS telemetry |
| 11–12 | Vault & Audit Shield | ✅ | Document vaulting, AI compliance scanner, renewal tracker |
| 13 | Admin Intelligence | ✅ | RBAC, click-telemetry, live SQL dashboard |
| 14 | Digital Form Engine | ✅ | PDF smart-mapping (F-01201, F-82064), signature pad |
| 15 | Security Command Center | ✅ | PHI scraping detection, critical incident alerting |
| 16 | Interoperability Hub | ✅ | FHIR R4 adapter, WellsKy/HHAeXchange simulation |
| 17 | EVV GPS Hardening | ✅ | Point-in-polygon geofence compliance |
| 18 | Clinical AI-Scribe | ✅ | Ambient transcription → SOAP notes, SDOH risk flags |
| 19 | Fraud & Integrity | ✅ | Visit anomaly detection, audit scorecards |
| 20 | State API & Federal Compliance | ✅ | StateGateway persistence, I-9/W-2 forms, Document Debt engine |
| 21 | Clinical Portal Hardening | ✅ | Role-based isolation, live DB integration for ADRC/SDPC |
| 22 | Headless E2E Validation | ✅ | Playwright organizational workflow suite |
| 23 | Advanced Security Intelligence | ✅ | Predictive threat modeling, biometric auth simulation |
| 24 | Document Vault & PDF Hardening | ✅ | High-fidelity preview, automated publishing, official DHS mapping |

---

## ⚙ Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development

# Encryption (REQUIRED for PHI)
ENCRYPTION_KEY=your-64-char-hex-key-here

# Sandata EVV (Optional - Mock mode if absent)
SANDATA_AUTH=username:password
SANDATA_ACCOUNT=12345

# OpenAI (Optional - Mock mode if absent)
OPENAI_API_KEY=sk-...

# Redis (Optional - In-memory fallback if absent)
REDIS_URL=redis://localhost:6379
```

---

## 🤝 Contributing

### For New Developers
1. Read `docs/SERVICE_INVENTORY.md` — this is the master registry of every backend component.
2. Read `docs/security/HIPAA_GUIDE.md` — understand PHI handling requirements before touching any patient data.
3. Run the server in Mock Mode first (`npm run dev`) to explore the full API surface.
4. Use the RBAC role-switcher in the Admin module to see how the UI changes per role.

### Code Conventions
- **Controllers** are thin request handlers that delegate to **Services** for business logic.
- **PII Rule:** Never log, cache, or write SSN/MCI to disk in plaintext. Always use `CryptoService.encrypt()`.
- **Audit Rule:** Every user-facing action must emit an audit event via the `securityController.logAction` endpoint.
- **Form Rule:** New PDF form support requires both a `PFMSMapper` method AND a routing entry in `CompliancePDFService`.

### Adding a New Module
1. Create `client/web_app/src/modules/YourModule.tsx`
2. Add the module type to the `ModuleType` union in `App.tsx`
3. Add navigation entry in `App.tsx` sidebar (respect RBAC filtering)
4. Create corresponding controller in `server/controllers/`
5. Register routes in `server/index.js`
6. Update `docs/SERVICE_INVENTORY.md`

---

*Built for the Wisconsin IRIS program. HIPAA-compliant by design.*
