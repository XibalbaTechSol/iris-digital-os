# Technical Benchmark: Iris Digital OS vs. Industry Leaders

This document provides a technical comparison of Iris Digital OS against the "validated" architectures of market leaders in the home care space.

## Competitor Matrix

| Competitor | Core Stack | Architecture Pattern | Interoperability |
| :--- | :--- | :--- | :--- |
| **AxisCare** | React / Node.js / SQL | Modular Monolith / SQL Multi-tenancy | Custom REST API |
| **WellSky (ClearCare)** | Angular / Node / Java | Enterprise Microservices | **HL7 FHIR** |
| **AlayaCare** | Python / React / AWS | **Event-Driven Microservices** | Public API / Zapier |
| **HomeCareHomeBase** | .NET / Azure / SQL | Enterprise Service Bus (ESB) | HIE / Interop Focused |
| **Iris Digital OS** | React / Node / PG | **AI-Native Service Bus (Redis)** | **HL7 FHIR 4.0** |

## Validated Patterns Adopted by Iris OS

### 1. The "Nervous System" (Service Bus)
Following the patterns of **AlayaCare** and **HCHB**, Iris OS utilizes an asynchronous Service Bus.
- **Competitor implementation:** Often uses RabbitMQ or AWS SQS.
- **Iris OS Implementation:** Redis-backed Pub/Sub for high-speed, persistent state management. This ensures that a caregiver clocking out doesn't wait for the budget service to finish its calculations.

### 2. Standardized Interoperability (FHIR)
Benchmarked against **WellSky**, Iris OS implements the **HL7 FHIR 4.0** standard.
- **Benefit:** Allows Iris OS to act as a "Plug-and-Play" replacement for legacy systems without custom data migration for every new agency.
- **Resources:** mapping internal `Participant` to `Patient` and `Visit` to `Observation`.

### 3. State Compliance Guardrails
Copying the "Hard-Block" validation logic of **AxisCare**, Iris OS provides real-time "Pre-Check" logic for EVV.
- **Benefit:** Submissions to state aggregators (Sandata/HHAeXchange) have a near-zero failure rate, outperforming legacy systems like CareTime.

## Strategic Advantage
While competitors are focused on legacy enterprise migration, Iris OS is built from the ground up to be **AI-Native**. By using the same validated architectural spine as HCHB, we guarantee the reliability required by state governments while maintaining the agility of a GenAI-driven platform.
