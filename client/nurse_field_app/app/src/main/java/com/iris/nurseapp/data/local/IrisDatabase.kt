package com.iris.nurseapp.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [Visit::class, PcstRecord::class, ClinicalNote::class], version = 1, exportSchema = false)
abstract class IrisDatabase : RoomDatabase() {
    abstract fun irisDao(): IrisDao

    companion object {
        @Volatile
        private var INSTANCE: IrisDatabase? = null

        fun getDatabase(context: Context): IrisDatabase {
            return INSTANCE ?: synchronized(this) {
                // Retrieve the secure passphrase from the Android Keystore
                val passphrase = com.example.evvmobile.security.KeystoreHelper.getOrCreateDbPassword()
                val factory = net.zetetic.database.sqlcipher.SupportFactory(passphrase)

                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    IrisDatabase::class.java,
                    "iris_secure_db"
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
