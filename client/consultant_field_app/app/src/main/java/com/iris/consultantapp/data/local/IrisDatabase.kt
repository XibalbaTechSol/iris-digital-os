package com.iris.consultantapp.data.local

import android.content.Context
import androidx.room.*
import com.example.consultantfieldapp.security.KeystoreHelper

@Database(entities = [IsspRecord::class, ComplianceAlert::class], version = 1, exportSchema = false)
abstract class IrisDatabase : RoomDatabase() {
    abstract fun consultantDao(): ConsultantDao

    companion object {
        @Volatile
        private var INSTANCE: IrisDatabase? = null

        fun getDatabase(context: Context): IrisDatabase {
            return INSTANCE ?: synchronized(this) {
                // Retrieve the secure passphrase from the Consultant-specific Android Keystore
                val passphrase = KeystoreHelper.getOrCreateDbPassword()
                val factory = net.zetetic.database.sqlcipher.SupportFactory(passphrase)

                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    IrisDatabase::class.java,
                    "iris_consultant_db"
                )
                .openHelperFactory(factory)
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
