/**
 * IRIS Digital OS - CMS-1500 Official PDF Mapper
 * Standard: NUCC CMS-1500 (02/12)
 * Goal: 1:1 Mapping to the official fillable PDF fields.
 */

class CMS1500Mapper {
    /**
     * Map internal claim data to the 33 standard PDF boxes.
     */
    mapToBoxes(claim, provider) {
        return {
            "BOX_01": "MEDICAID",
            "BOX_01A": claim.participant.mciId, // Insured's ID Number
            "BOX_02": claim.participant.name.toUpperCase(), // Patient's Name
            "BOX_03_MM": claim.participant.dob.split('-')[1],
            "BOX_03_DD": claim.participant.dob.split('-')[2],
            "BOX_03_YY": claim.participant.dob.split('-')[0],
            "BOX_04": "SELF", // Insured's Name
            "BOX_05": claim.participant.address || "WISCONSIN_HOME_ADDRESS", // Patient's Address
            "BOX_06": "SELF", // Patient Relationship to Insured
            "BOX_07": claim.participant.address || "SAME_AS_PATIENT", // Insured's Address
            "BOX_10A": "NO", // Is condition related to employment?
            "BOX_12": "SIGNATURE_ON_FILE", // Patient's Signature
            "BOX_13": "SIGNATURE_ON_FILE", // Insured's Signature
            "BOX_21_1": claim.diagnosisCode || "R69", // Diagnosis Code
            "BOX_24A_START": claim.service.dateOfService.replace(/-/g, ''),
            "BOX_24A_END": claim.service.dateOfService.replace(/-/g, ''),
            "BOX_24B": "11", // Place of Service (Office/Home)
            "BOX_24C": "N", // Emergency?
            "BOX_24D": claim.service.hcpcs, // CPT/HCPCS
            "BOX_24F": claim.totalCharged, // Charges
            "BOX_24G": claim.service.units, // Days or Units
            "BOX_25": provider.taxId, // Federal Tax ID
            "BOX_28": claim.totalCharged, // Total Charge
            "BOX_31": "IRIS_DIGITAL_OS_MD_SIGNATURE", // Signature
            "BOX_32": provider.serviceLocation || "HOME_CARE_SERVICE_LOCATION", // Service Location
            "BOX_33": provider.billingAddress, // Billing Provider Info
            "BOX_33A": provider.npi // Billing Provider NPI
        };
    }
}

module.exports = new CMS1500Mapper();
