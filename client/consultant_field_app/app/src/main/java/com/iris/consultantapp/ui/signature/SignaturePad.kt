package com.iris.consultantapp.ui.signature

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp

@Composable
fun SignaturePad(onSignatureCaptured: (Path) -> Unit) {
    var path by remember { mutableStateOf(Path()) }

    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = "Official Signature (F-01201)", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(8.dp))
        
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(Color.White)
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            path.moveTo(offset.x, offset.y)
                        },
                        onDrag = { change, _ ->
                            path.lineTo(change.position.x, change.position.y)
                            // Force redraw (simplified for mock)
                            val newPath = Path()
                            newPath.addPath(path)
                            path = newPath
                        }
                    )
                }
        ) {
            drawPath(
                path = path,
                color = Color.Black,
                style = Stroke(width = 4f)
            )
        }
        
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = { path = Path() }) {
                Text("Clear")
            }
            Button(onClick = { onSignatureCaptured(path) }) {
                Text("Confirm Signature")
            }
        }
    }
}
