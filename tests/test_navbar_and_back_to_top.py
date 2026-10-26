import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=====================================================================")
    print("Testing Navbar Simplification & Back to Top Button (Items 8, 9, 10)...")
    print("=====================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        print("\n1. Navigating to http://localhost:8000...")
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(1000)

        # -------------------------------------------------------------
        # 1. Desktop Navbar Verification (Items 8 & 9)
        # -------------------------------------------------------------
        print("\n2. Verifying Desktop Navbar (Items 8 & 9)...")
        desktop_nav = page.locator('header nav')
        assert await desktop_nav.count() == 1, "Desktop nav element not found!"

        nav_text = await desktop_nav.inner_text()
        print(f"   Desktop nav text contents:\n   {repr(nav_text)}")

        # Check Item 8: No Tim Eksekutif or Dewan Eksekutif in desktop navbar
        assert "Tim Eksekutif" not in nav_text, "FAILED: 'Tim Eksekutif' still present in desktop navbar!"
        assert "Dewan Eksekutif" not in nav_text, "FAILED: 'Dewan Eksekutif' present in desktop navbar!"
        print("   [OK] Item 8: 'Tim Eksekutif' is completely absent from desktop navbar.")

        # Check Item 9: Consolidate Notaris, Template, Pendirian under Layanan
        top_level_links = await desktop_nav.evaluate("""nav => {
            const directChildren = Array.from(nav.children);
            return directChildren.map(el => {
                if (el.tagName === 'A') return { type: 'link', text: el.innerText.trim(), href: el.getAttribute('href') };
                const btn = el.querySelector('a, button');
                return { type: 'group', text: btn ? btn.innerText.trim() : el.innerText.trim() };
            });
        }""")
        print(f"   Top-level desktop items: {top_level_links}")

        # Top-level should have Layanan (group), Paket & Biaya, Download APK, FAQ
        top_labels = [item['text'] for item in top_level_links]
        assert any("Layanan" in l for l in top_labels), "Layanan top-level item missing!"
        assert any("Paket" in l for l in top_labels), "Paket & Biaya link missing!"
        assert any("Download" in l for l in top_labels), "Download APK link missing!"
        assert any("FAQ" in l for l in top_labels), "FAQ link missing!"

        # Ensure Notaris & PPAT, Template Dokumen, Pendirian PT are NOT top-level links
        assert not any("Notaris" in item['text'] and item['type'] == 'link' for item in top_level_links), \
            "FAILED: 'Notaris & PPAT' is still a top-level link in desktop nav!"
        assert not any("Template" in item['text'] and item['type'] == 'link' for item in top_level_links), \
            "FAILED: 'Template Dokumen' is still a top-level link in desktop nav!"
        assert not any("Pendirian" in item['text'] and item['type'] == 'link' for item in top_level_links), \
            "FAILED: 'Pendirian PT' is still a top-level link in desktop nav!"
        print("   [OK] Item 9: Individual service links removed from top-level desktop navbar.")

        # Check Layanan dropdown links
        dropdown_links = await desktop_nav.evaluate("""nav => {
            const dropdown = nav.querySelector('.relative.group');
            if (!dropdown) return [];
            return Array.from(dropdown.querySelectorAll('a')).map(a => ({
                href: a.getAttribute('href'),
                text: a.innerText.trim()
            }));
        }""")
        print(f"   Layanan dropdown links: {dropdown_links}")
        dropdown_hrefs = [l['href'] for l in dropdown_links]
        assert '#services' in dropdown_hrefs, "Missing '#services' in Layanan dropdown!"
        assert '#notaris' in dropdown_hrefs, "Missing '#notaris' in Layanan dropdown!"
        assert '#templates' in dropdown_hrefs, "Missing '#templates' in Layanan dropdown!"
        assert '#roadmap' in dropdown_hrefs, "Missing '#roadmap' in Layanan dropdown!"
        print("   [OK] Item 9: Layanan dropdown contains all consolidated services (#services, #notaris, #templates, #roadmap).")

        # -------------------------------------------------------------
        # 2. Mobile Menu Verification (Items 8 & 9)
        # -------------------------------------------------------------
        print("\n3. Verifying Mobile Menu (Items 8 & 9)...")
        mobile_menu = page.locator('#mobile-menu')
        assert await mobile_menu.count() == 1, "#mobile-menu element not found!"

        mobile_text = await mobile_menu.inner_text()
        assert "Tim Eksekutif" not in mobile_text, "FAILED: 'Tim Eksekutif' still present in mobile menu!"
        assert "Dewan Eksekutif" not in mobile_text, "FAILED: 'Dewan Eksekutif' still present in mobile menu!"
        print("   [OK] Item 8: 'Dewan Eksekutif' / 'Tim Eksekutif' completely absent from mobile menu.")

        # Check consolidated Layanan section in mobile menu
        mobile_sublinks = await mobile_menu.evaluate("""menu => {
            const details = menu.querySelector('details');
            if (!details) return [];
            return Array.from(details.querySelectorAll('a')).map(a => ({
                href: a.getAttribute('href'),
                text: a.innerText.trim()
            }));
        }""")
        print(f"   Mobile Layanan sub-links: {mobile_sublinks}")
        mobile_hrefs = [l['href'] for l in mobile_sublinks]
        assert '#services' in mobile_hrefs, "Missing '#services' in mobile Layanan section!"
        assert '#notaris' in mobile_hrefs, "Missing '#notaris' in mobile Layanan section!"
        assert '#templates' in mobile_hrefs, "Missing '#templates' in mobile Layanan section!"
        assert '#roadmap' in mobile_hrefs, "Missing '#roadmap' in mobile Layanan section!"
        print("   [OK] Item 9: Mobile menu has consolidated Layanan section with sub-links.")

        # -------------------------------------------------------------
        # 3. Back to Top Button Verification (Item 10)
        # -------------------------------------------------------------
        print("\n4. Verifying Floating Back to Top Button (Item 10)...")
        btn = page.locator('#back-to-top-btn')
        assert await btn.count() == 1, "#back-to-top-btn not found in DOM!"

        # Check initial state at scrollY == 0: should be hidden / opacity-0
        initial_classes = await btn.get_attribute('class')
        initial_scroll = await page.evaluate("() => window.scrollY")
        print(f"   Initial scrollY: {initial_scroll}")
        assert "opacity-0" in initial_classes, f"Expected opacity-0 at scrollY 0, got: {initial_classes}"
        assert "pointer-events-none" in initial_classes, "Expected pointer-events-none at scrollY 0"
        print("   [OK] Button is hidden (opacity-0, pointer-events-none) at top of page.")

        # Scroll down to 600px
        print("\n5. Scrolling down 600px...")
        await page.evaluate("() => window.scrollTo(0, 600)")
        await page.wait_for_timeout(300)

        current_scroll = await page.evaluate("() => window.scrollY")
        print(f"   Current scrollY: {current_scroll}")
        assert current_scroll >= 500, f"Scroll did not execute properly: {current_scroll}"

        # Check button visibility after scroll
        scrolled_classes = await btn.get_attribute('class')
        assert "opacity-100" in scrolled_classes, f"Expected opacity-100 after scroll, got: {scrolled_classes}"
        assert "pointer-events-auto" in scrolled_classes, "Expected pointer-events-auto after scroll"
        assert "opacity-0" not in scrolled_classes, "opacity-0 should be removed after scroll"
        print("   [OK] Button is visible (opacity-100, pointer-events-auto) after scrolling > 300px.")

        # Click the Back to Top button
        print("\n6. Clicking #back-to-top-btn to scroll back to top...")
        await btn.click()
        # Wait for smooth scrolling to complete
        await page.wait_for_timeout(1000)

        final_scroll = await page.evaluate("() => window.scrollY")
        print(f"   Scroll position after click: {final_scroll}")
        assert final_scroll <= 10, f"Scroll did not return to top! Current: {final_scroll}"
        print("   [OK] Page smoothly scrolled back to top (scrollY <= 10).")

        # Verify button transitions back to hidden
        await page.wait_for_timeout(200)
        final_classes = await btn.get_attribute('class')
        assert "opacity-0" in final_classes, f"Expected button to hide at top, got: {final_classes}"
        print("   [OK] Button is hidden again at top of page.")

        # -------------------------------------------------------------
        # 4. Error Check
        # -------------------------------------------------------------
        print("\n7. Checking console errors...")
        real_errors = [e for e in errors if 'favicon' not in e]
        if real_errors:
            print(f"   [WARN] Console errors detected: {real_errors}")
        else:
            print("   [OK] Zero console errors detected.")

        await browser.close()

    print("\n=====================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY for Items 8, 9, 10!")
    print("=====================================================================")

if __name__ == '__main__':
    asyncio.run(main())
