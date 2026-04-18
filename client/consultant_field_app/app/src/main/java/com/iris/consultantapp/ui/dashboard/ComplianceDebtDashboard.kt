package com.iris.consultantapp.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

data class ComplianceItem(val title: String, val dueDate: String, val riskLevel: String)

@Composable
fun ComplianceDebtDashboard() {
    val debtItems = listOf(
        ComplianceItem("ISSP Renewal - John Doe", "2026-04-20", "CRITICAL"),
        ComplianceItem("LTC FS - Jane Smith", "2026-04-25", "HIGH"),
        ComplianceItem("EVV Gap - Robert Wilson", "2026-04-18", "CRITICAL")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Compliance Command Center",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
        ) {
            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Warning, contentDescription = "Alert", tint = MaterialTheme.colorScheme.error)
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "3 Critical Compliance Gaps Detected",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(debtItems) { item ->
                ComplianceDebtCard(item)
            }
        }
    }
}

@Composable
fun ComplianceDebtCard(item: ComplianceItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = item.title, style = MaterialTheme.typography.titleSmall)
                Text(text = "Due: ${item.dueDate}", style = MaterialTheme.typography.bodySmall)
            }
            Badge(
                containerColor = if (item.riskLevel == "CRITICAL") MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary
            ) {
                Text(text = item.riskLevel, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
            }
        }
    }
}
