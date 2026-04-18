/**
 * IRIS Digital OS - PFMS/DHS Mapping Engine
 * Goal: Map easy-intake data to official DHS XFA fields.
 */

class PFMSMapper {
    /**
     * Map data to F-01201 (IRIS Worker Set-Up)
     */
    mapToF01201(data) {
        return {
            "form_type": "F-01201",
            "fields": {
                "PARTICIPANT_NAME": data.participant.name.toUpperCase(),
                "PARTICIPANT_MCI": data.participant.mciId,
                "WORKER_NAME": data.worker.name.toUpperCase(),
                "WORKER_DOB": data.worker.dob,
                "WORKER_SSN": data.worker.ssn,
                "WORKER_EMAIL": data.worker.email,
                "RELATIONSHIP_TYPE": data.relationship.type,
                "IS_RELATIVE": data.relationship.isRelative ? 'YES' : 'NO',
                "IS_TRANSFER": data.isTransfer ? 'YES' : 'NO', // Support for FEA Transfer variant
                "EFFECTIVE_DATE": new Date().toISOString().split('T')[0]
            }
        };
    }

    /**
     * Map data to F-82064 (Background Information Disclosure)
     */
    mapToF82064(data) {
        return {
            "form_type": "F-82064",
            "fields": {
                "SECTION_A_NAME": data.worker.name,
                "SECTION_A_DOB": data.worker.dob,
                "QUESTION_1": data.bid.q1 ? 'YES' : 'NO',
                "QUESTION_2": data.bid.q2 ? 'YES' : 'NO',
                "QUESTION_3": data.bid.q3 ? 'YES' : 'NO',
                "SECTION_C_COMMENTS": data.bid.comments || 'NONE'
            }
        };
    }

    /**
     * Map data to F-00075 (IRIS Authorization)
     */
    mapToF00075(data) {
        return {
            "form_type": "F-00075",
            "fields": {
                "PARTICIPANT_NAME": data.name.toUpperCase(),
                "PARTICIPANT_MCI": data.mciId,
                "COUNTY": data.county || 'ADRC_DEMO_COUNTY',
                "ICA": data.ica || 'CONNECTIONS_ICA',
                "ADRC_NAME": data.adrcName || 'IRIS DIGITAL ADRC',
                "COUNSELOR_NAME": data.agentName || 'SARAH JENKINS',
                "SELECTION": data.selection || 'IRIS', // IRIS, Family Care, Partnership, etc.
                "EFFECTIVE_DATE": new Date().toISOString().split('T')[0]
            }
        };
    }

    /**
     * Map data to F-01022 (Family Care Enrollment)
     */
    mapToF01022(data) {
        return {
            "form_type": "F-01022",
            "fields": {
                "PARTICIPANT_NAME": data.name.toUpperCase(),
                "PARTICIPANT_MCI": data.mciId,
                "MCO": data.mco || 'MY_CHOICE_WISCONSIN',
                "ENROLLMENT_DATE": data.enrollmentDate || new Date().toISOString().split('T')[0],
                "GUARDIAN_NAME": data.guardianName || 'N/A'
            }
        };
    }

    /**
     * Map data to F-01309 (IRIS Rights)
     */
    mapToF01309(data) {
        return {
            "form_type": "F-01309",
            "fields": {
                "PARTICIPANT_NAME": data.name.toUpperCase(),
                "PARTICIPANT_MCI": data.mciId,
                "VERIFICATION_DATE": new Date().toISOString().split('T')[0]
            }
        };
    }

    /**
     * Map data to F-01201A (ISSP)
     */
    mapToF01201A(data) {
        return {
            "form_type": "F-01201A",
            "fields": {
                "PARTICIPANT_NAME": data.name.toUpperCase(),
                "PARTICIPANT_MCI": data.mciId,
                "TOTAL_BUDGET": data.authorizedAmount,
                "RENEWAL_DATE": data.anniversaryDate
            }
        };
    }

    /**
     * Map data to F-01293 (Transfer)
     */
    mapToF01293(data) {
        return {
            "form_type": "F-01293",
            "fields": {
                "PARTICIPANT_NAME": data.name.toUpperCase(),
                "PARTICIPANT_MCI": data.mciId,
                "TRANSFER_FROM": data.ica,
                "TRANSFER_TO": "NEW_ICA_PENDING"
            }
        };
    }

    /**
     * Map data to Federal I-9 (Employment Eligibility Verification)
     * Research-Backed Field IDs for 2024 Fillable PDF.
     */
    mapToI9(data) {
        return {
            "form_type": "I-9",
            "fields": {
                "LName": data.worker.lastName.toUpperCase(),
                "FName": data.worker.firstName.toUpperCase(),
                "Address": data.worker.address,
                "DOB": data.worker.dob,
                "SSN1": data.worker.ssn.split('-')[0],
                "SSN2": data.worker.ssn.split('-')[1],
                "SSN3": data.worker.ssn.split('-')[2],
                "CitizenshipStatus": data.worker.citizenshipStatus || '1' // 1: Citizen, 2: Noncitizen National, etc.
            }
        };
    }

    /**
     * Map data to Federal W-2 (Wage and Tax Statement)
     */
    mapToW2(data) {
        return {
            "form_type": "W-2",
            "fields": {
                "a_EmployeeSSN": data.worker.ssn,
                "e_EmployeeName": `${data.worker.firstName} ${data.worker.lastName}`,
                "c_EmployerAddress": "IRIS Digital OS FEA Service, 100 Main St, Madison, WI",
                "b_1_Wages": data.financials.ytdWages,
                "b_2_FedTax": data.financials.ytdFedTax,
                "b_3_SSWages": data.financials.ytdWages
            }
        };
    }

    /**
     * Intelligent Relationship Resolver
     * Logic: Automated detection of tax exemptions based on relationship.
     */
    resolveTaxExemptions(relationshipType) {
        const exemptTypes = ['PARENT', 'CHILD', 'SPOUSE'];
        const isExempt = exemptTypes.includes(relationshipType.toUpperCase());
        return {
            socialSecurityExempt: isExempt,
            medicareExempt: isExempt,
            futaExempt: isExempt
        };
    }
}

module.exports = new PFMSMapper();
