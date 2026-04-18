const DHSSchema = require('./claim_schema');

class ClaimEngine {
    /**
     * Calculate units based on minutes.
     * 0-7 min = 0 units
     * 8-22 min = 1 unit
     * 23-37 min = 2 units
     * ...etc.
     * @param {number} totalMinutes 
     */
    calculateUnits(totalMinutes) {
        if (!totalMinutes || totalMinutes < 8) return 0;
        return Math.floor((totalMinutes + 7) / 15);
    }

    /**
     * Prepare a claim-ready object from a verified shift.
     * @param {object} shift 
     * @param {object} participant 
     * @param {object} authorizations 
     */
    prepareClaimObject(shift, participant, authorizations) {
        const units = this.calculateUnits(shift.durationMinutes);
        
        // Find matching HCPCS code from authorization
        const auth = authorizations.find(a => a.serviceType === shift.type) || { hcpcs: 'T1019' };

        const claim = {
            claimId: `CLM_${Date.now()}_${shift.id.slice(-4)}`,
            participant: {
                name: participant.name,
                mciId: participant.mciId,
                dob: participant.dob
            },
            service: {
                hcpcs: auth.hcpcs,
                modifier: auth.modifier || '',
                dateOfService: shift.startTime.split('T')[0],
                minutes: shift.durationMinutes,
                units: units,
                ratePerUnit: auth.rate || 5.25 // Standard T1019 rate if missing
            },
            totalCharged: (units * (auth.rate || 5.25)).toFixed(2)
        };

        // INTEGRITY: Validate against DHS Schema
        const validation = DHSSchema.validate(claim);
        
        return {
            ...claim,
            isValid: validation.isValid,
            errors: validation.errors,
            status: validation.isValid ? 'READY' : 'NEEDS_CORRECTION'
        };
    }
}

module.exports = new ClaimEngine();
