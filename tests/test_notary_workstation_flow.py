import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        
        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        print('1. Navigating to http://localhost:8000 ...')
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(1000)

        # Clear any existing local storage session
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.reload()
        await page.wait_for_timeout(1000)

        # TEST A: Login as Regular Notary (Dr. Hendra Wijaya)
        print('2. Testing Login as Regular Notary (notaris@legalease.co.id / notaris123) ...')
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'notaris@legalease.co.id')
        await page.fill('#auth-login-password', 'notaris123')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(1500)

        # Verify state
        user = await page.evaluate('() => window.legalEaseState.currentUser')
        view = await page.evaluate('() => window.legalEaseState.currentView')
        print(f'   User: {user["fullName"]} | Role: {user["role"]} | View: {view}')
        assert user['role'] == 'notary', 'User role should be notary'
        assert view == 'notary_dashboard', 'View should be notary_dashboard'

        # Verify notary portal view is visible and other views hidden
        is_notary_visible = await page.evaluate("""() => {
            const nv = document.getElementById('notary-portal-view');
            const pv = document.getElementById('public-landing-view');
            const cv = document.getElementById('client-portal-view');
            const av = document.getElementById('admin-portal-view');
            return !nv.classList.contains('hidden') && pv.classList.contains('hidden') && cv.classList.contains('hidden') && av.classList.contains('hidden');
        }""")
        print(f'   Notary portal visible & others hidden: {is_notary_visible}')
        assert is_notary_visible, 'Notary portal view should be visible exclusively!'

        # Check content in Notary Portal
        notary_heading = await page.inner_text('#notary-portal-view h1')
        print(f'   Notary Heading: {notary_heading}')
        assert 'Dr. Hendra Wijaya' in notary_heading, 'Notary name should be Dr. Hendra Wijaya'

        # Test tabs switching
        print('3. Testing Notary Portal Tabs ...')
        # Tab Deeds
        await page.evaluate("() => window.switchNotaryPortalTab('deeds')")
        await page.wait_for_timeout(500)
        # Tab Chat
        await page.evaluate("() => window.switchNotaryPortalTab('chat')")
        await page.wait_for_timeout(500)
        # Check chat input in notary portal
        has_chat_input = await page.is_visible('#notary-workstation-reply-input')
        print(f'   Has chat input in notary portal: {has_chat_input}')
        assert has_chat_input, 'Notary chat input should be present'

        # Tab Schedule
        await page.evaluate("() => window.switchNotaryPortalTab('schedule')")
        await page.wait_for_timeout(500)
        print('   Notary Schedule tab loaded successfully')

        # Logout
        print('4. Testing Logout from Notary Portal ...')
        await page.evaluate('handleUserSignOut()')
        await page.wait_for_timeout(1000)

        # Verify returned to public view
        is_public_visible = await page.evaluate("""() => {
            const pv = document.getElementById('public-landing-view');
            const nv = document.getElementById('notary-portal-view');
            return !pv.classList.contains('hidden') && nv.classList.contains('hidden');
        }""")
        print(f'   Returned to public view: {is_public_visible}')
        assert is_public_visible, 'Should return to public landing view after sign out'

        # TEST B: Mobile Viewport Responsiveness for Notary Portal
        print('5. Testing Notary Portal on Mobile Viewport (375x812) ...')
        await page.set_viewport_size({'width': 375, 'height': 812})
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'notaris@legalease.co.id')
        await page.fill('#auth-login-password', 'notaris123')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(1500)

        # Check for horizontal overflow on mobile
        scroll_width = await page.evaluate('document.documentElement.scrollWidth')
        client_width = await page.evaluate('document.documentElement.clientWidth')
        print(f'   Mobile Notary Portal: scrollWidth={scroll_width}, clientWidth={client_width}')
        assert scroll_width <= client_width, f'Horizontal overflow detected on mobile: {scroll_width} > {client_width}'

        # Filter out harmless favicon logs
        real_errors = [e for e in errors if 'favicon' not in e.lower()]
        print(f'   Errors logged during test: {len(real_errors)}')
        if real_errors:
            for e in real_errors:
                print('   !', e)
        assert len(real_errors) == 0, 'Found unhandled console/page errors!'

        print('ALL NOTARY WORKSTATION TESTS PASSED 100%!')
        await browser.close()

asyncio.run(run())
