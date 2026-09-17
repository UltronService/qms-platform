package com.ultron.qms.shell

import android.content.Context
import android.content.res.AssetManager
import android.net.Uri
import java.io.File
import java.io.IOException

sealed class BrandPackSource {
    data class External(val indexFile: File) : BrandPackSource() {
        val url: String get() = Uri.fromFile(indexFile).toString()
    }

    data class Asset(val assetPath: String) : BrandPackSource() {
        val url: String get() = BrandPackPaths.assetUrl(assetPath)
    }

    data class Missing(
        val brandId: String,
        val attempted: List<String>,
    ) : BrandPackSource()
}

object BrandPackLocator {
    fun resolve(context: Context, brandId: String): BrandPackSource {
        val id = BrandPackPaths.normalizeBrandId(brandId)
        val attempted = BrandPackPaths.attemptedLocations(id)

        val external = File(BrandPackPaths.externalIndexPath(id))
        if (external.isFile) {
            return BrandPackSource.External(external)
        }

        val brandAsset = BrandPackPaths.assetBrandIndexPath(id)
        if (assetExists(context.assets, brandAsset)) {
            return BrandPackSource.Asset(brandAsset)
        }

        if (assetExists(context.assets, BrandPackPaths.ASSET_WWW_INDEX)) {
            return BrandPackSource.Asset(BrandPackPaths.ASSET_WWW_INDEX)
        }

        return BrandPackSource.Missing(id, attempted)
    }

    private fun assetExists(assets: AssetManager, path: String): Boolean {
        return try {
            assets.open(path).use { true }
        } catch (_: IOException) {
            false
        }
    }
}
