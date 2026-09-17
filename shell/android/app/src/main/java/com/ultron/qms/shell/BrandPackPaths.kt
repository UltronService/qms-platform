package com.ultron.qms.shell

object BrandPackPaths {
    const val EXTERNAL_ROOT = "/sdcard/qms"
    const val ASSET_WWW_INDEX = "www/index.html"

    fun normalizeBrandId(raw: String): String {
        val id = raw.trim()
        if (id.isEmpty() || id.contains("..") || id.contains('/') || id.contains('\\')) {
            return "www"
        }
        return id
    }

    fun externalIndexPath(brandId: String): String =
        "$EXTERNAL_ROOT/${normalizeBrandId(brandId)}/index.html"

    fun assetBrandIndexPath(brandId: String): String =
        "brands/${normalizeBrandId(brandId)}/index.html"

    fun assetUrl(assetPath: String): String = "file:///android_asset/$assetPath"

    fun attemptedLocations(brandId: String): List<String> {
        val id = normalizeBrandId(brandId)
        return listOf(
            externalIndexPath(id),
            assetUrl(assetBrandIndexPath(id)),
            assetUrl(ASSET_WWW_INDEX),
        )
    }
}
