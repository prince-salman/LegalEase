import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Testing Auth-Gate for Appointments & Protected Features (Items 3 & 13)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        # -------------------------------------------------------------
        # 1. Start Unauthenticated on Public Landing Page
        # -------------------------------------------------------------
        print("\n1. Navigating to http://localhost:8000 (Guest / Unauthenticated) ...")
        await page.goto('http://localhost:8000', wait_until='domcontentloaded')
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.reload(wait_until='domcontentloaded')
        await page.wait_for_timeout(500)

        user = await page.evaluate('() => window.legalEaseState.currentUser')
        assert user is None, f"Expected currentUser to be None, got: {user}"
        print("   [OK] Visitor is unauthenticated (currentUser = None)")

        # Verify modals initially hidden
        booking_hidden = await page.evaluate("() => document.getElementById('booking-modal').classList.contains('hidden')")
        auth_hidden = await page.evaluate("() => document.getElementById('auth-modal').classList.contains('hidden')")
        assert booking_hidden, "booking-modal should be hidden initially"
        assert auth_hidden, "auth-modal should be hidden initially"

        # -------------------------------------------------------------
        # 2. Unauthenticated click on 'Jadwalkan Janji Temu'
        # -------------------------------------------------------------
        print("\n2. Testing unauthenticated click on 'Jadwalkan Janji Temu' ...")
        # Click the button on the first notary card in the directory
        booking_btn = await page.query_selector("button:has-text('Jadwalkan Janji Temu')")
        assert booking_btn is not None, "Jadwalkan Janji Temu button should exist on page"
        await booking_btn.click()
        await page.wait_for_timeout(400)

        # Verify booking modal did NOT open
        booking_hidden = await page.evaluate("() => document.getElementById('booking-modal').classList.contains('hidden')")
        assert booking_hidden, "FAILED: booking-modal opened for unauthenticated visitor!"
        print("   [OK] Booking modal remained hidden for unauthenticated user")

        # Verify auth modal opened in login mode
        auth_hidden = await page.evaluate("() => document.getElementById('auth-modal').classList.contains('hidden')")
        assert not auth_hidden, "FAILED: auth-modal should be opened for unauthenticated user"
        auth_body_text = await page.inner_text('#auth-modal-body')
        assert 'Masuk ke Akun Klien' in auth_body_text, "Auth modal should display client login form"
        print("   [OK] Auth modal opened in login mode ('Masuk ke Akun Klien')")

        # Verify warning toast notification appeared
        toast_text = await page.inner_text('#toast-container')
        print(f"   Toast displayed: '{toast_text.strip()}'")
        assert 'Silakan masuk ke akun Anda terlebih dahulu untuk membuat janji temu dengan Notaris.' in toast_text, \
            f"Expected appointment auth warning toast, got: {toast_text}"
        print("   [OK] Warning toast matches exact expected requirement string")

        # Close auth modal for next test
        await page.evaluate("() => window.closeAuthModal()")
        await page.wait_for_timeout(300)

        # -------------------------------------------------------------
        # 3. Test other protected features while unauthenticated
        # -------------------------------------------------------------
        print("\n3. Testing other protected features while unauthenticated ...")

        # 3a. openLiveChat auth-gate
        print("   Testing openLiveChat auth-gate...")
        await page.evaluate("() => window.openLiveChat('notary-1')")
        await page.wait_for_timeout(300)
        chat_hidden = await page.evaluate("() => document.getElementById('live-chat-modal').classList.contains('hidden')")
        assert chat_hidden, "FAILED: live-chat-modal opened for unauthenticated visitor!"
        auth_open = await page.evaluate("() => !document.getElementById('auth-modal').classList.contains('hidden')")
        assert auth_open, "FAILED: auth-modal should open when unauthenticated user triggers chat"
        toast_text = await page.inner_text('#toast-container')
        assert 'Silakan masuk ke akun Anda terlebih dahulu untuk mengakses konsultasi live chat dengan Notaris.' in toast_text
        print("   [OK] Live chat correctly blocked and prompted login modal")

        await page.evaluate("() => window.closeAuthModal()")
        await page.wait_for_timeout(300)

        # 3b. startVoiceCall auth-gate
        print("   Testing startVoiceCall auth-gate...")
        await page.evaluate("() => window.startVoiceCall('notary-1')")
        await page.wait_for_timeout(300)
        auth_open = await page.evaluate("() => !document.getElementById('auth-modal').classList.contains('hidden')")
        assert auth_open, "FAILED: auth-modal should open when unauthenticated user triggers voice call"
        toast_text = await page.inner_text('#toast-container')
        assert 'Silakan masuk ke akun Anda terlebih dahulu untuk memulai sesi video / telepon dengan Notaris.' in toast_text
        print("   [OK] Voice call correctly blocked and prompted login modal")

        await page.evaluate("() => window.closeAuthModal()")
        await page.wait_for_timeout(300)

        # 3c. downloadCurrentDocAsWord auth-gate
        print("   Testing downloadCurrentDocAsWord auth-gate...")
        await page.evaluate("() => window.downloadCurrentDocAsWord()")
        await page.wait_for_timeout(300)
        auth_open = await page.evaluate("() => !document.getElementById('auth-modal').classList.contains('hidden')")
        assert auth_open, "FAILED: auth-modal should open when unauthenticated user triggers document download"
        toast_text = await page.inner_text('#toast-container')
        assert 'Silakan masuk ke akun Anda terlebih dahulu untuk mengunduh draf dokumen hukum resmi (.doc).' in toast_text
        print("   [OK] Document download correctly blocked and prompted login modal")

        # -------------------------------------------------------------
        # 4. Authenticate as Fajar Nugraha (Paket Biasa) & Test Booking
        # -------------------------------------------------------------
        print("\n4. Authenticating as Fajar Nugraha (Demo Client)...")
        # Quick-fill demo account Fajar
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        user_fajar = await page.evaluate('() => window.legalEaseState.currentUser')
        assert user_fajar is not None and user_fajar['fullName'] == 'Fajar Nugraha'
        print(f"   [OK] Successfully logged in as: {user_fajar['fullName']}")

        # Test booking modal as logged-in user Fajar
        print("   Testing openBookingModal as authenticated user Fajar...")
        await page.evaluate("() => window.openBookingModal('notary-1', 'Dr. Hendra Wijaya, S.H., M.Kn.')")
        await page.wait_for_timeout(400)

        booking_open = await page.evaluate("() => !document.getElementById('booking-modal').classList.contains('hidden')")
        assert booking_open, "FAILED: booking-modal did not open for authenticated user Fajar!"
        notary_sub = await page.inner_text('#booking-notary-subtitle')
        assert 'Dr. Hendra Wijaya, S.H., M.Kn.' in notary_sub
        print("   [OK] Booking modal successfully opened for authenticated user Fajar!")

        # Fill required topic and confirm booking
        await page.fill('#booking-topic', 'Konsultasi pendirian PT dan draf akta notaris')
        await page.click('#booking-modal button[type="submit"]')
        await page.wait_for_timeout(400)
        booking_closed = await page.evaluate("() => document.getElementById('booking-modal').classList.contains('hidden')")
        assert booking_closed, "Booking modal should close after confirmation"
        toast_text = await page.inner_text('#toast-container')
        assert 'Janji temu resmi dengan Dr. Hendra Wijaya, S.H., M.Kn. berhasil dijadwalkan' in toast_text
        print("   [OK] Booking confirmed successfully with confirmation toast!")

        # -------------------------------------------------------------
        # 5. Authenticate as Gelsay Behrous (Corporate) & Test Booking and Live Chat
        # -------------------------------------------------------------
        print("\n5. Testing with Corporate Client Gelsay Behrous...")
        await page.evaluate("() => handleUserSignOut()")
        await page.wait_for_timeout(300)
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-gelsay')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        user_gelsay = await page.evaluate('() => window.legalEaseState.currentUser')
        assert user_gelsay is not None and user_gelsay['fullName'] == 'Gelsay Behrous'
        print(f"   [OK] Successfully logged in as: {user_gelsay['fullName']}")

        # Test booking modal as Gelsay
        print("   Testing openBookingModal as Gelsay...")
        await page.evaluate("() => window.openBookingModal('notary-2', 'Kartika Permatasari, S.H., M.Kn.')")
        await page.wait_for_timeout(400)
        booking_open = await page.evaluate("() => !document.getElementById('booking-modal').classList.contains('hidden')")
        assert booking_open, "FAILED: booking-modal did not open for authenticated user Gelsay!"
        print("   [OK] Booking modal opened successfully for Gelsay!")
        await page.evaluate("() => window.closeBookingModal()")

        # Test live chat as Gelsay
        print("   Testing openLiveChat as Gelsay...")
        await page.evaluate("() => window.openLiveChat('notary-1')")
        await page.wait_for_timeout(400)
        chat_open = await page.evaluate("() => !document.getElementById('live-chat-modal').classList.contains('hidden')")
        assert chat_open, "FAILED: live-chat-modal did not open for authenticated user Gelsay!"
        print("   [OK] Live chat opened successfully for authenticated user Gelsay!")
        await page.evaluate("() => window.closeLiveChat()")

        print("\n>>> ALL AUTH-GATE VERIFICATION TESTS PASSED 100%! <<<\n")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
