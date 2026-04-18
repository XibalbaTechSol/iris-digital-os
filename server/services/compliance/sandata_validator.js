/**
 * IRIS Digital OS - Sandata Pre-Check Validator (Task 4.1)
 * SOURCE OF TRUTH: Wisconsin DMS Third-Party EVV Addendum v2.5
 */
const GeoService = require('./geo_service');

class SandataValidator {
    /**
     * Runs critical checks derived from Addendum v2.5
     */
    async validateVisit(visit, context) {
        console.log(`[PRE_CHECK_V2.5] Validating visit ${visit.id} for WI DMS compliance...`);
        
        const errors = [];

        // 1. Client Identity (Section 3.2, Field 5/8/9: 10-12 DIGITS)
        if (!visit.participantMci || !/^\d{10,12}$/.test(visit.participantMci)) {
            errors.push({ 
                code: 'INVALID_MCI', 
                message: "ClientMedicaidID must be 10-12 digits. Rejecting per Section 3.2." 
            });
        }

        // 2. Employee Identity (Section 3.1, Field 4: MAX 15 DIGITS, NUMERIC ONLY)
        if (!visit.workerSantraxId || !/^\d{1,15}$/.test(visit.workerSantraxId)) {
            errors.push({ 
                code: 'INVALID_SANTRAX_ID', 
                message: "EmployeeIdentifier must be numeric and max 15 digits. Rejecting per Section 3.1." 
            });
        }

        // 3. Procedure Code (Appendix 2: Valid Wisconsin Codes)
        const validCodes = ['T1019', 'T1502', 'T1001', 'S9123', 'S9124', 'S5125', 'S5126', '92507', '97139', '97799', '99504', '99509', '99600', 'T1021', 'T1020', 'S9122', '99510', '97139', '92508'];
        if (!validCodes.includes(visit.serviceCode)) {
            errors.push({ 
                code: 'UNSUPPORTED_PROCEDURE', 
                message: `ProcedureCode ${visit.serviceCode} is not in Wisconsin Appendix 2.` 
            });
        }

        // 4. Payer and Program (Appendix 1)
        const validPayers = ['WIFFS', 'ANTBCBS', 'CAREWI', 'CCOMMHP', 'DEANHP', 'GHCEC', 'GHCSCW', 'MHSHW', 'MERCYCARE', 'WIMOLINA', 'NHP', 'QUARTZ', 'SECURITY', 'TRILOGY', 'UHCWI', 'ICAREBC', 'ICARESSI', 'CAREWIFCP', 'CCIFCP', 'CCIFC', 'ICAREFCP', 'INCLUSA', 'LAKELAND', 'MCFC-CW', 'GTINDEP', 'ILIFE', 'OUTREACH', 'PREMIER'];
        const validPrograms = ['FFS', 'WIHMO', 'WIMCO', 'WIIRISFEA'];

        if (visit.payerId && !validPayers.includes(visit.payerId)) {
            errors.push({ code: 'INVALID_PAYER', message: `PayerID ${visit.payerId} is not valid for WI DMS.` });
        }
        if (visit.payerProgram && !validPrograms.includes(visit.payerProgram)) {
            errors.push({ code: 'INVALID_PROGRAM', message: `PayerProgram ${visit.payerProgram} is not valid for WI DMS.` });
        }

        // 5. Timezone (Appendix 5)
        if (visit.timezone && visit.timezone !== 'US/Central') {
            // While other timezones exist in Appendix 5, US/Central is mandated for most WI visits
            errors.push({ code: 'INVALID_TIMEZONE', message: "VisitTimeZone should typically be US/Central for WI DMS." });
        }

        // 6. Time Sequence (Section 2.8: Rules)
        const start = new Date(visit.startTime);
        const end = new Date(visit.endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            errors.push({ code: 'INVALID_TIMESTAMP', message: "Start or End time is not a valid date." });
        } else if (end <= start) {
            errors.push({ 
                code: 'TIME_REVERSAL', 
                message: "Call Out time must be later than Call In time. Rejecting per Section 2.8." 
            });
        }

        // 7. GPS Requirement (Section 2.8: Responsibility for Provider to provide Lat/Lng)
        if (!visit.isManualEdit && (!visit.gps?.lat || !visit.gps?.lng)) {
            errors.push({ 
                code: 'MISSING_GPS', 
                message: "Electronic visits must provide Latitude/Longitude for both Start and End. Section 2.8." 
            });
        } else if (!visit.isManualEdit && context.primaryResidenceGps) {
            const distance = GeoService.calculateDistance(
                visit.gps.lat, visit.gps.lng,
                context.primaryResidenceGps.lat, context.primaryResidenceGps.lng
            );
            
            if (distance > 500) { // 500 meters tolerance
                errors.push({
                    code: 'GPS_OUT_OF_FENCE',
                    severity: 'CRITICAL',
                    message: `Visit location is too far from residence (${Math.round(distance)}m). Max allowed: 500m.`
                });
            }
        }

        // 8. Manual Edit Rule (Section 3.9: Visit Changes)
        if (visit.isManualEdit && (!visit.changeReasonCode || !visit.changeMadeBy)) {
            errors.push({
                code: 'MISSING_CHANGE_LOG',
                message: "Manual edits must include ReasonCode (Appendix 3) and ChangeMadeBy. Section 3.9."
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            rejectionProbability: errors.length > 0 ? 1.0 : 0.01 
        };
    }
}

module.exports = new SandataValidator();
