package com.iris.nurseapp.clinical

import org.junit.Test
import org.junit.Assert.*

class PcstCalculatorTest {
    @Test
    fun testHighNeedAllocation() {
        val scores = PcstCalculator.AdlScores(5, 5, 5, 5, 5, 5) // Total 30
        val units = PcstCalculator.calculateAllocatedUnits(scores)
        assertEquals(40, units)
    }

    @Test
    fun testLowNeedAllocation() {
        val scores = PcstCalculator.AdlScores(1, 1, 1, 1, 1, 1) // Total 6
        val units = PcstCalculator.calculateAllocatedUnits(scores)
        assertEquals(12, units)
    }
}
