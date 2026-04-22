/**
 * IRIS Digital OS - DHS ForwardHealth Technical Schema (837P)
 * Based on Companion Guide P-00265
 */

const DHSSchema = {
    IDENTIFIERS: {
        PAYER_ID: "WISC_TXIX", // ForwardHealth Permanent Identifier
        ISA_RECEIVER_ID: "AVAILITY", // Or internal DHS gateway ID
        ISA_SENDER_ID: "IRIS_OS"
    },
    
    CONSTRAINTS: {
        MEMBER_ID: { length: 10, type: "numeric", mandatory: true },
        NPI: { length: 10, type: "numeric", mandatory: true },
        HCPCS: { pattern: /^[A-Z][0-9]{4}$/, mandatory: true }
    },

    LOOPS: {
        BILLING_PROVIDER: { loop: "2010AA", segments: ["NM1", "N3", "N4", "REF"] },
        SUBSCRIBER: { loop: "2010BA", segments: ["NM1", "DMG", "INS"] },
        PAYER: { loop: "2010BB", segments: ["NM1", "N3", "N4"] },
        CLAIM_INFO: { loop: "2300", segments: ["CLM", "DTP", "HI", "REF"] },
        SERVICE_LINE: { loop: "2400", segments: ["SV1", "DTP", "REF"] }
    },

    /**
     * Validate a claim object against DHS requirements.
     */
    validate(claim) {
        const errors = [];
        
        if (!claim.participant.mciId || claim.participant.mciId.length !== 10) {
            errors.push("Invalid Member ID: ForwardHealth requires exactly 10 digits (Loop 2010BA).");
        }
        
        if (!claim.service.hcpcs || !this.CONSTRAINTS.HCPCS.pattern.test(claim.service.hcpcs)) {
            errors.push(`Invalid HCPCS Code: ${claim.service.hcpcs}. Must follow Alpha + 4 Digits format.`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

module.exports = DHSSchema;
