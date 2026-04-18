package com.iris.nurseapp.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface IrisDao {
    @Query("SELECT * FROM visits ORDER BY startTime DESC")
    suspend fun getAllVisits(): List<Visit>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVisit(visit: Visit)

    @Query("SELECT * FROM pcst_records WHERE syncStatus = 'PENDING'")
    suspend fun getPendingPcstRecords(): List<PcstRecord>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPcstRecord(record: PcstRecord)

    @Query("UPDATE pcst_records SET syncStatus = :status WHERE id = :id")
    suspend fun updatePcstSyncStatus(id: String, status: String)

    @Query("SELECT * FROM clinical_notes WHERE visitId = :visitId")
    suspend fun getNotesForVisit(visitId: String): List<ClinicalNote>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: ClinicalNote)
}
