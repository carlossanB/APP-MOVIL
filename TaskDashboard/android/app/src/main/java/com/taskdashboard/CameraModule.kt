package com.taskdashboard

import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * CameraModule — React Native NativeModule for Android camera integration.
 *
 * Features:
 *  - Fires an ACTION_IMAGE_CAPTURE intent
 *  - Saves the captured image to the app's private internal storage
 *    (filesDir/photos/) — not accessible by other apps, no WRITE_EXTERNAL permission needed
 *  - Returns a persistent file:// URI to JavaScript via Promise
 *  - Handles permission checks for runtime CAMERA permission (Android 6+)
 *  - Properly handles onActivityResult via ActivityEventListener
 *
 * Usage from JS:
 *   const uri = await CameraModule.launchCamera();
 */
class CameraModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var pendingPromise: Promise? = null
    private var currentPhotoFile: File? = null

    companion object {
        private const val REQUEST_IMAGE_CAPTURE = 1001
        private const val CAMERA_PERM = android.Manifest.permission.CAMERA
        private const val E_ACTIVITY_DNE = "E_ACTIVITY_DNE"
        private const val E_CAMERA_UNAVAILABLE = "E_CAMERA_UNAVAILABLE"
        private const val E_PERMISSION_DENIED = "E_PERMISSION_DENIED"
        private const val E_CANCELLED = "E_CANCELLED"
        private const val E_FAILED = "E_FAILED"
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "CameraModule"

    // ── React Method ─────────────────────────────────────────────────────────

    @ReactMethod
    fun launchCamera(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject(E_ACTIVITY_DNE, "Activity is null — cannot launch camera.")
            return
        }

        // Check camera hardware
        if (!activity.packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)) {
            promise.reject(E_CAMERA_UNAVAILABLE, "No camera hardware found on device.")
            return
        }

        // Runtime permission check (Android 6.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (activity.checkSelfPermission(CAMERA_PERM) != PackageManager.PERMISSION_GRANTED) {
                promise.reject(E_PERMISSION_DENIED, "CAMERA permission not granted. Request it in JS with PermissionsAndroid first.")
                return
            }
        }

        // Create private output file
        val photoFile: File = try {
            createImageFile()
        } catch (ex: IOException) {
            promise.reject(E_FAILED, "Could not create image file: ${ex.message}")
            return
        }

        currentPhotoFile = photoFile
        pendingPromise = promise

        // File URI via FileProvider (required for Android 7+)
        val photoUri: Uri = FileProvider.getUriForFile(
            reactContext,
            "${reactContext.packageName}.fileprovider",
            photoFile,
        )

        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
            putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        }

        if (intent.resolveActivity(activity.packageManager) != null) {
            activity.startActivityForResult(intent, REQUEST_IMAGE_CAPTURE)
        } else {
            pendingPromise = null
            currentPhotoFile = null
            promise.reject(E_CAMERA_UNAVAILABLE, "No camera app found to handle the intent.")
        }
    }

    // ── ActivityEventListener ────────────────────────────────────────────────

    override fun onActivityResult(
        activity: Activity?,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        if (requestCode != REQUEST_IMAGE_CAPTURE) return

        val promise = pendingPromise ?: return
        pendingPromise = null

        when (resultCode) {
            Activity.RESULT_OK -> {
                val file = currentPhotoFile
                if (file != null && file.exists() && file.length() > 0) {
                    promise.resolve("file://${file.absolutePath}")
                } else {
                    promise.reject(E_FAILED, "Captured file is missing or empty.")
                }
            }
            Activity.RESULT_CANCELED -> {
                promise.reject(E_CANCELLED, "User cancelled the camera.")
            }
            else -> {
                promise.reject(E_FAILED, "Camera returned unexpected result code: $resultCode")
            }
        }
        currentPhotoFile = null
    }

    override fun onNewIntent(intent: Intent?) = Unit

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Creates a unique image file in the app's private storage.
     * Path: /data/data/<package>/files/photos/IMG_<timestamp>.jpg
     *
     * This directory is private to the app — no external storage permission needed.
     */
    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val photosDir = File(reactContext.filesDir, "photos").apply {
            if (!exists()) mkdirs()
        }
        return File(photosDir, "IMG_${timeStamp}.jpg")
    }
}
