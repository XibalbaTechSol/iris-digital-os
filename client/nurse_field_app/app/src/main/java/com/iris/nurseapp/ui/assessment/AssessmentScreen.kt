package com.iris.nurseapp.ui.assessment

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.iris.nurseapp.clinical.PcstCalculator

@Composable
fun AssessmentScreen() {
    var bathing by remember { mutableStateOf(0f) }
    var dressing by remember { mutableStateOf(0f) }
    var toileting by remember { mutableStateOf(0f) }
    
    val currentUnits = PcstCalculator.calculateAllocatedUnits(
        PcstCalculator.AdlScores(bathing.toInt(), dressing.toInt(), toileting.toInt(), 0, 0, 0)
    )

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 100.dp)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                Text(text = "PCST Assessment", style = MaterialTheme.typography.headlineMedium)
            }
            
            item {
                AdlItem("Bathing", bathing) { bathing = it }
            }
            item {
                AdlItem("Dressing", dressing) { dressing = it }
            }
            item {
                AdlItem("Toileting", toileting) { toileting = it }
            }
        }

        // Unit Accumulator HUD
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth(),
            tonalElevation = 8.dp,
            shadowElevation = 8.dp,
            color = MaterialTheme.colorScheme.primaryContainer
        ) {
            Row(
                modifier = Modifier
                    .padding(24.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "Real-time Allocation", style = MaterialTheme.typography.labelSmall)
                    Text(text = "$currentUnits Units / Week", style = MaterialTheme.typography.headlineSmall)
                }
                Button(onClick = { /* Save Draft */ }) {
                    Text("Save Draft")
                }
            }
        }
    }
}

@Composable
fun AdlItem(label: String, value: Float, onValueChange: (Float) -> Unit) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(text = label, style = MaterialTheme.typography.titleMedium)
            Text(text = value.toInt().toString(), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = 0f..10f,
            steps = 9
        )
    }
}
