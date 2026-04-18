package com.iris.nurseapp.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.*

@Entity(tableName = "visits")
data class Visit(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val participantId: String,
    val startTime: Long,
    val endTime: Long? = null,
    val locationLat: Double? = null,
    val locationLng: Double? = null,
    val syncStatus: String = "PENDING"
)

@Entity(tableName = "pcst_records")
data class PcstRecord(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val participantId: String,
    val adlData: String, // JSON blob for ADLs
    val allocatedUnits: Int,
    val signatureBase64: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING"
)

@Entity(tableName = "clinical_notes")
data class ClinicalNote(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val visitId: String,
    val content: String,
    val noteType: String = "SOAP",
    val isScribeGenerated: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING"
)
