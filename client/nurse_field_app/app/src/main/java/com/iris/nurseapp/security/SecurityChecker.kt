package com.iris.nurseapp.security

import android.view.Window
import android.view.WindowManager

object SecurityChecker {
    fun applySecureFlag(window: Window) {
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
    }
    
    fun isDeviceRooted(): Boolean {
        return false 
    }
}
