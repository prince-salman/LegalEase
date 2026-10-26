import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Testing Voice Call Interface & Video Call Replacement (Task 4 / Item 4)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        # -------------------------------------------------------------
        # 1. Check Unauthenticated Voice Call Trigger (Auth-Gate)
        # -------------------------------------------------------------
        print("\n1. Navigating to http://localhost:8000 (Guest / Unauthenticated) ...")
        await page.goto('http://localhost:8000', wait_until='domcontentloaded')
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.reload(wait_until='domcontentloaded')
        await page.wait_for_timeout(500)

        user = await page.evaluate('() => window.legalEaseState.currentUser')
        assert user is None, f"Expected currentUser to be None, got: {user}"
        print("   [OK] Visitor is unauthenticated")

        # Verify #voice-call-modal is initially hidden
        vc_hidden = await page.evaluate("() => document.getElementById('voice-call-modal').classList.contains('hidden')")
        assert vc_hidden, "voice-call-modal should be hidden initially"
        print("   [OK] voice-call-modal is initially hidden")

        # Click Call button on directory card while unauthenticated
        print("   Triggering startVoiceCall while unauthenticated...")
        call_btn = await page.query_selector("button:has-text('Call')")
        assert call_btn is not None, "Call button should exist on notary cards"
        await call_btn.click()
        await page.wait_for_timeout(400)

        # Verify voice-call-modal stayed hidden and auth-modal opened
        vc_hidden = await page.evaluate("() => document.getElementById('voice-call-modal').classList.contains('hidden')")
        auth_open = await page.evaluate("() => !document.getElementById('auth-modal').classList.contains('hidden')")
        assert vc_hidden, "voice-call-modal must remain hidden for unauthenticated visitors"
        assert auth_open, "auth-modal must open when unauthenticated visitor triggers voice call"
        toast_text = await page.inner_text('#toast-container')
        assert 'memulai panggilan suara dengan Notaris' in toast_text
        print("   [OK] Auth-gate blocked unauthenticated voice call with login prompt")

        # Close auth modal
        await page.evaluate("() => window.closeAuthModal()")
        await page.wait_for_timeout(300)

        # -------------------------------------------------------------
        # 2. Authenticate as Client & Test Voice Call Flow
        # -------------------------------------------------------------
        print("\n2. Authenticating as Client (Fajar Nugraha) ...")
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)
        curr_user = await page.evaluate('() => window.legalEaseState.currentUser')
        assert curr_user is not None, "Failed to authenticate as client"
        print(f"   [OK] Authenticated as: {curr_user.get('fullName')}")

        # Ensure we are back on public view to see notary cards
        await page.evaluate("() => window.switchView('public')")
        await page.wait_for_timeout(300)

        # -------------------------------------------------------------
        # 3. Start Voice Call with Notary
        # -------------------------------------------------------------
        print("\n3. Starting Voice Call with Notary (Dr. Hendra Wijaya) ...")
        call_btn = await page.query_selector("button:has-text('Call')")
        assert call_btn is not None
        await call_btn.click()
        await page.wait_for_timeout(400)

        # Verify voice-call-modal opened
        vc_hidden = await page.evaluate("() => document.getElementById('voice-call-modal').classList.contains('hidden')")
        assert not vc_hidden, "FAILED: voice-call-modal should be visible after starting call"
        print("   [OK] voice-call-modal is visible")

        # Verify Notary information displayed in modal
        notary_name = await page.evaluate("() => document.getElementById('voice-call-notary-name')?.textContent")
        assert 'Dr. Hendra Wijaya' in notary_name, f"Expected Dr. Hendra Wijaya, got: {notary_name}"
        status_text = await page.evaluate("() => document.getElementById('voice-call-status')?.textContent")
        assert 'Terhubung' in status_text, f"Expected Terhubung, got: {status_text}"
        print(f"   [OK] Notary details rendered: {notary_name} ({status_text})")

        # Verify timer is running and advances past 00:01
        print("   Verifying live timer progression...")
        init_timer = await page.evaluate("() => document.getElementById('voice-call-timer')?.textContent")
        assert init_timer in ['00:00', '00:01'], f"Initial timer unexpected: {init_timer}"
        await page.wait_for_timeout(2200)
        advanced_timer = await page.evaluate("() => document.getElementById('voice-call-timer')?.textContent")
        print(f"   Timer advanced to: {advanced_timer}")
        assert advanced_timer in ['00:02', '00:03', '00:04'], f"Timer did not advance as expected: {advanced_timer}"
        print("   [OK] Live timer advanced past 00:01")

        # -------------------------------------------------------------
        # 4. Test Controls: Mute and Speaker Toggles
        # -------------------------------------------------------------
        print("\n4. Testing Controls (Mute & Speakerphone) ...")
        mute_label_before = await page.evaluate("() => document.getElementById('voice-call-mute-label')?.textContent")
        assert mute_label_before == 'Mute'
        await page.click('#voice-call-mute-btn')
        await page.wait_for_timeout(300)
        mute_label_after = await page.evaluate("() => document.getElementById('voice-call-mute-label')?.textContent")
        assert mute_label_after == 'Muted', f"Expected Muted, got: {mute_label_after}"
        print("   [OK] Mute toggle switched to Muted")

        # Toggle back
        await page.click('#voice-call-mute-btn')
        await page.wait_for_timeout(200)
        mute_label_restored = await page.evaluate("() => document.getElementById('voice-call-mute-label')?.textContent")
        assert mute_label_restored == 'Mute'
        print("   [OK] Mute toggle switched back to Mute")

        # Speaker toggle
        speaker_label_before = await page.evaluate("() => document.getElementById('voice-call-speaker-label')?.textContent")
        assert speaker_label_before == 'Speaker On'
        await page.click('#voice-call-speaker-btn')
        await page.wait_for_timeout(300)
        speaker_label_after = await page.evaluate("() => document.getElementById('voice-call-speaker-label')?.textContent")
        assert speaker_label_after == 'Speaker Off'
        print("   [OK] Speaker toggle switched to Speaker Off")

        await page.click('#voice-call-speaker-btn')
        await page.wait_for_timeout(200)
        speaker_label_restored = await page.evaluate("() => document.getElementById('voice-call-speaker-label')?.textContent")
        assert speaker_label_restored == 'Speaker On'
        print("   [OK] Speaker toggle restored to Speaker On")

        # -------------------------------------------------------------
        # 5. Test End Call Button & Summary Toast
        # -------------------------------------------------------------
        print("\n5. Testing End Call Button ...")
        await page.click('#voice-call-end-btn')
        await page.wait_for_timeout(400)

        vc_hidden_after = await page.evaluate("() => document.getElementById('voice-call-modal').classList.contains('hidden')")
        assert vc_hidden_after, "voice-call-modal should be hidden after ending call"
        toast_text = await page.inner_text('#toast-container')
        assert 'selesai' in toast_text.lower(), f"Expected completion toast, got: {toast_text}"
        print("   [OK] Call ended cleanly, modal hidden, and summary toast displayed")

        # -------------------------------------------------------------
        # 6. Verify Booking Modal Dropdown Options (No Video Call, Only Voice)
        # -------------------------------------------------------------
        print("\n6. Verifying Booking Modal Dropdown Options ...")
        await page.evaluate("() => window.openBookingModal('notary-1', 'Dr. Hendra Wijaya')")
        await page.wait_for_timeout(300)

        options = await page.evaluate('''() => {
            const select = document.getElementById('booking-mode');
            return Array.from(select.options).map(o => ({ value: o.value, text: o.text }));
        }''')
        print(f"   Booking mode options found: {options}")

        # Assert NO video call option exists
        for opt in options:
            assert 'video' not in opt['value'].lower(), f"Found leftover video option value: {opt}"
            assert 'video' not in opt['text'].lower(), f"Found leftover video option text: {opt}"
            assert 'webrtc' not in opt['text'].lower(), f"Found leftover webrtc in option text: {opt}"

        # Assert Voice call option exists
        has_voice = any(opt['value'] == 'voice' or 'suara' in opt['text'].lower() for opt in options)
        assert has_voice, f"Expected Voice Call option in booking-mode, got: {options}"
        print("   [OK] Booking modal contains Panggilan Suara and 0 video call options")

        await page.evaluate("() => window.closeBookingModal()")

        # -------------------------------------------------------------
        # 7. Verify Public Page Copy (Zero video call / WebRTC references)
        # -------------------------------------------------------------
        print("\n7. Verifying Residual Video Call Copy on Public Page ...")
        body_text = await page.evaluate("() => document.body.innerText")
        residual_phrases = [
            'Video Call WebRTC',
            'Video Call Tatap Muka',
            'Video Call Notaris Terkunci',
            'Tidak Termasuk Video Call',
            'Panggilan Video 1-on-1',
            'Ruang VC'
        ]
        for phrase in residual_phrases:
            assert phrase.lower() not in body_text.lower(), f"Found residual phrase on page: '{phrase}'"
        print("   [OK] Zero residual video call references found in public copy")

        # -------------------------------------------------------------
        # 8. Check for Console/Page Errors
        # -------------------------------------------------------------
        print("\n8. Checking for browser/page errors ...")
        assert len(errors) == 0, f"Encountered errors: {errors}"
        print("   [OK] 0 console or page errors detected")

        print("\n>>> ALL VOICE CALL VERIFICATION TESTS PASSED 100%! <<<\n")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
