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

        # Clear session
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.reload()
        await page.wait_for_timeout(1000)

        # Login as Admin Gede
        print('2. Logging in as Admin Gede (admin@legalease.co.id / admin123) ...')
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'admin@legalease.co.id')
        await page.fill('#auth-login-password', 'admin123')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(1500)

        # Verify Admin Gede
        user = await page.evaluate('() => window.legalEaseState.currentUser')
        view = await page.evaluate('() => window.legalEaseState.currentView')
        print(f'   User: {user["fullName"]} | Role: {user["role"]} | View: {view}')
        assert user['role'] == 'admin'
        assert view == 'admin_dashboard'

        # Switch to Notaries Directory Tab
        print('3. Switching to Direktori Notaris Tab ...')
        await page.click('#btn-admin-portal-tab-notaries')
        await page.wait_for_timeout(600)

        # Verify notaries rendered
        tab_content = await page.inner_text('#admin-portal-tab-content')
        assert 'Direktori & Pengawasan Dewan Notaris Rekanan' in tab_content
        assert 'Dr. Hendra Wijaya, S.H., M.Kn.' in tab_content
        assert 'notaris@legalease.co.id' in tab_content
        assert 'Kartika Permatasari, S.H., M.Kn.' in tab_content
        assert 'Bagus Pratama Putra, S.H., M.Kn.' in tab_content
        assert 'Nadia Kusumawardhani, S.H., M.Kn.' in tab_content
        print('   All 4 Notaries successfully visible in Admin Gede Console!')

        # Test clicking Audit Kepatuhan button
        await page.click('button:has-text("Audit Kepatuhan")')
        await page.wait_for_timeout(500)

        # Test mobile viewport on Admin Gede console
        print('4. Testing Mobile Viewport (375x812) on Admin Gede Notaries Directory ...')
        await page.set_viewport_size({'width': 375, 'height': 812})
        await page.wait_for_timeout(500)
        scroll_width = await page.evaluate('document.documentElement.scrollWidth')
        client_width = await page.evaluate('document.documentElement.clientWidth')
        print(f'   Mobile Admin Gede: scrollWidth={scroll_width}, clientWidth={client_width}')
        assert scroll_width <= client_width

        real_errors = [e for e in errors if 'favicon' not in e.lower()]
        assert len(real_errors) == 0, f'Errors found: {real_errors}'

        print('ADMIN GEDE NOTARY DIRECTORY TEST PASSED 100%!')
        await browser.close()

asyncio.run(run())
