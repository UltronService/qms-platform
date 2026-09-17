plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val configuredBrandId: String =
    (project.findProperty("qms.brandId") as String?)?.trim().orEmpty().ifEmpty { "www" }

android {
    namespace = "com.ultron.qms.shell"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ultron.qms.shell"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-skeleton"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    flavorDimensions += "brand"
    productFlavors {
        // Generic / single-pack APK. brandId comes from qms.brandId (default www).
        create("generic") {
            dimension = "brand"
            buildConfigField("String", "BRAND_ID", "\"$configuredBrandId\"")
            resValue("string", "brand_id", configuredBrandId)
        }
        // Example per-brand flavor (no assets in this skeleton):
        // create("guiji") {
        //     dimension = "brand"
        //     applicationIdSuffix = ".guiji"
        //     buildConfigField("String", "BRAND_ID", "\"guiji\"")
        //     resValue("string", "brand_id", "guiji")
        // }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-ktx:1.15.0")
    testImplementation("junit:junit:4.13.2")
}
