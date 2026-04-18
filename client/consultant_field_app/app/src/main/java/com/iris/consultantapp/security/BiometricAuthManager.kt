package com.iris.consultantapp.security

object BiometricAuthManager {
    fun authenticate(onSuccess: () -> Unit, onError: (String) -> Unit) {
        // Mock biometric success for MVP
        onSuccess()
    }
}
