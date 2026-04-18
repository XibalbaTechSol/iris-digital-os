# Research Notes: ADRC & PDF Expansion

## Current State
- **ADRCModule.tsx**: contains a mock Options Counseling modal.
- **CompliancePDFService.js**: fills PDFs using pdf-lib; has hardcoded signature placement (x:50, y:80).
- **PFMSMapper.js**: maps internal data to DHS form fields for F-01201, F-82064, and F-00075.
- **SignatureCanvas.tsx**: standalone component for signature capture.

## Gap Analysis
- Counseling logic is static information; needs an interactive decision tree.
- PDF mapping for F-00075 is minimal.
- Signature placement needs to be parameterized per form.
- Broadening scope to Family Care (MCO) requires a different service model (Managed Care vs Self-Directed).

## Proposed ADRC Logic
- Questionnaire:
  1. Employee Management: (Hire myself vs Agency manages)
  2. Budget Control: (I decide spend vs Interdisciplinary team decides)
  3. Residential preference: (Live in own home vs Assisted Living option)
