package com.iris.nurseapp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val MedicalBlue = Color(0xFF01579B)
private val MedicalLightBlue = Color(0xFFE0F2FE)
private val TerminalGreen = Color(0xFF10B981)
private val DarkBg = Color(0xFF0F172A)
private val DarkSurface = Color(0xFF1E293B)

private val LightColorScheme = lightColorScheme(
    primary = MedicalBlue,
    secondary = TerminalGreen,
    surface = Color.White,
    background = Color(0xFFF8FAFC),
    onPrimary = Color.White,
    onSecondary = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = MedicalLightBlue,
    secondary = TerminalGreen,
    surface = DarkSurface,
    background = DarkBg,
    onPrimary = DarkBg,
    onSecondary = DarkBg
)

@Composable
fun IrisTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(), // Standard Typography for now
        content = content
    )
}
