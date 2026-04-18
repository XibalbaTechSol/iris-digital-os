/**
 * IRIS Digital OS - SDOH & Hospitalization Risk Service
 * Pattern: Predictive Clinical Analytics (Competitor: WellSky / HomeCareHomeBase)
 * Goal: Identify "Vulnerable/High-Risk" participants based on SDOH indicators.
 */

class SDOHService {
    static RISK_FACTORS = [
        { key: 'FALL_RISK', patterns: ['fell', 'tripped', 'slipped', 'balance', 'floor'] },
        { key: 'ISOLATION', patterns: ['alone', 'no family', 'caregiver absent', 'missed shift'] },
        { key: 'CLINICAL_FRAILTY', patterns: ['oxygen', 'concentrator', 'machine', 'equipment failing'] },
        { key: 'MED_ERROR', patterns: ['missed meds', 'confused', 'medication error'] }
    ];

    /**
     * Analyze text input (Incident / Note) for SDOH risks.
     */
    async analyzeRisk(textContent) {
        console.log('[SDOH_AI] ANALYZING_HOSPITALIZATION_PROPENSITY...');
        
        const contentLower = textContent.toLowerCase();
        const detectedRisks = [];
        let score = 0;

        SDOHService.RISK_FACTORS.forEach(risk => {
            const matches = risk.patterns.filter(p => contentLower.includes(p));
            if (matches.length > 0) {
                detectedRisks.push({
                    factor: risk.key,
                    severity: 'HIGH',
                    indicator: matches[0]
                });
                score += 25; // 25 points per risk category
            }
        });

        // 2026 DHS VHRP Logic: Add 15 points if "caregiver absent" is detected
        if (contentLower.includes('caregiver absent')) {
            score += 15;
            detectedRisks.push({ factor: 'NETWORK_FRAGILITY', severity: 'CRITICAL', indicator: 'absence' });
        }

        return {
            hpsScore: Math.min(100, score), // Hospitalization Propensity Score
            vulnerabilityLevel: score > 60 ? 'CRITICAL' : (score > 30 ? 'ELEVATED' : 'STABLE'),
            detectedRisks,
            recommendation: this.getRecommendation(score, detectedRisks),
            timestamp: new Date().toISOString()
        };
    }

    getRecommendation(score, risks) {
        if (score > 60) return "IMMEDIATE_ACTION: Schedule RN assessment and contact primary care physician.";
        if (score > 30) return "ELEVATED_WATCH: Increase IC monitoring frequency (VHRP Policy).";
        return "ROUTINE_MONITORING: Participant remains in stable clinical status.";
    }
}

module.exports = new SDOHService();
