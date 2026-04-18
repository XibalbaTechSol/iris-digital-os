/**
 * IRIS Digital OS - EDI 837P X12 Generator
 * Goal: Generate ForwardHealth-compliant X12 loops for 837 Professional Claims.
 * standard: ASC X12N 837 (005010X222A1)
 */
class Edi837pService {
    
    constructor() {
        this.DELIMITER = '*';
        this.SEGMENT_TERMINATOR = '~';
    }

    /**
     * Generate a full interchange envelope for a batch of claims.
     */
    generateFullBatch(batchId, claims, senderNpi, receiverId = 'FORWARDHEALTH') {
        const segments = [];
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
        const dateStr = timestamp.slice(2, 8);
        const timeStr = timestamp.slice(8, 12);

        // ISA: Interchange Control Header
        segments.push(`ISA*00*          *00*          *ZZ*${senderNpi.padEnd(15)}*ZZ*${receiverId.padEnd(15)}*${dateStr}*${timeStr}*^*00501*${batchId.slice(-9)}*0*P*:`);
        
        // GS: Functional Group Header
        segments.push(`GS*HC*${senderNpi}*${receiverId}*${dateStr}${timeStr.slice(0,2)}*${batchId.slice(-9)}*X*005010X222A1`);

        // ST: Transaction Set Header
        segments.push(`ST*837*0001*005010X222A1`);
        
        // BHT: Beginning of Hierarchical Transaction
        segments.push(`BHT*0019*00*${batchId}*${dateStr}${timeStr.slice(0,2)}*CH`);

        // Loop 1000A: Submitter
        segments.push(`NM1*41*2*IRIS_OS_SUBMITTER*****XX*${senderNpi}`);
        segments.push(`PER*IC*SUPPORT*TE*8005550199`);

        // Loop 1000B: Receiver
        segments.push(`NM1*40*2*${receiverId}*****46*WI_DHS_FH`);

        let hlCount = 1;

        claims.forEach((claim, idx) => {
            // Loop 2000A: Billing Provider HL
            const billingHL = hlCount++;
            segments.push(`HL*${billingHL}**20*1`);
            segments.push(`NM1*85*2*${claim.providerName}*****XX*${senderNpi}`);
            segments.push(`N3*${claim.providerAddress}`);
            segments.push(`N4*MADISON*WI*53703`);

            // Loop 2000B: Subscriber HL
            const subHL = hlCount++;
            segments.push(`HL*${subHL}*${billingHL}*22*0`);
            segments.push(`SBR*P*18*******MC`);
            segments.push(`NM1*IL*1*${claim.subscriberLastName}*${claim.subscriberFirstName}****MI*${claim.mci}`);
            segments.push(`DMG*D8*19600101*M`);

            // Loop 2300: Claim Information
            segments.push(`CLM*${claim.id}*${claim.totalAmount}***11:B:1*Y*A*Y*Y`);
            segments.push(`HI*BK:Z719`); // Sample Diagnosis

            // Loop 2400: Service Line
            claim.lines.forEach((line, lineIdx) => {
                segments.push(`LX*${lineIdx + 1}`);
                segments.push(`SV1*HC:${line.procCode}*${line.amount}*UN*${line.units}***1`);
                segments.push(`DTP*472*D8*${line.date}`);
            });
        });

        // Trailers
        segments.push(`SE*${segments.length - 2}*0001`);
        segments.push(`GE*1*${batchId.slice(-9)}`);
        segments.push(`IEA*1*${batchId.slice(-9)}`);

        return segments.join(this.SEGMENT_TERMINATOR) + this.SEGMENT_TERMINATOR;
    }
}

module.exports = new Edi837pService();
