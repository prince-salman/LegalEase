import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.async_api import async_playwright

VIEWPORTS = [
    {"name": "iPhone SE (Mobile Small)", "width": 375, "height": 667},
    {"name": "iPhone 14 / Pixel (Mobile Standard)", "width": 390, "height": 844},
    {"name": "iPad Mini / Tablet (Medium)", "width": 768, "height": 1024},
    {"name": "MacBook / Laptop (Desktop)", "width": 1280, "height": 800},
    {"name": "Full HD Desktop", "width": 1920, "height": 1080}
]

async def check_horizontal_overflow(page, context_label):
    scroll_width = await page.evaluate("() => document.documentElement.scrollWidth")
    client_width = await page.evaluate("() => document.documentElement.clientWidth")
    diff = scroll_width - client_width
    if diff > 1:
        # Find offending elements with scrollWidth > client_width or bounding rect outside
        offenders = await page.evaluate("""() => {
            const bad = [];
            const cw = document.documentElement.clientWidth;
            document.querySelectorAll('*').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.right > cw + 2 && el.offsetWidth > 0 && rect.width > 0) {
                    bad.push({
                        tag: el.tagName,
                        id: el.id || '',
                        className: (el.className || '').toString().substring(0, 50),
                        rectRight: Math.round(rect.right),
                        clientWidth: cw
                    });
                }
            });
            return bad.slice(0, 5);
        }""")
        print(f"  [OVERFLOW WARNING] {context_label}: scrollWidth={scroll_width} > clientWidth={client_width} (diff={diff}px)")
        print(f"  Offenders: {offenders}")
        return False
    return True

async def run_audit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        all_passed = True
        total_checks = 0

        for vp in VIEWPORTS:
            print(f"\n====================================================================")
            print(f">>> TESTING VIEWPORT: {vp['name']} ({vp['width']}x{vp['height']})")
            print(f"====================================================================")
            
            ctx = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await ctx.new_page()

            errors = []
            page.on("pageerror", lambda e: errors.append(f"PAGE ERROR: {str(e)}"))
            page.on("console", lambda m: errors.append(f"CONSOLE ERROR: {m.text}") if m.type == "error" else None)

            # 1. Test Public Landing View
            await page.goto("http://localhost:8000/index.html", wait_until="networkidle")
            total_checks += 1
            ok_overflow = await check_horizontal_overflow(page, f"Public Landing [{vp['name']}]")
            if not ok_overflow: all_passed = False
            else: print(f"  ✓ Public Landing View: Perfectly Responsive (No Horizontal Overflow)")

            # Test mobile menu toggle if mobile
            if vp["width"] < 768:
                menu_btn = page.locator("#mobile-menu-btn")
                if await menu_btn.is_visible():
                    await menu_btn.click()
                    await page.wait_for_timeout(200)
                    mobile_menu_open = await page.evaluate("() => !document.getElementById('mobile-menu').classList.contains('hidden')")
                    assert mobile_menu_open, "Mobile menu should open when button clicked!"
                    await menu_btn.click()
                    await page.wait_for_timeout(200)
                    print(f"  ✓ Mobile Hamburger Menu toggles seamlessly")

            # 2. Test Registration & Client Portal View
            await page.evaluate("() => window.openAuthModal('register')")
            await page.wait_for_timeout(300)
            
            # Check modal fits in viewport
            modal_rect = await page.evaluate("""() => {
                const m = document.querySelector('#auth-modal > div');
                if (!m) return null;
                const r = m.getBoundingClientRect();
                return { width: r.width, height: r.height, top: r.top, left: r.left };
            }""")
            print(f"  ✓ Auth Modal fits viewport: {modal_rect['width']}px wide")
            assert modal_rect["width"] <= vp["width"], "Modal should not be wider than viewport!"

            await page.fill("#reg-name", f"User {vp['width']}")
            await page.fill("#reg-company", f"PT Responsif {vp['width']}")
            await page.fill("#reg-email", f"user{vp['width']}@responsif.co.id")
            await page.fill("#reg-phone", "0812-3344-5566")
            await page.fill("#reg-password", "pass123456")
            await page.fill("#reg-city", "Jakarta")
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(500)

            # Now on Client Portal View
            total_checks += 1
            ok_overflow = await check_horizontal_overflow(page, f"Client Portal [{vp['name']}]")
            if not ok_overflow: all_passed = False
            else: print(f"  ✓ Client Portal View: Perfectly Responsive (No Horizontal Overflow)")

            # Test all 3 tabs on this viewport
            for tab in ["documents", "chat", "invoices"]:
                await page.evaluate(f"() => window.switchClientTab('{tab}')")
                await page.wait_for_timeout(200)
                ok_tab_overflow = await check_horizontal_overflow(page, f"Client Portal Tab: {tab} [{vp['name']}]")
                if not ok_tab_overflow: all_passed = False
                else: print(f"  ✓ Client Tab '{tab}': No Horizontal Overflow")

            # 3. Test Checkout Modal on this viewport
            await page.evaluate("() => window.openCheckoutModal('full')")
            await page.wait_for_timeout(300)
            chk_ok = await page.evaluate("() => !document.getElementById('checkout-modal').classList.contains('hidden')")
            assert chk_ok, "Checkout modal should open!"
            
            # Verify Pay button is clickable / accessible
            pay_btn = page.locator('button:has-text("Bayar Sekarang")')
            await pay_btn.scroll_into_view_if_needed()
            assert await pay_btn.is_visible(), "Pay button should be visible in checkout!"
            await page.evaluate("() => window.closeCheckoutModal()")
            await page.wait_for_timeout(200)
            print(f"  ✓ Checkout Modal: Cleanly scrollable and actionable")

            # 4. Sign out & Login as Admin
            await page.evaluate("() => window.handleUserSignOut()")
            await page.wait_for_timeout(300)

            await page.evaluate("() => window.openAuthModal('login')")
            await page.wait_for_timeout(200)
            await page.fill("#auth-login-email", "admin@legalease.co.id")
            await page.fill("#auth-login-password", "admin")
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(500)

            # Now on Admin Portal View
            total_checks += 1
            ok_overflow = await check_horizontal_overflow(page, f"Admin Portal [{vp['name']}]")
            if not ok_overflow: all_passed = False
            else: print(f"  ✓ Admin Portal View: Perfectly Responsive (No Horizontal Overflow)")

            # Test all 4 admin tabs on this viewport
            for tab in ["chats", "users", "transactions", "deeds"]:
                await page.evaluate(f"() => window.switchAdminPortalTab('{tab}')")
                await page.wait_for_timeout(200)
                ok_tab_overflow = await check_horizontal_overflow(page, f"Admin Portal Tab: {tab} [{vp['name']}]")
                if not ok_tab_overflow: all_passed = False
                else: print(f"  ✓ Admin Tab '{tab}': No Horizontal Overflow")

            # Check errors
            if len(errors) > 0:
                print(f"  [ERROR WARNING] {len(errors)} errors found on viewport {vp['name']}:")
                for err in errors:
                    print(f"    - {err}")
                all_passed = False
            else:
                print(f"  ✓ Zero JS / Console errors on {vp['name']}!")

            await ctx.close()

        await browser.close()
        print("\n====================================================================")
        if all_passed:
            print(f"*** ALL {total_checks} RESPONSIVE CHECKS PASSED WITH ZERO BUGS! ***")
        else:
            print(f"*** SOME RESPONSIVE WARNINGS / OVERFLOWS DETECTED (See above) ***")
        print("====================================================================")
        assert all_passed, "Responsive audit found layout or overflow issues!"

asyncio.run(run_audit())
