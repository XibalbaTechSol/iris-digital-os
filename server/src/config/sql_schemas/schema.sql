# Implementation Plan: Prior Auth & Annual Renewals Expansion

This plan adds specialized ICA operational tabs for tracking DHS Prior Authorizations and the full Annual Renewal cycle (ISSP + LTCFS).

## User Review Required

> [!IMPORTANT]
> **PA Status Sync**: The initial implementation will use mock data for DHS approval statuses. In production, this would require an 834/278 EDI bridge or RPA scraper for the ForwardHealth portal.

## Proposed Changes

### Clinical Case Management Hub

#### [MODIFY] [CaseMgmtModule.tsx](file:///home/xibalba/iris-digital-os/client/web_app/src/modules/CaseMgmtModule.tsx)
- Add `PRIOR_AUTH` and `ANNUAL_RENEWAL` to the `CaseTab` union.
- Implement **Prior Auth Tracker**:
    - List of OTE (One-Time Expense) and specialized service requests.
    - Status badges: `PENDING_DHS`, `APPROVED`, `MORE_INFO_REQ`, `DENIED`.
    - Attachment viewer for medical justification scripts.
- Implement **Annual Renewal Command Center**:
    - 365-day countdown for both ISSP renewal and LTC Functional Screen.
    - Workflow checklist: Participant Meeting → Budget Calculation → DHS Submission → Signed Copy Distribution.
    - Integration with the existing `REDETERMINATION` logic.

### Backend Orchestration

#### [MODIFY] [caseController.js](file:///home/xibalba/iris-digital-os/server/controllers/caseController.js)
- Add `getPriorAuths` and `getRenewals` endpoints.
- Add `submitPARequest` to handle the transition from AI-Justification to an active PA record.

## Verification Plan

### Automated Tests
- `tsc --noEmit` to ensure type-safety of the expanded `CaseTab` union.
- Browser test: Navigate to "Case Management" and verify the "Prior Auth" and "Annual Renewal" tabs appear and render list data.

### Manual Verification
- Verify that clicking "Prior Auth" shows a list of requests with DHS tracking numbers.
- Verify the "Annual Renewal" tab shows a visual timeline/countdown for the next screen due.
