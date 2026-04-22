/**
 * IRIS Digital OS - Sandata Proxy Service (Task 4.1)
 * SOURCE OF TRUTH: Wisconsin DMS Third-Party EVV Addendum v2.5
 */

class SandataProxy {
    constructor(config) {
        // v2.5 Addendum Endpoints (Production)
        this.baseUrl = config.production 
            ? 'https://api.sandata.com/interfaces/intake/visits/rest/api/v1.1'
            : 'https://uat-api.sandata.com/interfaces/intake/visits/rest/api/v1.1';
        
        this.auth = config.auth; // Basic Auth: username:password
        this.account = config.account; // Account: 12345
    }

    /**
     * Generates a SequenceID in the recommended YYYYMMDDHHMMSS format (Section 2.9)
     */
    generateSequenceId() {
        const now = new Date();
        return now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    }

    /**
     * Maps internal IRIS visit to exact JSON Visit structure from Addendum v2.5 (Section 3.6 - 3.10)
     */
    mapToSandataSchema(visit) {
        const sequenceId = visit.sequenceId || this.generateSequenceId();
        
        const payload = {
            ProviderIdentification: {
                ProviderQualifier: "MedicaidID",
                ProviderID: visit.agencyMedicaidId || "WI_IRIS_VENDOR" // WI DMS Enumerator
            },
            VisitOtherID: visit.id,
            SequenceID: sequenceId,
            EmployeeQualifier: "EmployeeCustomID",
            EmployeeIdentifier: visit.workerSantraxId, 
            ClientQualifier: "ClientCustomID",
            ClientID: visit.participantMci,
            VisitCancelledIndicator: visit.isCancelled || false,
            PayerID: visit.payerId || "PREMIER", 
            PayerProgram: visit.payerProgram || "WIIRISFEA",
            ProcedureCode: visit.serviceCode,
            VisitTimeZone: visit.timezone || "US/Central",
            
            // Client Verification (Optional but recommended)
            ClientSignatureAvailable: !!visit.signatureBlob,
            ClientVoiceRecording: false,

            // Visit Tasks (Section 3.10)
            VisitTasks: (visit.tasks || []).map(t => ({ TaskID: t.code })),

            // Calls Segment vs Adjusted Times (Section 3.7 vs 3.6)
            Calls: [],
            VisitChanges: []
        };

        if (visit.isManualEdit) {
            // Manual entries require Adj times at root and VisitChanges entry
            payload.AdjInDateTime = new Date(visit.startTime).toISOString();
            payload.AdjOutDateTime = new Date(visit.endTime).toISOString();
            
            payload.VisitChanges.push({
                SequenceID: sequenceId,
                ChangeMadeBy: visit.changeMadeBy || "system@iris.digital",
                ChangeDateTime: new Date().toISOString(),
                ReasonCode: visit.changeReasonCode || "1", // Appendix 3
                ChangeReasonMemo: visit.changeReasonMemo || "Manual Entry",
                ResolutionCode: "1" // Appendix 4
            });
        } else {
            // Electronic visits require Calls segment
            payload.Calls.push({
                CallExternalID: `${visit.id}_IN`.slice(-16),
                CallDateTime: new Date(visit.startTime).toISOString(),
                CallAssignment: "Time In",
                CallType: "Mobile",
                ProcedureCode: visit.serviceCode,
                CallLatitude: visit.gps?.lat,
                CallLongitude: visit.gps?.lng,
                VisitLocationType: visit.locationType || "Home"
            });
            
            payload.Calls.push({
                CallExternalID: `${visit.id}_OUT`.slice(-16),
                CallDateTime: new Date(visit.endTime).toISOString(),
                CallAssignment: "Time Out",
                CallType: "Mobile",
                ProcedureCode: visit.serviceCode,
                CallLatitude: visit.gps?.lat,
                CallLongitude: visit.gps?.lng,
                VisitLocationType: visit.locationType || "Home"
            });
        }

        return payload;
    }

    async pushVisits(visits) {
        const payload = visits.map(v => this.mapToSandataSchema(v));
        
        console.log(`[SANDATA_V2.5] Pushing ${payload.length} records to Sandata Aggregator.`);

        if (!this.auth || !this.account) {
            console.log('[SANDATA_MOCK_MODE] Payload:', JSON.stringify(payload, null, 2));
            return { success: true, transactionId: `MOCK-${Date.now()}`, status: 'LOCAL_MOCK_SUCCESS' };
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 
                    'Authorization': `Basic ${Buffer.from(this.auth).toString('base64')}`,
                    'Account': this.account,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[SANDATA_API_ERROR]', data);
                const sandataErrors = data.data || [];
                throw new Error(`Sandata Reject: ${JSON.stringify(sandataErrors)}`);
            }

            return { success: true, transactionId: data.id, status: data.status };
        } catch (error) {
            console.error('[SANDATA_PUSH_FAILED]', error.message);
            throw error;
        }
    }
}

module.exports = SandataProxy;
