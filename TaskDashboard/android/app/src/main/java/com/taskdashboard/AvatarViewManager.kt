package com.taskdashboard

import android.content.Context
import android.graphics.*
import android.graphics.drawable.ShapeDrawable
import android.graphics.drawable.shapes.OvalShape
import android.widget.TextView
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import kotlin.math.abs

/**
 * AvatarViewManager — Kotlin React Native Native UI Component.
 *
 * Renders a circular view with:
 *  - Initials computed from the `name` prop (max 2 words, first letter each)
 *  - Background color derived from a hash of the `name` string (HSL-based,
 *    always readable: 40–70% saturation, 35–55% lightness, avoiding near-black/white)
 *
 * Usage in JS/TS:
 *   <NativeAvatarView name="John Doe" style={{ width: 44, height: 44 }} />
 */
class AvatarViewManager : SimpleViewManager<TextView>() {

    override fun getName(): String = "AvatarView"

    override fun createViewInstance(reactContext: ThemedReactContext): TextView {
        return TextView(reactContext).apply {
            gravity = android.view.Gravity.CENTER
            setTextColor(Color.WHITE)
            textSize = 16f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
    }

    @ReactProp(name = "name")
    fun setName(view: TextView, name: String?) {
        val safeName = name ?: ""
        val initials = computeInitials(safeName)
        val bgColor = computeColor(safeName)

        view.text = initials

        // Circular background via ShapeDrawable
        val oval = ShapeDrawable(OvalShape())
        oval.paint.color = bgColor
        view.background = oval
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Extracts up to 2 initials from a name string.
     * "John Doe" → "JD", "Alice" → "A", "" → "?"
     */
    private fun computeInitials(name: String): String {
        val words = name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
        return when {
            words.isEmpty() -> "?"
            words.size == 1 -> words[0][0].uppercaseChar().toString()
            else -> "${words[0][0].uppercaseChar()}${words[1][0].uppercaseChar()}"
        }
    }

    /**
     * Generates a stable, visually-pleasant background color from a name hash.
     *
     * Algorithm:
     *   1. Hash the name string
     *   2. Map hash → Hue (0–359°)
     *   3. Fix Saturation = 55%, Lightness = 45% → always readable on white text
     */
    private fun computeColor(name: String): Int {
        val hash = name.fold(0) { acc, c -> (acc shl 5) - acc + c.code }
        val hue = abs(hash % 360).toFloat()
        return hslToColor(hue, 0.55f, 0.45f)
    }

    /**
     * Converts HSL values to an ARGB Android Color integer.
     */
    private fun hslToColor(h: Float, s: Float, l: Float): Int {
        val c = (1f - Math.abs(2f * l - 1f)) * s
        val x = c * (1f - Math.abs((h / 60f) % 2f - 1f))
        val m = l - c / 2f

        val (r1, g1, b1) = when {
            h < 60f  -> Triple(c, x, 0f)
            h < 120f -> Triple(x, c, 0f)
            h < 180f -> Triple(0f, c, x)
            h < 240f -> Triple(0f, x, c)
            h < 300f -> Triple(x, 0f, c)
            else     -> Triple(c, 0f, x)
        }

        return Color.rgb(
            ((r1 + m) * 255).toInt().coerceIn(0, 255),
            ((g1 + m) * 255).toInt().coerceIn(0, 255),
            ((b1 + m) * 255).toInt().coerceIn(0, 255),
        )
    }
}
