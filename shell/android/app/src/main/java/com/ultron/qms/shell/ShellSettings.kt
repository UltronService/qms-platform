package com.ultron.qms.shell

import android.content.Context
import android.provider.Settings
import java.util.UUID

object ShellSettings {
    private const val PREFS = "qms_shell"
    const val KEY_BRAND_ID = "brand_id"
    const val KEY_DEVICE_ID = "device_id"

    fun brandId(context: Context): String {
        val stored = prefs(context).getString(KEY_BRAND_ID, null)
        if (!stored.isNullOrBlank()) {
            return BrandPackPaths.normalizeBrandId(stored)
        }
        return BrandPackPaths.normalizeBrandId(BuildConfig.BRAND_ID)
    }

    fun deviceId(context: Context): String {
        val stored = prefs(context).getString(KEY_DEVICE_ID, null)
        if (!stored.isNullOrBlank()) {
            return stored
        }

        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID,
        )
        if (!androidId.isNullOrBlank()) {
            return androidId
        }

        val generated = UUID.randomUUID().toString()
        prefs(context).edit().putString(KEY_DEVICE_ID, generated).apply()
        return generated
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
