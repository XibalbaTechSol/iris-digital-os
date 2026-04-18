package com.iris.consultantapp.data.local

import androidx.room.*

@Dao
interface ConsultantDao {
    @Query("SELECT * FROM issp_records ORDER BY createdAt DESC")
    suspend fun getAllIsspRecords(): List<IsspRecord>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIsspRecord(record: IsspRecord)

    @Query("SELECT * FROM compliance_alerts ORDER BY timestamp DESC")
    suspend fun getAlerts(): List<ComplianceAlert>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlert(alert: ComplianceAlert)
}
