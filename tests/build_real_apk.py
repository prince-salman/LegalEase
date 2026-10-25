import os
import shutil
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"C:\Users\Salman\.gemini\antigravity\scratch\legalease"
BUILD_DIR = os.path.join(ROOT_DIR, "android_build")
SDK_DIR = r"C:\Users\Salman\AppData\Local\Android\Sdk"
BUILD_TOOLS = os.path.join(SDK_DIR, r"build-tools\34.0.0")
PLATFORM_JAR = os.path.join(SDK_DIR, r"platforms\android-34\android.jar")

AAPT = os.path.join(BUILD_TOOLS, "aapt.exe")
D8 = os.path.join(BUILD_TOOLS, "d8.bat")
ZIPALIGN = os.path.join(BUILD_TOOLS, "zipalign.exe")
APKSIGNER = os.path.join(BUILD_TOOLS, "apksigner.bat")

print("Validating SDK tools...")
for tool in [AAPT, D8, ZIPALIGN, APKSIGNER, PLATFORM_JAR]:
    if not os.path.exists(tool):
        print(f"Error: Tool not found at {tool}")
        sys.exit(1)
print("All SDK tools found!")

# Clean and recreate build folders
for sub in ["gen", "obj", "bin", "src/com/legalease/app", "res/values", "res/mipmap-hdpi", "res/mipmap-xhdpi", "res/mipmap-xxhdpi", "assets/www"]:
    os.makedirs(os.path.join(BUILD_DIR, sub), exist_ok=True)

# 1. AndroidManifest.xml
manifest_content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.legalease.app"
    android:versionCode="20401"
    android:versionName="2.4.1">

    <uses-sdk
        android:minSdkVersion="26"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>
</manifest>
"""
with open(os.path.join(BUILD_DIR, "AndroidManifest.xml"), "w", encoding="utf-8") as f:
    f.write(manifest_content)

# 2. res/values/strings.xml
strings_content = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">LegalEase</string>
</resources>
"""
with open(os.path.join(BUILD_DIR, "res/values/strings.xml"), "w", encoding="utf-8") as f:
    f.write(strings_content)

# 3. Copy launcher icons
logo_src = os.path.join(ROOT_DIR, "assets", "logo.png")
for density in ["res/mipmap-hdpi", "res/mipmap-xhdpi", "res/mipmap-xxhdpi"]:
    dest_icon = os.path.join(BUILD_DIR, density, "ic_launcher.png")
    shutil.copy2(logo_src, dest_icon)

# 4. Copy Web Assets into assets/www
web_assets_dir = os.path.join(BUILD_DIR, "assets/www")
for f in ["index.html", "app.js", "styles.css", "manifest.json"]:
    shutil.copy2(os.path.join(ROOT_DIR, f), os.path.join(web_assets_dir, f))

# Also copy assets/ folder into assets/www/assets
shutil.copytree(os.path.join(ROOT_DIR, "assets"), os.path.join(web_assets_dir, "assets"), dirs_exist_ok=True)
# Exclude the large old apk from inside assets/www
old_apk_in_www = os.path.join(web_assets_dir, "assets", "LegalEase-v2.4.1.apk")
if os.path.exists(old_apk_in_www):
    os.remove(old_apk_in_www)

# 5. MainActivity.java (Native Android WebView Host)
main_activity_content = """package com.legalease.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        mWebView = new WebView(this);
        setContentView(mWebView);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUserAgentString(settings.getUserAgentString() + " LegalEaseMobileApp/2.4.1 (Android WebView)");

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Grant camera & microphone for WebRTC Notary Video Call
                request.grant(request.getResources());
            }
        });

        // Load the official LegalEase web application
        mWebView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
"""
with open(os.path.join(BUILD_DIR, "src/com/legalease/app/MainActivity.java"), "w", encoding="utf-8") as f:
    f.write(main_activity_content)

print("Project files generated!")

# STEP 1: AAPT generate R.java
print("1. Running AAPT package to generate R.java...")
cmd_aapt_gen = [
    AAPT, "package", "-m",
    "-J", os.path.join(BUILD_DIR, "gen"),
    "-M", os.path.join(BUILD_DIR, "AndroidManifest.xml"),
    "-S", os.path.join(BUILD_DIR, "res"),
    "-I", PLATFORM_JAR
]
subprocess.run(cmd_aapt_gen, check=True)

# STEP 2: JAVAC compile Java source
print("2. Compiling Java sources with javac...")
r_java = os.path.join(BUILD_DIR, "gen/com/legalease/app/R.java")
main_java = os.path.join(BUILD_DIR, "src/com/legalease/app/MainActivity.java")
cmd_javac = [
    "javac", "-source", "1.8", "-target", "1.8",
    "-cp", PLATFORM_JAR,
    "-d", os.path.join(BUILD_DIR, "obj"),
    r_java, main_java
]
subprocess.run(cmd_javac, check=True)

