/**
 * IRIS Digital OS - AI PDF Mapper (Automation Phase)
 * Pattern: Dynamic Form Population (Competitor: WellSky / AlayaCare)
 * Goal: Automate the mapping of Iris Data to PDF AcroForm tags.
 */

class AIPDFMapper {
    /**
     * IRIS Data Dictionary - The "Source of Truth"
     */
    static DATA_MAP = {
        "participant": {
            "first_name": "participant.firstName",
            "last_name": "participant.lastName",
            "dob": "participant.dob",
            "mci": "participant.mci",
            "address_full": "participant.address"
        },
        "worker": {
            "first_name": "worker.firstName",
            "last_name": "worker.lastName",
            "npi": "worker.npi",
            "employee_id": "worker.workerId"
        }
    };

    /**
     * Smart Map: Automatically pair PDF field tags with Iris data keys.
     * Benchmarked Enterprise Feature: One-Click Documentation.
     */
    async intelligentMap(pdfFieldTags) {
        console.log(`[AI_MAPPER] ANALYZING_${pdfFieldTags.length}_TAGS...`);
        
        const mappedData = {};
        const suggestions = [];

        pdfFieldTags.forEach(tag => {
            // Logic: Fuzzy Match / Tag Normalization
            const normalized = tag.toLowerCase().replace(/_/g, '').replace(/\s/g, '');
            
            // Search for matches in Participant/Worker contexts
            let match = null;
            
            if (normalized.includes('patient') || normalized.includes('member') || normalized.includes('recipient')) {
                match = this.findBestMatch(normalized, 'participant');
            } else if (normalized.includes('caregiver') || normalized.includes('worker') || normalized.includes('provider')) {
                match = this.findBestMatch(normalized, 'worker');
            } else {
                // Global search
                match = this.findBestMatch(normalized, 'participant') || this.findBestMatch(normalized, 'worker');
            }

            if (match) {
                mappedData[tag] = match.irisKey;
                suggestions.push({ tag, irisKey: match.irisKey, confidence: match.confidence });
            }
        });

        console.log(`[AI_MAPPER] SMART_MAP_COMPLETE: ${suggestions.length} matches found.`);
        return { mappedData, suggestions };
    }

    findBestMatch(normalizedTag, context) {
        const contextMap = AIPDFMapper.DATA_MAP[context];
        for (const [shortKey, irisKey] of Object.entries(contextMap)) {
            if (normalizedTag.includes(shortKey)) {
                return { irisKey, confidence: 0.95 };
            }
        }
        return null;
    }
}

module.exports = new AIPDFMapper();
