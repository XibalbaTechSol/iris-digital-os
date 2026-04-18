# Iris OS Enterprise Expansion: Billing, Compliance & Analytics

Based on competitive research into industry leaders (AxisCare, TMG, HCHB), this plan outlines the implementation of mission-critical "Enterprise" features focusing on Medicaid billing, state compliance, and data warehousing.

## User Review Required

> [!IMPORTANT]
> **Hard-Block Compliance:** I am implementing a "Hard-Stop" guardrail according to DHS P-00708. This will automatically block shift clock-ins if the budget is depleted—mimicking the strict compliance of agencies like iLIFE.
> **EDI Generating:** I will create a raw 837P generator. Please note that for real-world use, this requires a Clearinghouse (e.g., Availity) for transmission.
> **PII Masking:** The Snowflake sync logic will include "Dynamic Data Masking" patterns for PII, ensuring HIPAA compliance at the analytics layer.

## Proposed Changes

### Compliance & Financials (P-00708 Standard)

#### [MODIFY] [FinancialsModule.tsx](file:///home/xibalba/iris-digital-os/client/web_app/src/modules/FinancialsModule.tsx)
- Add **Cost-Share Portal**: A UI for participants to manage and pay their monthly patient liability.
- Integrate **ISSP Real-time Balance**: Visualizing the remaining authorization units before the "Hard-Block" triggers.

#### [NEW] [ComplianceEngine.js](file:///home/xibalba/iris-digital-os/server/services/compliance/compliance_engine.js)
- A background service subscribed to the `ServiceBus`.
- Logic to validate `SHIFT_CREATED` events against `BudgetService` to enforce P-00708 rules.

---

### Billing & Claims (837P Engine)

#### [NEW] [EDIService.js](file:///home/xibalba/iris-digital-os/server/services/financials/edi_service.js)
- Generates HIPAA-compliant **EDI 837P** files.
- Maps visit data to Loop 2300 (CLM) and Loop 2400 (SV1/DTP) for T1019 Personal Care.

---

### Analytics & ATS Refinement

#### [NEW] [SnowflakeSync.js](file:///home/xibalba/iris-digital-os/server/services/analytics/snowflake_sync.js)
- Mock ingestion service demonstrating Snowpipe integration and CMK encryption.

#### [MODIFY] [OnboardingModule.tsx](file:///home/xibalba/iris-digital-os/client/web_app/src/modules/OnboardingModule.tsx)
- Integrate **Automated WORCS Check**: Adding a background check automation step to the ATS pipeline.

---

## Open Questions

1. **837P NPI:** Should I use a static mock NPI/Tax ID for the Billing Provider loops, or should this be dynamically pulled from the Tenant profile?
2. **Cost-Share Simulation:** For "Paying" cost-share, should I implement a mock **ACH/Plaid** flow or stick to a manual "Record Receipt" logic?
3. **Data Masking:** Would you like the Snowflake documentation to include the specific SQL `MASKING POLICY` DDL for the PII fields?

## Verification Plan

### Automated Tests
- Run a verification script to validate the generated 837P file structure against the X12 standard.
- Simulate a budget overage event on the `ServiceBus` and verify the `ComplianceEngine` correctly triggers a `SHIFT_REJECTED` event.

### Manual Verification
- Verify the "Pay Cost-Share" button in the Financials dashboard.
- Confirm the new "Automated Background Check" step appears in the recruitment pipeline.
