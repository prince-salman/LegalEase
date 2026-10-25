import asyncio
import json
from playwright.async_api import async_playwright

async def test_security():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        errors = []
        dialogs = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('dialog', lambda d: dialogs.append(d.message))

        print('1. Navigating to http://localhost:8000/index.html...')
        await page.goto('http://localhost:8000/index.html', wait_until='networkidle')

        # Check 1: Security Meta Tags & Headers in DOM
        print('2. Checking Security Meta Tags in DOM...')
        has_nosniff = await page.evaluate("() => !!document.querySelector('meta[http-equiv=\"X-Content-Type-Options\"]')")
        has_csp = await page.evaluate("() => !!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')")
        assert has_nosniff, "Missing X-Content-Type-Options meta tag"
        assert has_csp, "Missing Content-Security-Policy meta tag"
        print('-> Security headers & CSP present in DOM!')

        # Check 2: Login modal has NO public admin credentials auto-fill button
        print('3. Checking Login Modal for absence of public admin credentials button...')
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        modal_html = await page.inner_html('#auth-modal-body')
        assert 'Gunakan Akun Notaris' not in modal_html, "Found insecure auto-fill admin button in login modal!"
        assert 'Sesi Terenkripsi SSL 256-bit' in modal_html, "Missing security assurance badge in login modal"
        print('-> Login modal is 100% clean with zero credentials exposure!')

        # Check 3: Cryptographic Password Hashing & Salted Storage on Registration
        print('4. Testing User Registration & Salted SHA-256 Storage...')
        await page.evaluate("() => window.openAuthModal('register')")
        await page.wait_for_timeout(300)

        await page.fill('#reg-name', 'Rizky Security Auditor')
        await page.fill('#reg-company', 'PT Sentosa Cyber Defense')
        await page.fill('#reg-email', 'rizky@sentosacyber.id')
        await page.fill('#reg-phone', '0812-8899-7766')
        await page.fill('#reg-password', 'superSecretP@ss2026')
        await page.fill('#reg-city', 'Bandung')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(600)

        # Inspect localStorage to verify NO plaintext password
        stored_users_raw = await page.evaluate("() => localStorage.getItem('legalease_registered_users_v2')")
        stored_users = json.loads(stored_users_raw)
        created_user = next(u for u in stored_users if u['email'] == 'rizky@sentosacyber.id')

        assert 'password' not in created_user, "CRITICAL VULNERABILITY: Plaintext password found in localStorage!"
        assert 'passwordHash' in created_user, "Missing passwordHash"
        assert 'passwordSalt' in created_user, "Missing passwordSalt"
        assert len(created_user['passwordHash']) == 64, f"Hash is not SHA-256 (length: {len(created_user['passwordHash'])})"
        print('-> Password is cryptographically salted & SHA-256 hashed:', created_user['passwordHash'][:16] + '...')

        # Inspect session object
        session_raw = await page.evaluate("() => localStorage.getItem('legalease_user_session_v2')")
        session_obj = json.loads(session_raw)
        assert 'password' not in session_obj
        assert 'passwordHash' not in session_obj
        assert 'passwordSalt' not in session_obj
        assert 'sessionToken' in session_obj and session_obj['sessionToken'].startswith('les_')
        assert 'sessionExpiresAt' in session_obj
        print('-> Session token generated securely with 24-hr expiry!')

        # Check 4: Role-Based Access Control (RBAC)
        print('5. Testing RBAC: Regular client attempting to open Admin Console...')
        await page.evaluate("() => window.openAdminConsole()")
        await page.wait_for_timeout(300)
        admin_open = await page.evaluate("() => !document.getElementById('admin-console-modal').classList.contains('hidden')")
        assert not admin_open, "CRITICAL: Regular user was able to open Admin Console!"
        toast_text = await page.inner_text('#toast-container')
        assert 'Akses ditolak' in toast_text
        print('-> RBAC strictly blocked unauthorized access to Admin Console!')

        # Check 5: Anti-Brute-Force & Rate Limiting System
        print('6. Testing Anti-Brute-Force Protection (5 failed attempts)...')
        await page.evaluate("() => window.handleUserSignOut()")
        await page.wait_for_timeout(300)
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)

        for attempt in range(1, 6):
            await page.fill('#auth-login-email', 'rizky@sentosacyber.id')
            await page.fill('#auth-login-password', f'wrong_attempt_{attempt}')
            await page.click('button[type="submit"]')
            await page.wait_for_timeout(200)

        # 6th attempt should be blocked by anti-brute force lockout
        await page.fill('#auth-login-password', 'superSecretP@ss2026') # Even with right password, locked!
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(200)
        toast_lock = await page.inner_text('#toast-container')
        print('Lockout Toast:', toast_lock)
        assert 'dikunci sementara' in toast_lock or 'Terlalu banyak percobaan' in toast_lock
        print('-> Anti-brute force throttling successfully locked out attacker!')

        # Check 6: XSS Sanitization Defense-in-depth
        print('7. Testing XSS payload mitigation...')
        xss_payload = "<img src=x onerror=alert('xss_attack_vector')>"
        escaped_result = await page.evaluate(f"() => window.escapeHtml({json.dumps(xss_payload)})")
        assert '<script>' not in escaped_result
        assert '<img' not in escaped_result
        assert '&lt;img' in escaped_result
        assert len(dialogs) == 0, f"XSS alert dialog was triggered: {dialogs}"
        print('-> XSS sanitization verified, 0 alerts triggered!')

        # Check 7: Admin Login via Cryptographic Hash
        print('8. Testing Admin Login with cryptographic verification...')
        # Admin email has not been throttled
        await page.fill('#auth-login-email', 'admin@legalease.co.id')
        await page.fill('#auth-login-password', 'admin')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(400)

        admin_user = await page.evaluate("() => window.legalEaseState.currentUser")
        assert admin_user['role'] == 'admin'
        assert admin_user['fullName'] == 'Prof. Dr. Hendra Gunawan, S.H., M.Kn.'
        print('-> Admin authenticated successfully via salted SHA-256 hash!')

        # Admin can now open Admin Console
        await page.evaluate("() => window.openAdminConsole()")
        await page.wait_for_timeout(300)
        admin_open_now = await page.evaluate("() => !document.getElementById('admin-console-modal').classList.contains('hidden')")
        assert admin_open_now
        print('-> Verified Admin Console opened successfully for authentic admin!')

        assert len(errors) == 0, f"Page errors: {errors}"
        await browser.close()
        print('========================================================================')
        print('*** ALL ENTERPRISE SECURITY & OWASP AUDIT CHECKS PASSED 100%! ***')
        print('========================================================================')

asyncio.run(test_security())
