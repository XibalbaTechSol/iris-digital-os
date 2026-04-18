package com.iris.nurseapp.clinical

/**
 * IRIS Digital OS - PCST Calculator (Mobile Mirror)
 * Mirrors the logic in pcst_service.js for real-time field calculation.
 */
object PcstCalculator {
    data class AdlScores(
        val bathing: Int,
        val dressing: Int,
        val toileting: Int,
        val transferring: Int,
        val mobility: Int,
        val eating: Int
    )

    fun calculateAllocatedUnits(scores: AdlScores): Int {
        var baseUnits = 0
        
        // Simplified Wisconsin PCST Unit Logic
        val totalAdlScore = scores.bathing + scores.dressing + scores.toileting + 
                           scores.transferring + scores.mobility + scores.eating
        
        baseUnits = when {
            totalAdlScore > 20 -> 40 // High need
            totalAdlScore > 10 -> 24 // Moderate need
            else -> 12 // Low need
        }
        
        return baseUnits
    }
}
