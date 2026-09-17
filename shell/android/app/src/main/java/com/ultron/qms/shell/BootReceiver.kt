package com.ultron.qms.shell

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_LOCKED_BOOT_COMPLETED
        ) {
            return
        }

        val launch = Intent(context, KioskActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        try {
            context.startActivity(launch)
        } catch (error: RuntimeException) {
            // Android 10+ blocks background Activity starts unless this app is
            // the launcher, a device owner, or holds a privileged exemption.
            Log.w(TAG, "BOOT_COMPLETED could not start KioskActivity", error)
        }
    }

    private companion object {
        const val TAG = "QmsBootReceiver"
    }
}
