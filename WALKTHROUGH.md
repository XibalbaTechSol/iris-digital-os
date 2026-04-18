# Enterprise Refinement: Billing, Compliance & Analytics

We have successfully refined Iris Digital OS to include deep enterprise functionality, benchmarked against industry leaders like iLIFE, AxisCare, and HomeCareHomeBase.

## 🚀 Key Accomplishments

### 1. Medicaid Billing Engine (EDI 837P)
We implemented a professional claim generator ([EDIService.js](file:///home/xibalba/iris-digital-os/server/services/financials/edi_service.js)) for T1019 services.
- **NPI Validation:** Automatically validates billing provider NPIs against the **CMS NPPES Registry API** to prevent downstream rejections.
- **Validated Loop Logic:** Maps verified visit data to HIPAA-compliant loops (2010AA, 2300, 2400).

### 2. Hard-Block Compliance (DHS P-00708)
Following the "validated" patterns of top FEAs, we built a real-time [ComplianceEngine.js](file:///home/xibalba/iris-digital-os/server/services/compliance/compliance_engine.js).
- **Hard-Stop Guardrail:** Prevents caregivers from clocking into shifts if the participant's budget is depleted.
- **Service Bus Integration:** Listens for `SHIFT_CREATED` events and emits `SHIFT_REJECTED` on violation.

### 3. HIPAA-First Analytics Warehouse
Implemented the [SnowflakeSync.js](file:///home/xibalba/iris-digital-os/server/services/analytics/snowflake_sync.js) to automate high-compliance data ingestion.
- **PII Masking:** Provided the specific SQL DDL for Dynamic Data Masking on SSN and MCI fields.

> [!TIP]
> **Snowflake Masking Policy:**
> ```sql
> CREATE OR REPLACE MASKING POLICY pii_ssn_mask AS (val string) 
>   RETURNS string ->
>   CASE
>     WHEN current_role() IN ('ACCOUNTADMIN', 'COMPLIANCE_OFFICER') THEN val
>     ELSE '***-**-' || RIGHT(val, 4)
>   END;
> ```

### 4. Financials & Onboarding Refinement
- **Cost-Share Dashboard:** Added a participant management portal in [FinancialsModule.tsx](file:///home/xibalba/iris-digital-os/client/web_app/src/modules/FinancialsModule.tsx) with an interactive **Mock ACH/Plaid** payment flow.
- **ATS Automation:** Integrated automated **WORCS/BID Background Checks** into the [OnboardingModule.tsx](file:///home/xibalba/iris-digital-os/client/web_app/src/modules/OnboardingModule.tsx) recruitment pipeline.

---

## 🛠 Technical Details

- **Service Bus:** Enforced policies are now decentralized across the OS spine.
- **Standardization:** Integrated [FHIRAdapter.js](file:///home/xibalba/iris-digital-os/server/services/compliance/fhir_adapter.js) patterns for enterprise data exchange.
- **Validation:** All claim generation includes a look-up step to verified registries.

## Status Summary
- **Compliance Engine:** Active & subscribing to Bus events.
- **Billing Engine:** Tested with CMS Registry lookups.
- **Analytics Sync:** Documentation & Mock services deployed.
