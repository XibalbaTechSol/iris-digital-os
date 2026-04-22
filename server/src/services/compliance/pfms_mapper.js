/**
 * IRIS Digital OS - PFMS/DHS Mapping Engine
 * Goal: Map easy-intake data to official DHS XFA fields for production templates.
 */

class PFMSMapper {
    /**
     * Helper to split full name into parts
     */
    _splitName(fullName) {
        const parts = (fullName || '').split(' ');
        return {
            first: parts[0] || '',
            last: parts.length > 1 ? parts[parts.length - 1] : '',
            initial: parts.length > 2 ? parts[1][0] : ''
        };
    }

    /**
     * Helper to split ISO date into MM DD YYYY components
     */
    _splitDate(dateStr) {
        if (!dateStr) return { m: '', d: '', y: '' };
        const [y, m, d] = dateStr.split('-');
        return { m, d, y };
    }

    /**
     * Map data to F-01201 (IRIS Worker Set-Up) - Official Template
     */
    mapToF01201(data) {
        const phw = this._splitName(data.worker.name);
        const ppt = this._splitName(data.participant.name);
        const dob = this._splitDate(data.worker.dob);

        return {
            "form_type": "F-01201",
            "fields": {
                "PHW_First Name": phw.first.toUpperCase(),
                "PHW_Last Name": phw.last.toUpperCase(),
                "PHW_Initial": phw.initial.toUpperCase(),
                "PHW_DOB-1": dob.m,
                "PHW_DOB-2": dob.d,
                "PHW_DOB-3": dob.y,
                "PHW_Address": data.worker.address || '',
                "PHW_City": data.worker.city || '',
                "PHW_State": data.worker.state || 'WI',
                "PHW_Zip": data.worker.zip || '',
                "PHW_Phone": data.worker.phone || '',
                "PHW_Email": data.worker.email || '',
                "PPT_First Name": ppt.first.toUpperCase(),
                "PPT_Last Name": ppt.last.toUpperCase(),
                "PPT_Initial": ppt.initial.toUpperCase(),
                "Master ClientIndex MCI": data.participant.mciId || '',
                "PPT_Address": data.participant.address || '',
                "PPT_City": data.participant.city || '',
                "PPT_State": data.participant.state || 'WI',
                "PPT_Zip": data.participant.zip || '',
                "PPT_Phone": data.participant.phone || ''
            }
        };
    }

    /**
     * Map data to F-82064 (Background Information Disclosure) - Official Template
     */
    mapToF82064(data) {
        const name = this._splitName(data.worker.name);
        return {
            "form_type": "F-82064",
            "fields": {
                "DCW First Name": name.first.toUpperCase(),
                "DCW Last Name": name.last.toUpperCase(),
                "DCW Middle Initial": name.initial.toUpperCase(),
                "DCW SSN": data.worker.ssn || '',
                "DCW DOB": data.worker.dob || '',
                "DCW Address": data.worker.address || '',
                "DCW City": data.worker.city || '',
                "DCW State": data.worker.state || 'WI',
                "DCW Zip": data.worker.zip || '',
                "DCW Phone": data.worker.phone || '',
                "Name of employer or organization that asked you to complete this form": "IRIS DIGITAL OS - FEA SERVICE"
            }
        };
    }

    /**
     * Map data to F-01201A (Relationship Identification) - Official Template
     */
    mapToF01201A(data) {
        return {
            "form_type": "F-01201A",
            "fields": {
                "PPT Last First": data.participant.name.toUpperCase(),
                "DCW Last First": data.worker.name.toUpperCase(),
                "Participant Medicaid Identification Number MCI": data.participant.mciId || '',
                "PPT Address shared": data.participant.address || '',
                "PPT City shared": data.participant.city || '',
                "PPT Zip shared": data.participant.zip || ''
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
                "SELECTION": data.selection || 'IRIS',
                "EFFECTIVE_DATE": new Date().toISOString().split('T')[0]
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
     * Map data to F-01293 (Transfer)
     */
    mapToF01293(data) {
        return {
            "form_type": "F-01293",
            "fields": {
                "PARTICIPANT_NAME": data.participant?.name.toUpperCase() || '',
                "PARTICIPANT_MCI": data.participant?.mciId || '',
                "TRANSFER_FROM": data.ica || 'PREVIOUS_ICA',
                "TRANSFER_TO": "NEW_ICA_PENDING"
            }
        };
    }

    /**
     * Map data to Federal I-9 (Employment Eligibility Verification)
     */
    mapToI9(data) {
        const name = this._splitName(data.worker.name);
        return {
            "form_type": "I-9",
            "fields": {
                "LName": name.last.toUpperCase(),
                "FName": name.first.toUpperCase(),
                "Address": data.worker.address || '',
                "DOB": data.worker.dob || '',
                "SSN1": (data.worker.ssn || '').split('-')[0],
                "SSN2": (data.worker.ssn || '').split('-')[1],
                "SSN3": (data.worker.ssn || '').split('-')[2]
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
                "e_EmployeeName": data.worker.name.toUpperCase(),
                "c_EmployerAddress": "IRIS Digital OS FEA Service, 100 Main St, Madison, WI",
                "b_1_Wages": data.financials?.ytdWages || '0.00',
                "b_2_FedTax": data.financials?.ytdFedTax || '0.00',
                "b_3_SSWages": data.financials?.ytdWages || '0.00'
            }
        };
    }

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
