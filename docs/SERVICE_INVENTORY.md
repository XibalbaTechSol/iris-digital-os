# IRIS Digital OS: Service & Controller Inventory

This document serves as the master technical registry for IRIS Digital OS. It maps every backend component to its business logic and implementation phase. 

> [!IMPORTANT]
> **Technical Cache:** This file must be updated every session to prevent context loss.

## 1. Controllers (`server/controllers/`)

| File | Phase | Status | Responsibility |
| :--- | :--- | :--- | :--- |
| `adminController.js` | 13 | ✅ | Enterprise Dashboard, RBAC management, and Click-Telemetry. |
| `alertController.js` | 15 | ✅ | Security Alert lifecycle (Detect, Notify, Dismiss). |
| `auditorController.js` | 5.4 | ✅ | Read-only portal logic for state quality reviews. |
| `billingController.js` | 4.4 | ✅ | 837P EDI batch management and CMS-1500 generation. |
| `caseController.js` | 10 | ✅ | Clinical narratives, budget aggregation, and ISSP management. |
| `documentController.js` | 11 | ✅ | CRUD for Document Vault; expanded for Document Debt (Phase 20). |
| `evvController.js` | 4.2 | ✅ | GPS-verified clock events and Sandata sync triggers. |
| `formController.js` | 14 | ✅ | Digital form submission and signature routing. |
| `interopController.js` | 16 | ✅ | FHIR R4 data exchange and Cures Act EHI Export management. |
| `marketingController.js` | 10 | ✅ | CRM Lead lifecycle and conversion analytics. |
| `onboardingController.js` | 2.1 | ✅ | PFMS automated intake and participant/worker pairing; hardened for real DB. |
| `pcstController.js` | 23 | ✅ | **[NEW]** Clinical PCST Unit calculation and draft management. |
| `scribeController.js` | 18 | ✅ | Clinical AI-Scribe audio-to-SOAP pipeline; fixed uuid dependency. |
| `vaultController.js` | 11 | ✅ | Secure, encrypted binary access for PHI documents. |

## 2. Services (`server/services/`)

### 🧠 AI & Integrity (`/ai/`)
| File | Phase | Status | Responsibility |
| :--- | :--- | :--- | :--- |
| `fraud_engine.js` | 19 | ✅ | ML-driven visit anomaly detection. |
| `integrity_service.js` | 19 | ✅ | Budget burn-rate profiling and audit scorecards. |
| `sdoh_service.js` | 18 | ✅ | Predictive risk assessment for social determinants of health. |
| `voice_scribe.js` | 6.1 | ✅ | Ambient audio processing and structured note generation. |
| `compliance_auditor.js`| 6.2 | ✅ | NLP engine for "Person-Centered" score detection. |

### ⚖️ Compliance & PDF (`/compliance/`)
| File | Phase | Status | Responsibility |
| :--- | :--- | :--- | :--- |
| `compliance_pdf_service.js`| 14/20 | ✅ | **[REFACTORED from dhs_pdf_service]** Handles DHS XFA and Federal I-9/W-2 templates. |
| `document_lifecycle_service.js`| 20 | 🏗️ | Tracks "Document Debt" (missing/expired/unsigned). |
| `pfms_mapper.js` | 14 | ✅ | Maps raw JSON data to official PDF field IDs. |
| `sandata_proxy.js` | 4.1 | ✅ | Wisconsin v2.5 REST client for visit synchronization. |
| `geo_service.js` | 17 | ✅ | Point-in-polygon geofence compliance verification. |
| `pcst_service.js` | 23 | ✅ | **[NEW]** Orchestrates PCST unit persistence and RPA bot triggering. |
| `worcs_service.js` | 2.3 | ✅ | Wisconsin Background Information Disclosure check orchestration. |
| `fhir_adapter.js` | 9.3 | ✅ | HL7 FHIR 4.0 mapping layer for Patient, Practitioner, and Bundle resources. |
| `verify_fhir.js` | 16.2 | ✅ | **[NEW]** Schema validator for FHIR R4 clinical resources. |

### 🏗️ Orchestration (`/orchestration/`)
| File | Phase | Status | Responsibility |
| :--- | :--- | :--- | :--- |
| `state_gateway.js` | 20 | ✅ | Managed persistence for state API packets (Sandata/EDI). |
| `service_bus.js` | 9.1 | ✅ | Redis-backed asynchronous event dispatcher. |
| `referral_intake_service.js`| 1.2 | ✅ | State enrollment CSV ingestion and parsing. |
| `packet_export_service.js` | 20.4 | ✅ | **[NEW]** Generates encrypted EHI clinical packets for Cures Act compliance. |


### 💰 Financials (`/financials/`)
| File | Phase | Status | Responsibility |
| :--- | :--- | :--- | :--- |
| `edi_service.js` | 4.4 | ✅ | HIPAA-compliant EDI X12 core logic. |
| `edi_837p_service.js` | 4.4 | ✅ | **[NEW]** Specific generator for 837 Professional Healthcare Claims. |
| `cms1500_service.js` | 4.5 | ✅ | **[NEW]** Paper claim (CMS-1500) PDF generation engine. |
| `claim_engine.js` | 3.5 | ✅ | Automated claim adjudication and P-00708 validation. |
| `state_xml_service.js` | 4.3 | ✅ | LTC-IES Professional (PR) Encounter generator. |

## 3. Databases & Security
| Component | Tech | Responsibility |
| :--- | :--- | :--- |
| `iris_core.db` | SQLite3 | Core operational data (Participants, Workers, Budgets). |
| `audit.db` | SQLite3 | Immutable system-wide interaction logs. |
| `crypto_service.js` | AES-256 | Field-level encryption for SSN, MCI, and PII. |

---
*Last Updated: 2026-04-18*