# STEP 3: D8 Dexing
print("3. Converting classes to DEX with D8...")
class_files = [
    os.path.join(BUILD_DIR, "obj/com/legalease/app/R.class"),
    os.path.join(BUILD_DIR, "obj/com/legalease/app/MainActivity.class"),
    os.path.join(BUILD_DIR, "obj/com/legalease/app/MainActivity$1.class"),
    os.path.join(BUILD_DIR, "obj/com/legalease/app/MainActivity$2.class")
]
# Find all .class files generated
all_classes = []
for root, dirs, files in os.walk(os.path.join(BUILD_DIR, "obj")):
    for file in files:
        if file.endswith(".class"):
            all_classes.append(os.path.join(root, file))

cmd_d8 = [
    D8,
    "--min-api", "26",
    "--output", os.path.join(BUILD_DIR, "bin")
] + all_classes
subprocess.run(cmd_d8, shell=True, check=True)

# STEP 4: AAPT create unaligned APK with assets & dex
print("4. Packaging APK with AAPT...")
unaligned_apk = os.path.join(BUILD_DIR, "bin/unaligned.apk")
if os.path.exists(unaligned_apk):
    os.remove(unaligned_apk)

cmd_aapt_pack = [
    AAPT, "package", "-f",
    "-M", os.path.join(BUILD_DIR, "AndroidManifest.xml"),
    "-S", os.path.join(BUILD_DIR, "res"),
    "-A", os.path.join(BUILD_DIR, "assets"),
    "-I", PLATFORM_JAR,
    "-F", unaligned_apk,
    os.path.join(BUILD_DIR, "bin") # adds classes.dex
]
subprocess.run(cmd_aapt_pack, check=True)

# STEP 5: ZIPALIGN
print("5. Aligning APK with zipalign (4-byte alignment)...")
aligned_apk = os.path.join(BUILD_DIR, "bin/aligned.apk")
if os.path.exists(aligned_apk):
    os.remove(aligned_apk)

cmd_zipalign = [
    ZIPALIGN, "-f", "-v", "4",
    unaligned_apk,
    aligned_apk
]
subprocess.run(cmd_zipalign, check=True)

# STEP 6: Generate Keystore & Sign APK with apksigner
print("6. Generating keystore and signing APK...")
keystore_path = os.path.join(BUILD_DIR, "legalease_release.jks")
if not os.path.exists(keystore_path):
    cmd_keytool = [
        "keytool", "-genkeypair", "-v",
        "-keystore", keystore_path,
        "-alias", "legalease_key",
        "-keyalg", "RSA", "-keysize", "2048",
        "-validity", "10000",
        "-storepass", "legalease2026",
        "-keypass", "legalease2026",
        "-dname", "CN=LegalEase, OU=Mobile, O=LegalEase Indonesia, L=Jakarta, ST=DKI Jakarta, C=ID"
    ]
    subprocess.run(cmd_keytool, check=True)

final_apk_path = os.path.join(ROOT_DIR, "assets/LegalEase-v2.4.1.apk")
if os.path.exists(final_apk_path):
    os.remove(final_apk_path)

cmd_sign = [
    APKSIGNER, "sign",
    "--ks", keystore_path,
    "--ks-pass", "pass:legalease2026",
    "--ks-key-alias", "legalease_key",
    "--key-pass", "pass:legalease2026",
    "--out", final_apk_path,
    aligned_apk
]
subprocess.run(cmd_sign, shell=True, check=True)

# STEP 7: Verify APK Signature with apksigner verify
print("7. Verifying APK with apksigner verify...")
cmd_verify = [
    APKSIGNER, "verify", "--verbose",
    final_apk_path
]
result = subprocess.run(cmd_verify, shell=True, capture_output=True, text=True)
print(result.stdout)
if "Verifies: true" in result.stdout or "Verified using v1 scheme: true" in result.stdout or "Verified using v2 scheme: true" in result.stdout:
    print("SUCCESS: APK is 100% valid, signed, and ready for Android installation!")
else:
    print("WARNING: Check verification output above")

import hashlib
with open(final_apk_path, "rb") as f:
    h = hashlib.sha256(f.read()).hexdigest()
print(f"Final Signed APK Size: {os.path.getsize(final_apk_path)} bytes")
print(f"Final Signed APK SHA-256: {h}")

# Update app.js with the real SHA-256
with open(os.path.join(ROOT_DIR, "app.js"), "r", encoding="utf-8") as f:
    js = f.read()

import re
js = re.sub(r'const sha = "[a-f0-9]{64}";', f'const sha = "{h}";', js)
with open(os.path.join(ROOT_DIR, "app.js"), "w", encoding="utf-8") as f:
    f.write(js)
print("Updated app.js with new genuine SHA-256!")
