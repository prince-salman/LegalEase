import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=====================================================================")
    print("Testing Halodoc-Style Mobile UI/UX & Navigation Bar (Item 16)...")
    print("=====================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Emulate iPhone 13 / modern mobile viewport
        page = await browser.new_page(viewport={'width': 375, 'height': 812}, is_mobile=True, has_touch=True)

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        print("\n1. Navigating to http://localhost:8000 on mobile viewport (375x812)...")
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(600)

        # -------------------------------------------------------------
        # 1. Halodoc Top Header (Avatar & Location Pill)
        # -------------------------------------------------------------
        print("\n2. Checking Halodoc Mobile Top Header...")
        mobile_header = page.locator('#mobile-halodoc-header')
        assert await mobile_header.is_visible(), "Mobile Halodoc header is not visible on mobile viewport!"
        
        loc_pill = page.locator('#mobile-halodoc-header .location-pill')
        assert await loc_pill.count() >= 1, "Location pill in Halodoc header is missing!"
        loc_text = await loc_pill.inner_text()
        print(f"   [OK] Halodoc header location pill verified: {repr(loc_text)}")

        # -------------------------------------------------------------
        # 2. 8 Circular Service Shortcuts
        # -------------------------------------------------------------
        print("\n3. Checking 8 Circular Service Grid...")
        service_items = page.locator('#mobile-service-grid .halodoc-service-item')
        item_count = await service_items.count()
        assert item_count == 8, f"Expected 8 circular service items like Halodoc, found {item_count}!"
        
        # Verify text labels of the 8 services
        labels = [await service_items.nth(i).inner_text() for i in range(item_count)]
        print(f"   [OK] Found 8 circular service items:\n   {', '.join([l.replace(chr(10), ' ') for l in labels])}")
        
        expected_keywords = ['Chat', 'Template', 'Pendirian', 'Akta', 'Suara', 'Legalitas', 'Janji', 'Semua']
        for kw in expected_keywords:
            matched = any(kw.lower() in l.lower() for l in labels)
            assert matched, f"Missing expected service keyword '{kw}' in mobile grid!"

        # -------------------------------------------------------------
        # 3. Halodoc Promo Banner Carousel
        # -------------------------------------------------------------
        print("\n4. Checking Halodoc Promo Banner...")
        promo_banner = page.locator('#mobile-promo-banner')
        assert await promo_banner.is_visible(), "Mobile promo banner card is not visible!"
        print("   [OK] Promo banner carousel verified")

        # -------------------------------------------------------------
        # 4. Fixed Curved Bottom Navigation Dock
        # -------------------------------------------------------------
        print("\n5. Checking Fixed Curved Bottom Navigation Dock...")
        bottom_nav = page.locator('#mobile-bottom-nav')
        assert await bottom_nav.is_visible(), "Bottom navigation dock is not visible on mobile!"
        
        nav_buttons = page.locator('#mobile-bottom-nav button')
        nav_count = await nav_buttons.count()
        assert nav_count == 5, f"Expected 5 bottom navigation buttons (Beranda, Riwayat, FAB, Profil, Bantuan), found {nav_count}!"
        print("   [OK] Bottom navigation dock contains 5 interactive tabs (including elevated center FAB)")

        # -------------------------------------------------------------
        # 5. Interactive Tab Switching & Auth Gate (Items 13 & 16)
        # -------------------------------------------------------------
        print("\n6. Testing Bottom Navigation Interactive Actions & Auth Protection...")
        # A. Guest clicks FAB -> Protected by requireAuth (Item 13)
        fab_btn = page.locator('#mobile-bottom-nav #btn-bottom-fab')
        await fab_btn.click()
        await page.wait_for_timeout(400)

        auth_modal = page.locator('#auth-modal')
        assert not await auth_modal.evaluate("el => el.classList.contains('hidden')"), "Item 13: Guest clicking FAB did not trigger Auth Modal!"
        print("   [OK] Item 13: Unauthenticated guest clicking FAB correctly redirected to Login Modal")

        # B. Log in via quick fill chip
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)
        print("   [OK] Successfully logged in as Fajar Nugraha")

        # C. Now authenticated client clicks FAB -> Opens Live Chat
        await fab_btn.click()
        await page.wait_for_timeout(500)
        chat_modal = page.locator('#live-chat-modal')
        assert not await chat_modal.evaluate("el => el.classList.contains('hidden')"), "Authenticated FAB click failed to open live chat modal!"
        print("   [OK] Authenticated client clicking FAB opens live chat modal")
        await page.evaluate("() => window.closeLiveChat()")
        await page.wait_for_timeout(300)

        # D. Click Riwayat tab -> Opens Appointments History
        riwayat_tab = page.locator('#mobile-bottom-nav #btn-bottom-riwayat')
        await riwayat_tab.click()
        await page.wait_for_timeout(400)
        client_view = page.locator('#client-portal-view')
        assert not await client_view.evaluate("el => el.classList.contains('hidden')"), "Riwayat tab failed to switch to client dashboard!"
        print("   [OK] Riwayat tab successfully opened Client Appointments Dashboard")

        # E. Click Beranda tab -> Restores Public View
        beranda_tab = page.locator('#mobile-bottom-nav #btn-bottom-beranda')
        await beranda_tab.click()
        await page.wait_for_timeout(400)
        public_view = page.locator('#public-landing-view')
        assert not await public_view.evaluate("el => el.classList.contains('hidden')"), "Beranda tab failed to restore Public Landing View!"
        print("   [OK] Beranda tab successfully restored main view")

        # -------------------------------------------------------------
        # 6. Verify Zero Horizontal Overflow
        # -------------------------------------------------------------
        print("\n7. Verifying Zero Horizontal Overflow...")
        overflow = await page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow, "Horizontal overflow detected on mobile viewport!"
        print("   [OK] Zero horizontal overflow confirmed (scrollWidth <= window.innerWidth)")

        # Check console errors
        assert len(errors) == 0, f"Page errors encountered: {errors}"
        print("   [OK] Zero console/page errors detected.")

        print("\n=====================================================================")
        print(">>> ALL HALODOC MOBILE UI/UX TESTS PASSED 100%! <<<")
        print("=====================================================================")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
