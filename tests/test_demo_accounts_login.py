import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Testing Pre-configured Demo Accounts & Aliases...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # -------------------------------------------------------------
        # 1. Test Fajar Nugraha (Paket Biasa Rp 0 - Primary Credential)
        # -------------------------------------------------------------
        await page.goto('http://localhost:8000', wait_until='domcontentloaded')
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.reload(wait_until='domcontentloaded')
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'fajar@sinergidigital.co.id')
        await page.fill('#auth-login-password', 'secret123')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(500)

        u1 = await page.evaluate('() => window.legalEaseState.currentUser')
        v1 = await page.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Fajar Primary: {u1['fullName']} | Plan: {u1['planName']} | View: {v1}")
        assert u1['fullName'] == 'Fajar Nugraha'
        assert u1['plan'] == 'biasa'
        assert v1 == 'client_dashboard'

        # -------------------------------------------------------------
        # 2. Test Gelsay Behrous (Corporate Client - Primary Credential)
        # -------------------------------------------------------------
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(300)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'gelsay@nusantaralaw.co.id')
        await page.fill('#auth-login-password', 'gelsaypass')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(500)

        u2 = await page.evaluate('() => window.legalEaseState.currentUser')
        v2 = await page.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Gelsay Primary: {u2['fullName']} | Plan: {u2['planName']} | View: {v2}")
        assert u2['fullName'] == 'Gelsay Behrous'
        assert u2['plan'] == 'full'
        assert v2 == 'client_dashboard'

        # -------------------------------------------------------------
        # 3. Test Admin Notary (Primary Credential)
        # -------------------------------------------------------------
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(300)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'admin@legalease.co.id')
        await page.fill('#auth-login-password', 'admin')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(500)

        u3 = await page.evaluate('() => window.legalEaseState.currentUser')
        v3 = await page.evaluate('() => window.legalEaseState.currentView')
        print(f"[OK] Admin Primary: {u3['fullName']} | Role: {u3['role']} | View: {v3}")
        assert u3['role'] == 'admin'
        assert v3 == 'admin_dashboard'

        # -------------------------------------------------------------
        # 4. Test Corporate Client Aliases & Alternative Passwords
        # -------------------------------------------------------------
        corporate_test_cases = [
            ('gelsay@legalease.co.id', 'gelsaypass'),
            ('korporasi@legalease.co.id', 'secret123'),
            ('klien@legalease.co.id', 'gelsaypass'),
            ('gelsay', 'gelsaypass'),
            ('korporasi', 'secret123'),
        ]

        for email_alias, pwd in corporate_test_cases:
            await page.evaluate('() => handleUserSignOut()')
            await page.wait_for_timeout(200)
            await page.evaluate('() => window.openAuthModal("login")')
            await page.wait_for_timeout(200)
            await page.fill('#auth-login-email', email_alias)
            await page.fill('#auth-login-password', pwd)
            await page.click('#auth-modal button[type="submit"]')
            await page.wait_for_timeout(400)

            u = await page.evaluate('() => window.legalEaseState.currentUser')
            v = await page.evaluate('() => window.legalEaseState.currentView')
            assert u and u['fullName'] == 'Gelsay Behrous', f"Failed for alias {email_alias}"
            assert v == 'client_dashboard', f"Failed view for alias {email_alias}"
            print(f"[OK] Gelsay Alias [{email_alias}] (pwd={pwd}): Logged in successfully!")

        # -------------------------------------------------------------
        # 5. Test Fajar Aliases
        # -------------------------------------------------------------
        fajar_test_cases = [
            ('fajar@legalease.co.id', 'secret123'),
            ('fajar', 'secret123'),
        ]

        for email_alias, pwd in fajar_test_cases:
            await page.evaluate('() => handleUserSignOut()')
            await page.wait_for_timeout(200)
            await page.evaluate('() => window.openAuthModal("login")')
            await page.wait_for_timeout(200)
            await page.fill('#auth-login-email', email_alias)
            await page.fill('#auth-login-password', pwd)
            await page.click('#auth-modal button[type="submit"]')
            await page.wait_for_timeout(400)

            u = await page.evaluate('() => window.legalEaseState.currentUser')
            v = await page.evaluate('() => window.legalEaseState.currentView')
            assert u and u['fullName'] == 'Fajar Nugraha', f"Failed for alias {email_alias}"
            assert v == 'client_dashboard', f"Failed view for alias {email_alias}"
            print(f"[OK] Fajar Alias [{email_alias}]: Logged in successfully!")

        # -------------------------------------------------------------
        # 6. Test Admin Short Alias ('admin')
        # -------------------------------------------------------------
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(200)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(200)
        await page.fill('#auth-login-email', 'admin')
        await page.fill('#auth-login-password', 'admin')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(400)

        u = await page.evaluate('() => window.legalEaseState.currentUser')
        v = await page.evaluate('() => window.legalEaseState.currentView')
        assert u and u['role'] == 'admin', "Failed for admin short alias"
        assert v == 'admin_dashboard', "Failed view for admin short alias"
        print("[OK] Admin Short Alias ['admin']: Logged in successfully!")

        # -------------------------------------------------------------
        # 7. Test 1-Click Quick-Fill Demo Chips / Buttons
        # -------------------------------------------------------------
        # Chip A: Gelsay Corporate
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(200)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-gelsay')
        await page.wait_for_timeout(200)

        email_val = await page.input_value('#auth-login-email')
        pass_val = await page.input_value('#auth-login-password')
        assert email_val == 'gelsay@nusantaralaw.co.id', f"Quick-fill Gelsay email incorrect: {email_val}"
        assert pass_val == 'gelsaypass', f"Quick-fill Gelsay password incorrect: {pass_val}"

        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(500)
        u_chip_gelsay = await page.evaluate('() => window.legalEaseState.currentUser')
        assert u_chip_gelsay and u_chip_gelsay['fullName'] == 'Gelsay Behrous'
        print("[OK] Quick-Fill Chip Corporate (PT Gelsay): Filled and Authenticated 100%!")

        # Chip B: Fajar Business
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(200)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)

        email_val = await page.input_value('#auth-login-email')
        pass_val = await page.input_value('#auth-login-password')
        assert email_val == 'fajar@sinergidigital.co.id', f"Quick-fill Fajar email incorrect: {email_val}"
        assert pass_val == 'secret123', f"Quick-fill Fajar password incorrect: {pass_val}"

        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(500)
        u_chip_fajar = await page.evaluate('() => window.legalEaseState.currentUser')
        assert u_chip_fajar and u_chip_fajar['fullName'] == 'Fajar Nugraha'
        print("[OK] Quick-Fill Chip Business (Fajar): Filled and Authenticated 100%!")

        # Chip C: Admin Notary
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(200)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-admin')
        await page.wait_for_timeout(200)

        email_val = await page.input_value('#auth-login-email')
        pass_val = await page.input_value('#auth-login-password')
        assert email_val == 'admin@legalease.co.id', f"Quick-fill Admin email incorrect: {email_val}"
        assert pass_val == 'admin', f"Quick-fill Admin password incorrect: {pass_val}"

        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(500)
        u_chip_admin = await page.evaluate('() => window.legalEaseState.currentUser')
        assert u_chip_admin and u_chip_admin['role'] == 'admin'
        print("[OK] Quick-Fill Chip Admin (Dr. Hendra): Filled and Authenticated 100%!")

        # -------------------------------------------------------------
        # 8. Test Rate-Limiting / Throttling Lockout Bypass for Demo Accounts
        # -------------------------------------------------------------
        await page.evaluate('() => handleUserSignOut()')
        await page.wait_for_timeout(200)
        await page.evaluate('() => window.openAuthModal("login")')
        await page.wait_for_timeout(300)

        # Trigger 6 failed logins in a row
        for i in range(6):
            await page.fill('#auth-login-email', 'gelsay@nusantaralaw.co.id')
            await page.fill('#auth-login-password', f'wrong_pass_{i}')
            await page.click('#auth-modal button[type="submit"]')
            await page.wait_for_timeout(200)

        # 7th login with correct credentials should still succeed without lockout
        await page.fill('#auth-login-email', 'gelsay@nusantaralaw.co.id')
        await page.fill('#auth-login-password', 'gelsaypass')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(500)

        u_bypass = await page.evaluate('() => window.legalEaseState.currentUser')
        assert u_bypass and u_bypass['fullName'] == 'Gelsay Behrous', "Failed to bypass lockout for demo account"
        print("[OK] Throttling Lockout Bypass: Demo accounts remain unlocked after 6+ failed attempts!")

        await browser.close()
        print("\n>>> ALL DEMO ACCOUNTS, ALIASES, QUICK-FILL CHIPS & THROTTLE BYPASS PASSED 100%! <<<")

if __name__ == '__main__':
    asyncio.run(main())
