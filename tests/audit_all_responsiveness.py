import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

VIEWPORTS = [
    {"name": "Mobile Small (320px)", "width": 320, "height": 650},
    {"name": "Mobile Standard (375px)", "width": 375, "height": 667},
    {"name": "Mobile Modern (390px)", "width": 390, "height": 844},
    {"name": "Mobile Large (414px)", "width": 414, "height": 896},
    {"name": "Tablet Portrait (768px)", "width": 768, "height": 1024},
    {"name": "Tablet Landscape (1024px)", "width": 1024, "height": 768},
    {"name": "Laptop (1280px)", "width": 1280, "height": 800},
    {"name": "Desktop (1440px)", "width": 1440, "height": 900},
    {"name": "Full HD (1920px)", "width": 1920, "height": 1080},
]

async def check_overflow(page):
    return await page.evaluate('''() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScroll = document.body.scrollWidth;
        return {
            clientWidth: docWidth,
            scrollWidth: scrollWidth,
            hasOverflow: scrollWidth > docWidth + 1
        };
    }''')

async def main():
    print("=== RUNNING FULL RESPONSIVENESS AUDIT ACROSS 9 VIEWPORTS ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page_errors = []
        page.on('pageerror', lambda e: page_errors.append(str(e)))

        for vp in VIEWPORTS:
            await page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
            await page.goto('http://localhost:8000', wait_until='networkidle')
            await page.wait_for_timeout(200)

            # 1. Public View
            pub = await check_overflow(page)
            print(f"[{vp['name']}] Public: {pub['clientWidth']}px | Scroll: {pub['scrollWidth']}px | Overflow: {pub['hasOverflow']}")
            assert not pub['hasOverflow'], f"Overflow in Public view at {vp['name']}"

            # 2. Test Mobile Menu on Mobile/Tablet
            if vp['width'] < 1280:
                await page.click('#mobile-menu-btn')
                await page.wait_for_timeout(150)
                assert await page.is_visible('#mobile-menu')
                menu_of = await check_overflow(page)
                assert not menu_of['hasOverflow'], f"Overflow with mobile menu open at {vp['name']}"
                # Close via toggle
                await page.click('#mobile-menu-btn')
                await page.wait_for_timeout(150)

            # 3. Test Modals
            await page.evaluate("() => window.openAuthModal('login')")
            await page.wait_for_timeout(150)
            auth_of = await check_overflow(page)
            assert not auth_of['hasOverflow']
            await page.evaluate("() => window.openAuthModal('register')")
            await page.wait_for_timeout(150)
            reg_of = await check_overflow(page)
            assert not reg_of['hasOverflow']
            await page.evaluate("() => window.closeAuthModal()")
            await page.wait_for_timeout(150)

            # 4. Login as Client & Test Client Dashboard
            await page.evaluate("() => window.openAuthModal('login')")
            await page.wait_for_timeout(150)
            await page.fill('#auth-login-email', 'fajar@sinergidigital.co.id')
            await page.fill('#auth-login-password', 'secret123')
            await page.click('#auth-modal button[type="submit"]')
            await page.wait_for_timeout(400)

            c_dash = await check_overflow(page)
            print(f"  -> Client Dashboard: {c_dash['clientWidth']}px | Scroll: {c_dash['scrollWidth']}px | Overflow: {c_dash['hasOverflow']}")
            assert not c_dash['hasOverflow'], f"Overflow in Client Dashboard at {vp['name']}"

            # Test all client tabs
            for tab in ['documents', 'chat', 'invoices']:
                await page.evaluate(f"() => window.switchClientTab('{tab}')")
                await page.wait_for_timeout(200)
                t_of = await check_overflow(page)
                assert not t_of['hasOverflow'], f"Overflow in Client Tab {tab} at {vp['name']}"

            # 5. Sign out & Login as Admin
            await page.evaluate("() => window.handleUserSignOut()")
            await page.wait_for_timeout(200)
            await page.evaluate("() => window.openAuthModal('login')")
            await page.wait_for_timeout(150)
            await page.fill('#auth-login-email', 'admin@legalease.co.id')
            await page.fill('#auth-login-password', 'admin')
            await page.click('#auth-modal button[type="submit"]')
            await page.wait_for_timeout(400)

            a_dash = await check_overflow(page)
            print(f"  -> Admin Dashboard: {a_dash['clientWidth']}px | Scroll: {a_dash['scrollWidth']}px | Overflow: {a_dash['hasOverflow']}")
            assert not a_dash['hasOverflow'], f"Overflow in Admin Dashboard at {vp['name']}"

            # Test all admin tabs
            for atab in ['chats', 'users', 'transactions', 'deeds']:
                await page.evaluate(f"() => window.switchAdminPortalTab('{atab}')")
                await page.wait_for_timeout(200)
                at_of = await check_overflow(page)
                assert not at_of['hasOverflow'], f"Overflow in Admin Tab {atab} at {vp['name']}"

            # Sign out admin for next viewport
            await page.evaluate("() => window.handleUserSignOut()")
            await page.wait_for_timeout(200)

        await browser.close()
        print(f"\nAudit complete. Total page errors: {len(page_errors)}")
        if page_errors:
            print("Errors:", page_errors)
        assert len(page_errors) == 0, f"Found {len(page_errors)} page errors!"
        print(">>> 100% RESPONSIVENESS VERIFIED ACROSS ALL 9 VIEWPORTS & ALL ROLES! <<<")

if __name__ == '__main__':
    asyncio.run(main())
