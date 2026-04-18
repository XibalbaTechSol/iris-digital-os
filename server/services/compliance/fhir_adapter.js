/**
 * IRIS Digital OS - FHIR Adapter
 * Pattern: Clinical Interoperability / FHIR R4
 * Goal: Standardize IRIS data for enterprise health exchange.
 */
const db = require('../../database/database');
const CryptoService = require('../security/crypto_service');

class FHIRAdapter {
    /**
     * Map internal Participant object to FHIR Patient resource.
     */
    static toPatient(participant) {
        // Decrypt MCI if it looks like encrypted data
        let decryptedMci = participant.mci_id;
        try {
            if (decryptedMci && decryptedMci.includes(':')) {
                decryptedMci = CryptoService.decrypt(decryptedMci);
            }
        } catch (e) {
            console.error('[FHIR_ADAPTER] MCI_DECRYPT_FAILED');
        }

        return {
            resourceType: "Patient",
            id: participant.id,
            identifier: [
                {
                    system: "https://dhs.wisconsin.gov/iris/mci",
                    value: decryptedMci
                }
            ],
            active: true,
            name: [
                {
                    use: "official",
                    text: participant.name
                }
            ],
            address: [
                {
                    state: "WI",
                    district: participant.county
                }
            ],
            managingOrganization: {
                display: participant.ica || "IRIS_PROGRAM"
            }
        };
    }

    /**
     * Map internal User to FHIR Practitioner resource.
     */
    static toPractitioner(user) {
        return {
            resourceType: "Practitioner",
            id: user.id,
            active: true,
            name: [{
                use: "official",
                text: user.name,
                family: user.name.split(' ').pop(),
                given: [user.name.split(' ')[0]]
            }],
            telecom: [{
                system: "email",
                value: user.email,
                use: "work"
            }],
            qualification: [{
                code: {
                    text: user.role.replace('_', ' ')
                }
            }]
        };
    }

    /**
     * Map internal Audit Log to FHIR AuditEvent.
     */
    static toAuditEvent(auditRecord) {
        return {
            resourceType: "AuditEvent",
            id: `AUDIT-${auditRecord.id || Date.now()}`,
            type: { system: "http://dicom.nema.org/resources/ontology/DCM", code: "110110", display: "Patient Record" },
            action: auditRecord.action?.includes('ACCESS') ? "R" : "U",
            recorded: auditRecord.timestamp || new Date().toISOString(),
            outcome: "0",
            agent: [{
                requestor: true,
                altId: auditRecord.userId,
                name: auditRecord.userName || "IRIS_OPERATOR"
            }],
            source: {
                site: "IRIS_DIGITAL_OS",
                observer: { display: "Clinical_Audit_Shield" }
            },
            entity: [{
                what: { reference: `Patient/${auditRecord.participantId}` },
                type: { system: "http://hl7.org/fhir/resource-types", code: "Person" }
            }]
        };
    }

    /**
     * Map internal Budget to FHIR CarePlan resource.
     */
    static toCarePlan(budget, participant) {
        return {
            resourceType: "CarePlan",
            id: `CP-${participant.id}`,
            status: "active",
            intent: "plan",
            subject: {
                reference: `Patient/${participant.id}`,
                display: participant.name
            },
            period: {
                start: participant.last_renewal_date,
                end: participant.anniversary_date
            },
            activity: [
                {
                    detail: {
                        code: {
                            coding: [{ system: "http://www.ama-assn.org/go/cpt", code: "T1019", display: "Personal Care" }]
                        },
                        status: "in-progress",
                        description: `Authorized Budget: $${budget.authorized_amount}`
                    }
                }
            ],
            note: [{ text: `Clinical Integrity Status: ${budget.cost_share_status}` }]
        };
    }

    /**
     * Map internal EVV Visit to FHIR Observation resource.
     */
    static toObservation(visit) {
        return {
            resourceType: "Observation",
            id: visit.id,
            status: "final",
            code: {
                coding: [{ system: "http://loinc.org", code: "81216-0", display: "Personal care services provided" }],
                text: visit.service_code
            },
            subject: {
                reference: `Patient/${visit.participant_id}`
            },
            effectivePeriod: {
                start: visit.clock_in,
                end: visit.clock_out
            }
        };
    }

    /**
     * Aggregate multiple resources into a FHIR Bundle.
     */
    static toBundle(resources, participantId) {
        return {
            resourceType: "Bundle",
            id: `BUNDLE-${participantId}-${Date.now()}`,
            type: "collection",
            timestamp: new Date().toISOString(),
            entry: resources.map(res => ({
                fullUrl: `http://iris-digital-os/fhir/${res.resourceType}/${res.id}`,
                resource: res
            }))
        };
    }

    /**
     * Convert FHIR JSON to Standard FHIR XML.
     */
    static toXML(json) {
        const rootType = json.resourceType;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<${rootType} xmlns="http://hl7.org/fhir">\n`;
        xml += this._jsonToXml(json);
        xml += `</${rootType}>`;
        return xml;
    }

    static _jsonToXml(obj) {
        let xml = '';
        for (const key in obj) {
            if (key === 'resourceType') continue;
            const val = obj[key];
            if (Array.isArray(val)) {
                val.forEach(item => {
                    xml += `  <${key}>\n${this._jsonToXml(item)}  </${key}>\n`;
                });
            } else if (typeof val === 'object' && val !== null) {
                xml += `  <${key}>\n${this._jsonToXml(val)}  </${key}>\n`;
            } else {
                xml += `  <${key} value="${val}"/>\n`;
            }
        }
        return xml;
    }
    /**
     * Production-grade FHIR R4 Schema Validator (Mimic)
     */
    static validateResource(resource) {
        const errors = [];
        if (!resource.resourceType) errors.push('Missing resourceType');
        if (!resource.id) errors.push('Missing resource ID');

        switch(resource.resourceType) {
            case 'Patient':
                if (!resource.name || resource.name.length === 0) errors.push('Patient must have a name');
                if (!resource.identifier || resource.identifier.length === 0) errors.push('Patient must have an identifier (MCI)');
                break;
            case 'Practitioner':
                if (!resource.name) errors.push('Practitioner must have a name');
                break;
            case 'Observation':
                if (!resource.subject) errors.push('Observation must reference a Patient');
                if (!resource.code) errors.push('Observation must have a LOINC/CPT code');
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = FHIRAdapter;
