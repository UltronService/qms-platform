package com.ultron.qms.shell

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class KioskActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var packError: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_kiosk)
        applyFullscreen()

        webView = findViewById(R.id.kioskWebView)
        packError = findViewById(R.id.packError)

        configureWebView(webView)
        webView.requestFocus()

        val brandId = ShellSettings.brandId(this)
        when (val source = BrandPackLocator.resolve(this, brandId)) {
            is BrandPackSource.External -> loadPack(source.url, brandId)
            is BrandPackSource.Asset -> loadPack(source.url, brandId)
            is BrandPackSource.Missing -> showMissingPack(source)
        }
    }

    override fun onResume() {
        super.onResume()
        applyFullscreen()
        forceAudioResume()
        webView.requestFocus()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (!hasFocus) {
            return
        }
        applyFullscreen()
        webView.requestFocus()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView(view: WebView) {
        view.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_NO_CACHE
        }
        view.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                injectDeviceId(view)
                forceAudioResume()
            }
        }
    }

    private fun loadPack(url: String, brandId: String) {
        packError.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.tag = brandId
        webView.loadUrl(url)
    }

    private fun showMissingPack(missing: BrandPackSource.Missing) {
        webView.visibility = View.GONE
        packError.visibility = View.VISIBLE
        packError.text = getString(R.string.pack_missing_title) + "\n\n" + getString(
            R.string.pack_missing_body,
            missing.brandId,
            missing.attempted.joinToString("\n"),
        )
    }

    private fun injectDeviceId(view: WebView) {
        val brandId = view.tag as? String ?: ShellSettings.brandId(this)
        val deviceId = ShellSettings.deviceId(this)
        val js = """
            (function() {
              var shell = window.__QMS_SHELL__ = window.__QMS_SHELL__ || {};
              shell.brandId = ${jsonString(brandId)};
              shell.deviceId = ${jsonString(deviceId)};
              var state = window.__QMS_STATE__;
              if (!state || typeof state !== 'object') { return; }
              var prefs = state.prefs;
              if (!prefs || typeof prefs !== 'object') {
                state.prefs = { deviceId: shell.deviceId };
                return;
              }
              var existing = prefs.deviceId;
              if (existing === undefined || existing === null || existing === '') {
                prefs.deviceId = shell.deviceId;
              }
            })();
        """.trimIndent()
        view.evaluateJavascript(js, null)
    }

    private fun forceAudioResume() {
        val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build(),
                )
                .build()
            audioManager.requestAudioFocus(request)
        } else {
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN,
            )
        }
        if (webView.visibility != View.VISIBLE) {
            return
        }
        webView.evaluateJavascript(RESUME_MEDIA_JS, null)
    }

    private fun applyFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    private fun jsonString(value: String): String {
        val escaped = value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
        return "\"$escaped\""
    }

    private companion object {
        const val RESUME_MEDIA_JS = """
            (function() {
              document.querySelectorAll('audio,video').forEach(function(el) {
                try { el.muted = false; } catch (e) {}
                var play = el.play;
                if (typeof play === 'function') {
                  try { play.call(el).catch(function() {}); } catch (e) {}
                }
              });
            })();
        """
    }
}
