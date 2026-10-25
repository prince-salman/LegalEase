import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Testing Pre-configured Demo Accounts on Fresh Contexts...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. Test Fajar Nugraha (Paket Biasa Rp 0)
        ctx1 = await browser.new_context()
        page1 = await ctx1.new_page()
        await page1.goto('http://localhost:8000')
        await page1.evaluate('() => window.openAuthModal("login")')
        await page1.wait_for_timeout(300)
        await page1.fill('#auth-login-email', 'fajar@sinergidigital.co.id')
        await page1.fill('#auth-login-password', 'secret123')
        await page1.click('#auth-modal button[type="submit"]')
        await page1.wait_for_timeout(600)

        u1 = await page1.evaluate('() => window.legalEaseState.currentUser')
        v1 = await page1.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Fajar Logged in: {u1['fullName']} | Company: {u1['companyName']} | Plan: {u1['planName']} | View: {v1}")
        assert u1['fullName'] == 'Fajar Nugraha'
        assert u1['plan'] == 'biasa'
        assert v1 == 'client_dashboard'
        await ctx1.close()

        # 2. Test Gelsay Behrous (Full Legal Suite)
        ctx2 = await browser.new_context()
        page2 = await ctx2.new_page()
        await page2.goto('http://localhost:8000')
        await page2.evaluate('() => window.openAuthModal("login")')
        await page2.wait_for_timeout(300)
        await page2.fill('#auth-login-email', 'gelsay@nusantaralaw.co.id')
        await page2.fill('#auth-login-password', 'gelsaypass')
        await page2.click('#auth-modal button[type="submit"]')
        await page2.wait_for_timeout(600)

        u2 = await page2.evaluate('() => window.legalEaseState.currentUser')
        v2 = await page2.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Gelsay Logged in: {u2['fullName']} | Company: {u2['companyName']} | Plan: {u2['planName']} | View: {v2}")
        assert u2['fullName'] == 'Gelsay Behrous'
        assert u2['plan'] == 'full'
        assert v2 == 'client_dashboard'
        await ctx2.close()

        # 3. Test Admin Notary
        ctx3 = await browser.new_context()
        page3 = await ctx3.new_page()
        await page3.goto('http://localhost:8000')
        await page3.evaluate('() => window.openAuthModal("login")')
        await page3.wait_for_timeout(300)
        await page3.fill('#auth-login-email', 'admin@legalease.co.id')
        await page3.fill('#auth-login-password', 'admin')
        await page3.click('#auth-modal button[type="submit"]')
        await page3.wait_for_timeout(600)

        u3 = await page3.evaluate('() => window.legalEaseState.currentUser')
        v3 = await page3.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Admin Logged in: {u3['fullName']} | Role: {u3['role']} | View: {v3}")
        assert u3['role'] == 'admin'
        assert v3 == 'admin_dashboard'
        await ctx3.close()

        await browser.close()
        print(">>> ALL 3 DEMO ACCOUNTS WORK FLAWLESSLY ON FRESH BROWSERS! <<<")

if __name__ == '__main__':
    asyncio.run(main())
