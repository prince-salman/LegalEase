import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Testing Appointment Booking History & Progress Tracker (Task 5 / Item 6)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        # -------------------------------------------------------------
        # 1. Navigate & Reset Session
        # -------------------------------------------------------------
        print("\n1. Navigating to http://localhost:8000 and clearing storage...")
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(800)
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(800)

        # -------------------------------------------------------------
        # 2. Login as Client (Fajar Nugraha)
        # -------------------------------------------------------------
        print("\n2. Authenticating as Client (Fajar Nugraha)...")
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(800)

        user = await page.evaluate('() => window.legalEaseState.currentUser')
        assert user is not None and user.get('fullName') == 'Fajar Nugraha', f"Login failed, user: {user}"
        print(f"   [OK] Authenticated as: {user['fullName']} ({user['email']})")

        # -------------------------------------------------------------
        # 3. Schedule Appointment with Dr. Hendra Wijaya
        # -------------------------------------------------------------
        print("\n3. Scheduling appointment with Dr. Hendra Wijaya...")
        await page.evaluate("() => window.openBookingModal('notary-1', 'Dr. Hendra Wijaya, S.H., M.Kn.')")
        await page.wait_for_timeout(400)

        booking_modal_visible = await page.evaluate("() => !document.getElementById('booking-modal').classList.contains('hidden')")
        assert booking_modal_visible, "FAILED: booking-modal did not open!"
        print("   [OK] Booking modal opened")

        # Select mode: 'voice' (Panggilan Suara Langsung)
        await page.select_option('#booking-mode', 'voice')
        await page.wait_for_timeout(100)

        # Select time
        await page.select_option('#booking-time', '09:00 WIB')
        await page.wait_for_timeout(100)

        # Fill topic
        appointment_topic = "Konsultasi Akta Pendirian PT & KBLI 2020"
        await page.fill('#booking-topic', appointment_topic)
        await page.wait_for_timeout(100)

        # Submit booking
        await page.click('#booking-modal button[type="submit"]')
        await page.wait_for_timeout(500)

        booking_closed = await page.evaluate("() => document.getElementById('booking-modal').classList.contains('hidden')")
        assert booking_closed, "FAILED: booking-modal should be closed after submission"

        toast_text = await page.inner_text('#toast-container')
        assert 'berhasil dijadwalkan' in toast_text, f"Unexpected toast: {toast_text}"
        print(f"   [OK] Appointment successfully scheduled. Toast: {toast_text.strip()[:60]}...")

        # -------------------------------------------------------------
        # 4. Open Client Dashboard -> Tab Riwayat Janji
        # -------------------------------------------------------------
        print("\n4. Checking Client Dashboard -> Tab Riwayat Janji Temu...")
        await page.evaluate("() => window.switchView('client_dashboard')")
        await page.wait_for_timeout(500)

        # Click Tab Riwayat Janji Temu
        tab_btn = await page.query_selector('#btn-client-tab-appointments')
        assert tab_btn is not None, "FAILED: #btn-client-tab-appointments button missing!"
        await tab_btn.click()
        await page.wait_for_timeout(500)

        # Verify active tab in state
        active_tab = await page.evaluate("() => window.legalEaseState.activeClientTab")
        assert active_tab == 'appointments', f"Expected activeClientTab to be 'appointments', got {active_tab}"
        print("   [OK] Switched to 'appointments' tab in Client Dashboard")

        # Verify appointment card rendered
        apt_cards = await page.query_selector_all('.appointment-card')
        assert len(apt_cards) >= 1, f"Expected at least 1 appointment card, found {len(apt_cards)}"
        print(f"   [OK] Found {len(apt_cards)} appointment card(s)")

        card_text = await apt_cards[0].inner_text()
        assert appointment_topic in card_text, f"Expected topic '{appointment_topic}' in card text"
        assert '09:00 WIB' in card_text, "Expected '09:00 WIB' in card text"
        assert 'Dr. Hendra Wijaya' in card_text or 'Dea Cheryna' in card_text, "Expected Notary name in card text"
        assert 'Menunggu Konfirmasi' in card_text, "Expected initial status 'Menunggu Konfirmasi'"
        assert '1. Pengajuan Diajukan' in card_text, "Expected Step 1 '1. Pengajuan Diajukan'"
        print("   [OK] Appointment card details verified: Topic, Date/Time, and Step 1 ('Menunggu Konfirmasi')")

        # -------------------------------------------------------------
        # 5. Switch to Notary Workstation -> Schedule Tab
        # -------------------------------------------------------------
        print("\n5. Switching to Notary Workstation (Dr. Hendra Wijaya)...")
        # Sign out client
        await page.evaluate("() => window.handleUserSignOut()")
        await page.wait_for_timeout(400)

        # Login as notary
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.fill('#auth-login-email', 'notaris@legalease.co.id')
        await page.fill('#auth-login-password', 'notaris123')
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(800)

        curr_notary = await page.evaluate("() => window.legalEaseState.currentUser")
        assert curr_notary is not None and curr_notary.get('role') == 'notary', f"Expected notary login, got: {curr_notary}"
        print(f"   [OK] Authenticated as Notary: {curr_notary['fullName']}")

        # Switch to Notary Schedule Tab
        schedule_tab_btn = await page.query_selector('#btn-notary-tab-schedule')
        assert schedule_tab_btn is not None, "FAILED: #btn-notary-tab-schedule missing!"
        await schedule_tab_btn.click()
        await page.wait_for_timeout(500)

        # Verify Fajar's appointment is in the schedule
        schedule_content = await page.inner_text('#notary-portal-view')
        assert 'Fajar Nugraha' in schedule_content, "Expected Fajar Nugraha in Notary schedule"
        assert appointment_topic in schedule_content, "Expected appointment topic in Notary schedule"
        print("   [OK] Fajar's appointment visible in Notary Agenda")

        # Click 'Konfirmasi Janji' button
        print("   Clicking 'Konfirmasi Janji' button...")
        confirm_btn = await page.query_selector('.btn-confirm-notary-apt, button:has-text("Konfirmasi Janji")')
        assert confirm_btn is not None, "FAILED: 'Konfirmasi Janji' button not found!"
        await confirm_btn.click()
        await page.wait_for_timeout(500)

        toast_text = await page.inner_text('#toast-container')
        assert 'berhasil dikonfirmasi' in toast_text, f"Unexpected confirmation toast: {toast_text}"
        print(f"   [OK] Notary confirmed appointment: {toast_text.strip()[:60]}...")

        # -------------------------------------------------------------
        # 6. Switch back to Client Dashboard -> Tab Riwayat Janji
        # -------------------------------------------------------------
        print("\n6. Switching back to Client Dashboard (Fajar Nugraha)...")
        await page.evaluate("() => window.handleUserSignOut()")
        await page.wait_for_timeout(400)

        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        # Navigate to Client Dashboard & Appointments Tab
        await page.evaluate("() => window.switchView('client_dashboard')")
        await page.wait_for_timeout(400)
        await page.click('#btn-client-tab-appointments')
        await page.wait_for_timeout(500)

        # Verify status is now 'Dikonfirmasi'
        updated_cards = await page.query_selector_all('.appointment-card')
        assert len(updated_cards) >= 1
        updated_text = await updated_cards[0].inner_text()
        assert 'Dikonfirmasi' in updated_text, f"Expected status 'Dikonfirmasi', got: {updated_text}"
        assert 'Jadwal Terkunci' in updated_text, "Expected Step 2 'Jadwal Terkunci'"
        print("   [OK] Client status updated to 'Dikonfirmasi' and Step 2 is active ('Jadwal Terkunci')")

        # -------------------------------------------------------------
        # 7. Test 'Mulai Panggilan Suara' Action Button
        # -------------------------------------------------------------
        print("\n7. Testing 'Mulai Panggilan Suara' button from appointment card...")
        voice_btn = await page.query_selector('.btn-start-voice-call, button:has-text("Mulai Panggilan Suara")')
        assert voice_btn is not None, "FAILED: 'Mulai Panggilan Suara' button missing on confirmed voice appointment!"
        await voice_btn.click()
        await page.wait_for_timeout(500)

        voice_modal_visible = await page.evaluate("() => !document.getElementById('voice-call-modal').classList.contains('hidden')")
        assert voice_modal_visible, "FAILED: voice-call-modal should open upon clicking 'Mulai Panggilan Suara'!"
        print("   [OK] voice-call-modal opened successfully from appointment card!")

        call_notary = await page.evaluate("() => document.getElementById('voice-call-notary-name')?.textContent")
        assert 'Dr. Hendra Wijaya' in call_notary or 'Dea Cheryna' in call_notary, f"Expected Dr. Hendra Wijaya or Dea Cheryna in call modal, got: {call_notary}"
        print(f"   [OK] Voice call connected to: {call_notary}")

        # End voice call
        await page.evaluate("() => window.endVoiceCall()")
        await page.wait_for_timeout(400)
        voice_modal_hidden = await page.evaluate("() => document.getElementById('voice-call-modal').classList.contains('hidden')")
        assert voice_modal_hidden, "voice-call-modal should close after endVoiceCall"
        print("   [OK] Voice call successfully ended and modal closed")

        # Check for unexpected page errors
        real_errors = [e for e in errors if 'ERR_CONNECTION_REFUSED' not in e and 'favicon' not in e]
        assert len(real_errors) == 0, f"Errors logged during test: {real_errors}"

        print("\n=======================================================")
        print(">>> ALL APPOINTMENT HISTORY TESTS PASSED 100%! <<<")
        print("=======================================================")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
