import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Testing Pre-configured Demo Accounts...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # 1. Test Fajar Nugraha (Paket Biasa Rp 0)
        await page.goto('http://localhost:8000', wait_until='domcontentloaded')
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.reload(wait_until='domcontentloaded')
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'fajar@sinergidigital.co.id')
        await page.fill('#auth-login-password', 'secret123')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        u1 = await page.evaluate('() => window.legalEaseState.currentUser')
        v1 = await page.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Fajar Logged in: {u1['fullName']} | Company: {u1['companyName']} | Plan: {u1['planName']} | View: {v1}")
        assert u1['fullName'] == 'Fajar Nugraha'
        assert u1['plan'] == 'biasa'
        assert v1 == 'client_dashboard'

        # 2. Test Gelsay Behrous (Full Legal Suite)
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(400)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'gelsay@nusantaralaw.co.id')
        await page.fill('#auth-login-password', 'gelsaypass')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        u2 = await page.evaluate('() => window.legalEaseState.currentUser')
        v2 = await page.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Gelsay Logged in: {u2['fullName']} | Company: {u2['companyName']} | Plan: {u2['planName']} | View: {v2}")
        assert u2['fullName'] == 'Gelsay Behrous'
        assert u2['plan'] == 'full'
        assert v2 == 'client_dashboard'

        # 3. Test Admin Notary
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(400)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'admin@legalease.co.id')
        await page.fill('#auth-login-password', 'admin')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        u3 = await page.evaluate('() => window.legalEaseState.currentUser')
        v3 = await page.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Admin Logged in: {u3['fullName']} | Role: {u3['role']} | View: {v3}")
        assert u3['role'] == 'admin'
        assert v3 == 'admin_dashboard'

        await browser.close()
        print(">>> ALL 3 DEMO ACCOUNTS WORK FLAWLESSLY! <<<")

if __name__ == '__main__':
    asyncio.run(main())
