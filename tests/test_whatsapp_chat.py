import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=====================================================================")
    print("Testing WhatsApp-Style Downward Chat & Admin Replies (Items 11 & 12)...")
    print("=====================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        print("\n1. Navigating to http://localhost:8000 and clearing local storage...")
        await page.goto('http://localhost:8000')
        await page.evaluate("() => localStorage.clear()")
        await page.reload()
        await page.wait_for_timeout(800)

        # -------------------------------------------------------------
        # 1. Login as Client (Fajar Nugraha)
        # -------------------------------------------------------------
        print("\n2. Logging in as Client (Fajar Nugraha)...")
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        # -------------------------------------------------------------
        # 2. Open Live Chat with Notary
        # -------------------------------------------------------------
        print("\n3. Opening Live Chat with Dr. Hendra Wijaya...")
        await page.evaluate("() => window.openLiveChat('notary-1')")
        await page.wait_for_timeout(500)

        chat_modal = page.locator('#live-chat-modal')
        assert not await chat_modal.evaluate("el => el.classList.contains('hidden')"), "Live chat modal did not open!"
        print("   [OK] Live chat modal opened")

        # -------------------------------------------------------------
        # 3. Check Initial Opening Greeting (Item 12: pembukaan chat gapapa bot)
        # -------------------------------------------------------------
        initial_notary_bubbles = page.locator('#chat-messages-stream .chat-bubble-notary')
        initial_count = await initial_notary_bubbles.count()
        assert initial_count >= 1, "Initial opening greeting from Notary is missing!"
        greeting_text = await initial_notary_bubbles.first.inner_text()
        print(f"   [OK] Initial opening greeting verified:\n   {repr(greeting_text[:80])}...")

        initial_user_bubbles = page.locator('#chat-messages-stream .chat-bubble-user')
        assert await initial_user_bubbles.count() == 0, "There should be no user messages yet!"

        # -------------------------------------------------------------
        # 4. Client sends a message (Item 12: jangan dijwb sm bot chatnya)
        # -------------------------------------------------------------
        print("\n4. Client sending inquiry to Notary...")
        client_question = "Selamat siang Notaris Hendra, mohon telaah draf klausul somasi dan ganti rugi kami."
        await page.fill('#chat-input-text', client_question)
        await page.wait_for_timeout(100)
        await page.click('#live-chat-modal form button[type="submit"]')
        await page.wait_for_timeout(600)

        # Verify user message appears with WhatsApp styling (Item 11)
        user_bubbles = page.locator('#chat-messages-stream .chat-bubble-user')
        assert await user_bubbles.count() == 1, "User bubble not found!"
        user_bubble_html = await user_bubbles.first.evaluate("el => el.innerHTML")
        assert "bg-[#D9FDD3]" in user_bubble_html, "User bubble does not have WhatsApp green background #D9FDD3!"
        assert "✓✓" in user_bubble_html, "User bubble does not have double checkmark ✓✓!"
        print("   [OK] Item 11: User bubble has WhatsApp green styling (#D9FDD3) and double checkmark (✓✓)")

        # Verify pending status indicator is displayed
        pending_status = page.locator('#chat-messages-stream .chat-pending-status')
        assert await pending_status.count() == 1, "Pending status indicator not displayed!"
        status_text = await pending_status.inner_text()
        assert "Menunggu tanggapan langsung" in status_text, f"Unexpected status text: {status_text}"
        print(f"   [OK] Pending status indicator active: {status_text.strip()}")

        # CRITICAL TEST: Wait 1.5 seconds and ensure NO bot response was generated!
        print("\n5. Verifying bot auto-response is SUPPRESSED (Item 12)...")
        await page.wait_for_timeout(1500)
        notary_bubbles_after = page.locator('#chat-messages-stream .chat-bubble-notary')
        notary_count_after = await notary_bubbles_after.count()
        assert notary_count_after == initial_count, f"FAILED: Bot generated an automatic reply! Count was {initial_count}, now {notary_count_after}"
        print("   [OK] Item 12: Zero bot responses generated! Notary bubble count remained strictly at 1.")

        # -------------------------------------------------------------
        # 5. Admin / Notary logs in and replies manually (Item 12)
        # -------------------------------------------------------------
        print("\n6. Logging in as Admin Gede to send manual reply...")
        await page.evaluate("() => window.closeLiveChat()")
        await page.wait_for_timeout(300)
        await page.evaluate("() => window.handleUserSignOut()")
        await page.wait_for_timeout(400)

        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-admin')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        # Switch to Admin Dashboard & Chats Tab
        await page.evaluate("() => window.switchView('admin_dashboard')")
        await page.wait_for_timeout(400)
        await page.evaluate("() => window.switchAdminTab('chats')")
        await page.wait_for_timeout(400)

        # Select client chat thread for Fajar
        client_thread_btn = page.locator("div[onclick*='selectAdminClientChat']:has-text('Fajar Nugraha')")
        if await client_thread_btn.count() == 0:
            client_thread_btn = page.locator(":is(div, button):has-text('Fajar Nugraha')")
        assert await client_thread_btn.count() >= 1, "Fajar's chat thread not found in Admin Console!"
        await client_thread_btn.first.click()
        await page.wait_for_timeout(400)

        # Verify client's inquiry is visible to admin
        admin_chat_view = page.locator('#admin-portal-tab-content #admin-chat-messages')
        if await admin_chat_view.count() == 0:
            admin_chat_view = page.locator('#admin-chat-messages').first
        admin_chat_text = await admin_chat_view.inner_text()
        assert client_question in admin_chat_text, "Client's inquiry not visible to admin!"
        print("   [OK] Client's inquiry visible in Admin Console")

        # Admin sends real manual reply
        admin_manual_reply = "Baik Pak Fajar, klausul somasi 7 hari kerja telah kami periksa dan kami rekomendasikan ditambahkan pada Pasal 8 PKS."
        print(f"   Admin typing manual response: {repr(admin_manual_reply)}")
        reply_input = page.locator('#admin-portal-tab-content #admin-reply-input')
        if await reply_input.count() == 0:
            reply_input = page.locator('#admin-reply-input').first
        await reply_input.fill(admin_manual_reply)
        await page.wait_for_timeout(100)
        
        reply_btn = page.locator("#admin-portal-tab-content button:has-text('Balas Klien')")
        if await reply_btn.count() == 0:
            reply_btn = page.locator("button:has-text('Balas Klien')").first
        await reply_btn.click()
        await page.wait_for_timeout(600)

        toast_text = await page.inner_text('#toast-container')
        assert "berhasil dikirimkan" in toast_text, f"Unexpected toast: {toast_text}"
        print("   [OK] Admin manual reply dispatched successfully")

        # -------------------------------------------------------------
        # 6. Switch back to Client and verify the real reply appears
        # -------------------------------------------------------------
        print("\n7. Switching back to Client (Fajar Nugraha) to verify live response...")
        await page.evaluate("() => window.handleUserSignOut()")
        await page.wait_for_timeout(400)

        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(300)
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        await page.evaluate("() => window.openLiveChat('notary-1')")
        await page.wait_for_timeout(500)

        # Verify all 3 messages are present in chronological downward order
        all_messages_stream = page.locator('#chat-messages-stream')
        stream_text = await all_messages_stream.inner_text()
        assert admin_manual_reply in stream_text, "Admin manual reply not visible in Client chat stream!"
        print("   [OK] Admin's manual reply is rendered in Client chat stream!")

        # Verify downward ordering (Greeting -> User inquiry -> Admin reply)
        pos_greeting = stream_text.find("Halo Bapak/Ibu")
        pos_user = stream_text.find(client_question)
        pos_admin = stream_text.find(admin_manual_reply)

        assert pos_greeting < pos_user < pos_admin, f"Messages not in downward chronological order! Pos: greeting={pos_greeting}, user={pos_user}, admin={pos_admin}"
        print("   [OK] Item 11: Stream renders in strict downward chronological sequence (Greeting -> User -> Admin)")

        # Verify auto-scroll to bottom
        scroll_info = await all_messages_stream.evaluate("""el => ({
            scrollTop: el.scrollTop,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight
        })""")
        assert scroll_info['scrollTop'] >= (scroll_info['scrollHeight'] - scroll_info['clientHeight'] - 50), f"Stream not scrolled to bottom: {scroll_info}"
        print(f"   [OK] Stream auto-scrolled down to bottom: {scroll_info}")

        # Check errors
        assert len(errors) == 0, f"Page errors encountered: {errors}"
        print("   [OK] Zero console/page errors detected.")

        print("\n=====================================================================")
        print(">>> ALL WHATSAPP CHAT & ADMIN REPLY TESTS PASSED 100%! <<<")
        print("=====================================================================")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
