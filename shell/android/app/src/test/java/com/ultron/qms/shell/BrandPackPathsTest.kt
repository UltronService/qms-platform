package com.ultron.qms.shell

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class BrandPackPathsTest {
    @Test
    fun attemptedLocationsPreferSdcardThenBrandThenWww() {
        val paths = BrandPackPaths.attemptedLocations("guiji")
        assertEquals(
            listOf(
                "/sdcard/qms/guiji/index.html",
                "file:///android_asset/brands/guiji/index.html",
                "file:///android_asset/www/index.html",
            ),
            paths,
        )
    }

    @Test
    fun normalizeBrandIdRejectsPathTraversal() {
        assertEquals("www", BrandPackPaths.normalizeBrandId("../etc"))
        assertEquals("www", BrandPackPaths.normalizeBrandId("a/b"))
        assertEquals("guiji", BrandPackPaths.normalizeBrandId(" guiji "))
        assertFalse(BrandPackPaths.externalIndexPath("../etc").contains(".."))
    }
}
