package com.iris.nurseapp.location

object LocationService {
    fun getCurrentLocation(): String {
        return "43.0731,-89.4012" // Mock coordinates
    }
}

object GeofenceValidator {
    fun isValidLocation(lat: Double, lng: Double): Boolean {
        return true
    }
}
