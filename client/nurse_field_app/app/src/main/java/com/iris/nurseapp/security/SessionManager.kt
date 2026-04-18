package com.iris.nurseapp.security

object SessionManager {
    fun getToken(): String = "mock-token"
    fun isSessionValid(): Boolean = true
    fun logout() {}
}
