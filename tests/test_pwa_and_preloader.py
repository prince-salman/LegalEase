import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=== TESTING PWA INSTALL BANNER & APP PRELOADER ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console messages to confirm no uncaught errors
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        # 1. Load application
        await page.goto('http://127.0.0.1:8000', wait_until='networkidle')
        await page.wait_for_timeout(300)

        # 2. Check App Preloader in DOM
        preloader_count = await page.locator('#app-preloader').count()
        assert preloader_count == 1, "App Preloader must exist in DOM"
        print("✓ #app-preloader found in DOM")

        # Verify preloader internal elements
        assert await page.locator('#preloader-progress-bar').count() == 1, "#preloader-progress-bar missing"
        assert await page.locator('#preloader-status-text').count() == 1, "#preloader-status-text missing"
        assert await page.locator('#preloader-percent-text').count() == 1, "#preloader-percent-text missing"
        print("✓ Preloader progress bar and status elements verified")

        # 3. Check PWA Install Notification Banner
        banner_count = await page.locator('#pwa-install-banner').count()
        assert banner_count == 1, "#pwa-install-banner must exist in DOM"
        print("✓ #pwa-install-banner found in DOM")

        # Test showing PWA Banner (force=true for test environment)
        await page.evaluate("() => { if (typeof window.checkAndShowPwaBanner === 'function') window.checkAndShowPwaBanner(true); }")
        await page.wait_for_timeout(200)

        # Check install button
        install_btn = page.locator('#pwa-install-btn')
        assert await install_btn.count() == 1, "Install button #pwa-install-btn missing"
        install_text = await install_btn.inner_text()
        assert "Pasang" in install_text, f"Install button text mismatch: {install_text}"
        print("✓ PWA Install button present and labeled correctly:", install_text.strip())

        # Check dismiss capability ("tpi bisa di hapussss")
        dismiss_btns = await page.locator('#pwa-install-banner button[onclick*="dismissPwaInstallBanner"]').count()
        assert dismiss_btns >= 2, f"Expected at least 2 dismiss controls ('X' button and 'Nanti Saja'), found {dismiss_btns}"
        print(f"✓ Found {dismiss_btns} dismiss controls (X icon and Nanti Saja button)")

        # Test Dismiss Action
        await page.evaluate("() => window.dismissPwaInstallBanner()")
        await page.wait_for_timeout(400)

        is_dismissed = await page.evaluate("() => sessionStorage.getItem('legalease_pwa_dismissed')")
        assert is_dismissed == "true", f"Expected sessionStorage flag 'true', got: {is_dismissed}"
        print("✓ Banner successfully dismissed and recorded in sessionStorage")

        # 4. Test triggerPwaInstallPrompt opens modal on standard web
        await page.evaluate("() => window.triggerPwaInstallPrompt()")
        await page.wait_for_timeout(200)

        guide_visible = await page.locator('#apk-guide-modal').is_visible()
        assert guide_visible, "triggerPwaInstallPrompt should display guide modal"
        print("✓ triggerPwaInstallPrompt opens installation guidance modal cleanly")

        # Close guide modal
        await page.evaluate("() => window.closeApkGuideModal()")
        await page.wait_for_timeout(200)

        # 5. Check no JavaScript runtime errors occurred
        print(f"Total uncaught JS errors: {len(errors)}")
        if errors:
            print("Errors:", errors)
        assert len(errors) == 0, f"Encountered page errors: {errors}"

        await browser.close()
        print(">>> ALL PWA INSTALL & PRELOADER TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    asyncio.run(main())
