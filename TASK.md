# IRIS Digital OS - Task Tracker

## Phase 14: Digital Form Engine (COMPLETED)
- [x] **DHS Form Automation**
    - [x] Create `formController.js` and `dhs_pdf_service.js`
    - [x] Map `PFMSMapper` to core F-01201, F-82064, and F-00075 templates
    - [x] Implement electronic signature embedding via `pdf-lib`
- [x] **Frontend Enrollment Flow**
    - [x] Update `OnboardingModule.tsx` with live form downloads
    - [x] Add signature pad integration for digital sign-offs

## Phase 15: Security Command Center & Alerting (COMPLETED)
- [x] **System Monitoring**
    - [x] Create `alert_service.js` and `alertController.js`
    - [x] Implement PHI access scraping detection rule
    - [x] Implement Critical Incident detection logic
- [x] **Admin Intelligence Expansion**
    - [x] Connect `AdminModule.tsx` to live Security Alert stream
    - [x] Implement Alert Dismissal/Acknowledgement workflow

## Phase 16: Interoperability Hub (FHIR R4) (COMPLETED)
- [x] **Legacy EHR Connectors**
    - [x] Create `fhir_adapter.js` and `interopController.js`
    - [x] Map IRIS internals to FHIR Patient, Practitioner, and Observation resources
    - [x] Implement WellsKy and HHAeXchange simulation layer
- [x] **Interoperability Dashboard**
    - [x] Create `InteropModule.tsx` UI
    - [x] Add "Export to FHIR" and "Third-Party Sync" actions

## Phase 17: EVV GPS Hardening & Compliance (COMPLETED)
- [x] **Geofencing & Geo-Verification**
    - [x] Create `geo_service.js` for point-in-polygon compliance check
    - [x] Integrate `pdf-lib` for backend field mapping
- [x] Deploy persistent storage for signed documents
- [x] **[EXPANDED]** Options Counseling & Multi-Agency Support
    - [x] Guided Interactive Choice Advisor (IRIS vs. Family Care)
    - [x] Production-grade mapping for F-00075 and F-01022
    - [x] Generalized electronic signature engine
- [x] **Clinical Telemetry UI**
    - [x] Update `EVVModule.tsx` with real-time GPS HUD
    - [x] Add map overlays for Authorized vs. Actual service locations

## Phase 18: Clinical AI-Scribe & SDOH (COMPLETED)
- [x] **Automated Documentation**
    - [x] Create `scribe_service.js` and `voice_scribe.js`
    - [x] Implement AI SOAP note generation (Simulation)
- [x] **Social Determinants of Health (SDOH)**
    - [x] Create `sdoh_service.js` with predictive risk flags
    - [x] Create `AISuiteModule.tsx` for clinical oversight

## Phase 19: Fraud Discovery & Integrity (COMPLETED)
- [x] **Predictive Audit Shield**
    - [x] Create `fraud_engine.js` for visit anomaly detection
    - [x] Create `integrity_service.js` for budget burn-rate profiling
- [x] **Integrity Command Center**
    - [x] Create `IntegrityModule.tsx` UI
    - [x] Implement Real-time Fraud Flags and Audit Scorecards

## Phase 20: State API & Federal Compliance (COMPLETED)

## Phase 20: State API & Federal Compliance (COMPLETED)
- [x] **StateGateway Architecture**
    - [x] Create `state_gateway.js` for orchestration
    - [x] Implement Sandata REST v2.5 Connector
    - [x] Create ForwardHealth X12 EDI / SFTP logic
- [x] **Federal Form Hardening**
    - [x] Add I-9 (2024) and W-2 mappings to `PFMSMapper`
    - [x] Refactor PDF service to `CompliancePDFService`
- [x] **Document Debt Engine**
    - [x] Create `DocumentLifecycleService.js` for compliance tracking
    - [x] Update `FormComplianceHub.tsx` with Debt Dashboard

## Phase 21: Production Portal Hardening (COMPLETED)
- [x] **ADRC Intake Pipeline**
    - [x] Refactor `IntakeModule.tsx` for live DB fetch
    - [x] Implement manual `ReferralIntakeWizard.tsx`
- [x] **SDPC Clinical Automation**
    - [x] Implement PCST unit calculation logic
    - [x] Persist calculated units to `pcst_records`

## Phase 22: Headless E2E Validation (COMPLETED)
- [x] **Playwright Suite**
    - [x] Create `test_organizations.py`
    - [x] Validate role-based portal isolation and critical clinical paths

## Phase 23: Advanced Security Intelligence *(CURRENT)*
- [ ] **Predictive Threat Modeling**
- [ ] **Biometric Auth Simulation**
