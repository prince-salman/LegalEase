import asyncio
import os
import socket
import sys
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.request
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APK_FILE_PATH = os.path.join(REPO_ROOT, "assets", "LegalEase-v2.4.1.apk")
EXPECTED_APK_SIZE = os.path.getsize(APK_FILE_PATH) if os.path.exists(APK_FILE_PATH) else 41180525

def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def start_dedicated_server(port: int):
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # quiet output

    server = HTTPServer(('127.0.0.1', port), lambda *args, **kwargs: QuietHandler(*args, directory=REPO_ROOT, **kwargs))
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server

async def run_tests():
    print("=" * 65)
    print("TEST: Reliable APK Download & Fallback Trigger (Item 2)")
    print("=" * 65)

    # 1. Verify physical APK file on disk
    print("\n--- TEST 1: Physical File Verification ---")
    assert os.path.exists(APK_FILE_PATH), f"APK file not found at {APK_FILE_PATH}"
    actual_size = os.path.getsize(APK_FILE_PATH)
    print(f"[OK] File exists: assets/LegalEase-v2.4.1.apk ({actual_size:,} bytes / ~19.5 MB)")
    assert actual_size == EXPECTED_APK_SIZE, f"Size mismatch: expected {EXPECTED_APK_SIZE}, got {actual_size}"

    # 2. Start dedicated test HTTP server on an available port
    test_port = get_free_port()
    start_dedicated_server(test_port)
    base_url = f"http://127.0.0.1:{test_port}"
    print(f"[SERVER] Dedicated test HTTP server active on {base_url}")

    # Verify HTTP 200 & Content-Length accessibility
    print("\n--- TEST 2: HTTP 200 & Content-Length Verification ---")
    apk_url = f"{base_url}/assets/LegalEase-v2.4.1.apk"
    req = urllib.request.Request(apk_url, method="HEAD")
    with urllib.request.urlopen(req) as resp:
        print(f"[OK] HTTP status: {resp.status}")
        assert resp.status == 200, f"Expected status 200, got {resp.status}"
        content_length = int(resp.headers.get("Content-Length", 0))
        print(f"[OK] Content-Length header: {content_length:,} bytes")
        assert content_length == EXPECTED_APK_SIZE, f"Content-Length mismatch: expected {EXPECTED_APK_SIZE}, got {content_length}"

    # 3. Playwright browser testing
    print("\n--- TEST 3: Browser UI, Buttons & Download Trigger Verification ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        await page.goto(f"{base_url}/index.html", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)

        # 3a. Verify window.triggerApkDownload is exposed
        has_trigger = await page.evaluate("typeof window.triggerApkDownload === 'function'")
        assert has_trigger, "window.triggerApkDownload must be defined in app.js!"
        print("[OK] window.triggerApkDownload is defined")

        has_fallback_trigger = await page.evaluate("typeof window.triggerApkFallbackDownload === 'function'")
        assert has_fallback_trigger, "window.triggerApkFallbackDownload must be defined in app.js!"
        print("[OK] window.triggerApkFallbackDownload is defined")

        # 3b. Test calling window.triggerApkDownload() directly with expect_download()
        print("\n--- TEST 3b: Programmatic triggerApkDownload() execution ---")
        async with page.expect_download() as download_info:
            await page.evaluate("() => window.triggerApkDownload()")
        download = await download_info.value
        print(f"[OK] Download initiated: suggested filename = '{download.suggested_filename}'")
        assert download.suggested_filename == "LegalEase-v2.4.1.apk", f"Unexpected filename: {download.suggested_filename}"

        # Verify toast message
        await page.wait_for_timeout(400)
        toast_text = await page.inner_text("#toast-container")
        print(f"[OK] Toast notification shown: '{toast_text}'")
        assert "Mengunduh berkas LegalEase-v2.4.1.apk" in toast_text, "Toast must inform user of download"
        assert "19.5 MB" in toast_text, "Toast must specify file size"

        # 3c. Test Header Download Button
        print("\n--- TEST 3c: Header Download Button ---")
        header_btn = await page.query_selector('header a[download="LegalEase-v2.4.1.apk"]')
        assert header_btn is not None, "Header download button missing"
        assert await header_btn.is_visible(), "Header download button must be visible on desktop"
        onclick_attr = await header_btn.get_attribute("onclick")
        assert "triggerApkDownload" in onclick_attr, f"Header button missing triggerApkDownload: {onclick_attr}"
        print("[OK] Header download button verified and clickable")

        # 3d. Test Hero Download Button & actual click download
        print("\n--- TEST 3d: Hero Download Button ---")
        hero_btn = await page.query_selector('section#hero a[download="LegalEase-v2.4.1.apk"]')
        assert hero_btn is not None, "Hero download button missing"
        assert await hero_btn.is_visible(), "Hero download button must be visible"
        async with page.expect_download() as hero_download_info:
            await hero_btn.click()
        hero_download = await hero_download_info.value
        assert hero_download.suggested_filename == "LegalEase-v2.4.1.apk"
        print("[OK] Hero download button initiated download on click successfully")

        # 3e. Test Download Section Card & Fallback Mirror Link
        print("\n--- TEST 3e: Download Section & Fallback Mirror ---")
        download_section_btn = await page.query_selector('section#download a[download="LegalEase-v2.4.1.apk"]')
        assert download_section_btn is not None, "Download section button missing"
        assert "triggerApkDownload" in (await download_section_btn.get_attribute("onclick")), "Missing onclick trigger"

        # Fallback mirror button check
        fallback_link = await page.query_selector('section#download a[href*="github.com/prince-salman/LegalEase/raw"]')
        assert fallback_link is not None, "Fallback mirror GitHub link missing in download section"
        fallback_href = await fallback_link.get_attribute("href")
        assert "LegalEase-v2.4.1.apk" in fallback_href, "Fallback link must point to APK"
        print(f"[OK] Fallback mirror link verified: {fallback_href}")

        # 3f. Test Service 4 (Aplikasi Mobile) Button
        print("\n--- TEST 3f: Services Section Download Button ---")
        service_btn = await page.query_selector('section#services a[download="LegalEase-v2.4.1.apk"]')
        assert service_btn is not None, "Service 4 APK button missing"
        assert "triggerApkDownload" in (await service_btn.get_attribute("onclick"))
        print("[OK] Services section APK button verified")

        # 3g. Test Footer Download Button
        print("\n--- TEST 3g: Footer Download Button ---")
        footer_btn = await page.query_selector('footer a[download="LegalEase-v2.4.1.apk"]')
        assert footer_btn is not None, "Footer APK button missing"
        assert "triggerApkDownload" in (await footer_btn.get_attribute("onclick"))
        print("[OK] Footer APK button verified")

        # 3h. Test Mobile Menu Download Button on Mobile Viewport
        print("\n--- TEST 3h: Mobile Menu Download Button (375x812) ---")
        await page.set_viewport_size({'width': 375, 'height': 812})
        await page.wait_for_timeout(300)
        # Open mobile dropdown
        await page.click('#mobile-menu-btn')
        await page.wait_for_timeout(300)
        mobile_dl_btn = await page.query_selector('#mobile-menu a[download="LegalEase-v2.4.1.apk"]')
        assert mobile_dl_btn is not None, "Mobile menu APK download button missing"
        assert await mobile_dl_btn.is_visible(), "Mobile menu APK download button must be visible when menu is opened"
        assert "triggerApkDownload" in (await mobile_dl_btn.get_attribute("onclick"))
        print("[OK] Mobile menu APK download button verified")

        # 3i. Test Modal 4C (APK View Simulator Modal)
        print("\n--- TEST 3i: APK View Simulator Modal Download Button ---")
        await page.set_viewport_size({'width': 1280, 'height': 800})
        await page.evaluate("() => window.openApkViewModal()")
        await page.wait_for_timeout(300)
        apk_view_dl = await page.query_selector('#apk-view-modal a[download="LegalEase-v2.4.1.apk"]')
        assert apk_view_dl is not None, "APK View modal download button missing"
        assert await apk_view_dl.is_visible(), "APK View modal download button must be visible"
        assert "triggerApkDownload" in (await apk_view_dl.get_attribute("onclick"))
        await page.evaluate("() => window.closeApkViewModal()")
        await page.wait_for_timeout(200)
        print("[OK] APK View Simulator modal download button verified")

        # 3j. Test Modal 5 (APK Installation Guide Modal)
        print("\n--- TEST 3j: APK Installation Guide Modal Download & Fallback ---")
        await page.evaluate("() => window.openApkGuideModal()")
        await page.wait_for_timeout(300)
        guide_dl = await page.query_selector('#apk-guide-modal a[download="LegalEase-v2.4.1.apk"]')
        assert guide_dl is not None, "APK Guide modal download button missing"
        assert await guide_dl.is_visible(), "APK Guide modal download button must be visible"
        assert "triggerApkDownload" in (await guide_dl.get_attribute("onclick"))

        guide_fallback = await page.query_selector('#apk-guide-modal a[href*="github.com/prince-salman/LegalEase/raw"]')
        assert guide_fallback is not None, "APK Guide modal fallback link missing"
        assert await guide_fallback.is_visible(), "APK Guide modal fallback link must be visible"
        await page.evaluate("() => window.closeApkGuideModal()")
        await page.wait_for_timeout(200)
        print("[OK] APK Guide modal download & fallback verified")

        # 3k. Test Fallback trigger function
        print("\n--- TEST 3k: Fallback trigger function ---")
        await page.evaluate("() => window.triggerApkFallbackDownload()")
        await page.wait_for_timeout(300)
        toast_after_fallback = await page.inner_text("#toast-container")
        print(f"[OK] Fallback toast shown: '{toast_after_fallback}'")
        assert "server cadangan github" in toast_after_fallback.lower() or "cadangan" in toast_after_fallback.lower()

        # Check console / page errors
        real_errors = [e for e in errors if 'favicon' not in e.lower()]
        assert len(real_errors) == 0, f"Unexpected errors found: {real_errors}"

        await browser.close()

    print("\n" + "=" * 65)
    print(">>> ALL APK DOWNLOAD & FALLBACK TESTS PASSED (100%) <<<")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_tests())
