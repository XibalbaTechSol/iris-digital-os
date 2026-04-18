package com.iris.consultantapp.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.*

@Entity(tableName = "issp_records")
data class IsspRecord(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val participantId: String,
    val content: String,
    val signatureBase64: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING"
)

@Entity(tableName = "compliance_alerts")
data class ComplianceAlert(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val type: String,
    val message: String,
    val severity: String,
    val timestamp: Long = System.currentTimeMillis()
)
