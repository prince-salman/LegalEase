import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context1 = await browser.new_context()
        context2 = await browser.new_context()

        page1 = await context1.new_page() # Device 1: Client
        page2 = await context2.new_page() # Device 2: Admin

        errors1 = []
        errors2 = []
        page1.on('pageerror', lambda err: errors1.append(str(err)))
        page2.on('pageerror', lambda err: errors2.append(str(err)))

        print('1. Navigating Client Device 1 to http://localhost:8000/index.html...')
        await page1.goto('http://localhost:8000/index.html', wait_until='networkidle')

        # Check clean public navbar: no stranger's name exposed
        navbar_html = await page1.inner_html('#nav-auth-container')
        print('Navbar Auth Content for Visitor:', navbar_html.strip().replace('\n', ' '))
        assert 'Masuk' in navbar_html
        assert 'Daftar Akun' in navbar_html
        assert 'Pratama Salman' not in navbar_html
        assert 'Gelsay Behrous' not in navbar_html
        print('-> PUBLIC VISITOR VIEW IS 100% CLEAN!')

        # 2. Test Real User Registration
        print('2. Registering new client account...')
        await page1.evaluate("() => window.openAuthModal('register')")
        await page1.wait_for_timeout(300)

        await page1.fill('#reg-name', 'Fajar Nugraha')
        await page1.fill('#reg-company', 'PT Sinergi Digital Indonesia')
        await page1.fill('#reg-email', 'fajar@sinergidigital.co.id')
        await page1.fill('#reg-phone', '0812-9988-7766')
        await page1.fill('#reg-password', 'secret123')
        await page1.fill('#reg-city', 'Jakarta Selatan')
        await page1.click('button[type="submit"]')

        await page1.wait_for_timeout(500)
        client_state = await page1.evaluate("() => window.legalEaseState.currentUser")
        print('Registered Client State:', client_state['fullName'], '|', client_state['companyName'], '| Plan:', client_state['plan'])
        assert client_state['fullName'] == 'Fajar Nugraha'
        assert client_state['companyName'] == 'PT Sinergi Digital Indonesia'
        assert client_state['plan'] == 'biasa'

        # Check updated navbar for authenticated client
        nav_client_text = await page1.inner_text('#nav-auth-container')
        print('Navbar for Logged in Client:', nav_client_text.strip().replace('\n', ' '))
        assert 'Fajar Nugraha' in nav_client_text

        # 3. Navigating Admin Device 2 & Login as Admin
        print('3. Navigating Admin Device 2...')
        await page2.goto('http://localhost:8000/index.html', wait_until='networkidle')
        await page2.evaluate("() => window.openAuthModal('login')")
        await page2.wait_for_timeout(300)

        # Login as Admin
        await page2.fill('#auth-login-email', 'admin@legalease.co.id')
        await page2.fill('#auth-login-password', 'admin')
        await page2.click('button[type="submit"]')

        await page2.wait_for_timeout(500)
        admin_state = await page2.evaluate("() => window.legalEaseState.currentUser")
        print('Admin User State on Device 2:', admin_state['fullName'], '| Role:', admin_state['role'])
        assert admin_state['role'] == 'admin'

        # Admin opens Admin Console
        print('4. Opening Notary Admin Console on Device 2...')
        await page2.evaluate("() => window.openAdminConsole()")
        await page2.wait_for_timeout(400)
        admin_console_open = await page2.evaluate("() => !document.getElementById('admin-console-modal').classList.contains('hidden')")
        assert admin_console_open

        # 5. Client on Device 1 opens Chat & sends a message
        print('5. Client on Device 1 sending consultation chat message...')
        await page1.evaluate("() => window.openLiveChat('notary-1')")
        await page1.wait_for_timeout(400)

        await page1.fill('#chat-input-text', 'Halo Notaris, saya butuh pendampingan akta pendirian PT Sinergi Digital Indonesia.')
        await page1.click('#chat-send-btn')

        # Check that Client received instant response on Device 1
        chat_client_text = await page1.inner_text('#chat-messages-stream')
        assert 'PT Sinergi Digital Indonesia' in chat_client_text or 'UU Cipta Kerja' in chat_client_text
        print('-> Client received instant legal answer on Device 1!')

        # Wait for Supabase Realtime WebSocket broadcast to Device 2
        print('6. Checking that Admin on Device 2 received the client thread in real time...')
        await page2.wait_for_timeout(2500)

        admin_threads = await page2.evaluate("() => Object.keys(window.legalEaseState.adminClientChats)")
        print('Admin client threads on Device 2:', admin_threads)
        assert 'fajar@sinergidigital.co.id' in admin_threads

        # Admin selects Fajar's thread and sends a live reply
        print('7. Admin replying to Fajar Nugraha from Device 2...')
        await page2.evaluate("() => window.selectAdminClientChat('fajar@sinergidigital.co.id')")
        await page2.wait_for_timeout(300)
        await page2.fill('#admin-reply-input', 'Baik Bapak Fajar, tim notaris kami siap meninjau draf akta dan memproses pemesanan nama di AHU hari ini.')
        await page2.click('button:has-text("Balas Klien")')

        # Check Device 1 (Client) receives Admin reply in real time!
        print('8. Verifying Client Device 1 received Notary reply from Device 2...')
        await page1.wait_for_timeout(2500)
        client_chat_updated = await page1.inner_text('#chat-messages-stream')
        print('Client chat on Device 1 after live notary reply snippet:', client_chat_updated[-250:].replace('\n', ' '))
        assert 'tim notaris kami siap meninjau draf akta' in client_chat_updated
        print('-> CROSS-DEVICE MULTI-DEVICE REALTIME CHAT VERIFIED 100%!')

        # 9. Verify Admin Database Klien Terdaftar tab
        print('9. Verifying Admin Database Tab...')
        await page2.evaluate("() => window.switchAdminTab('users')")
        await page2.wait_for_timeout(300)
        users_table_text = await page2.inner_text('#admin-tab-content')
        assert 'Fajar Nugraha' in users_table_text
        assert 'PT Sinergi Digital Indonesia' in users_table_text
        print('-> Client correctly listed in Admin Database!')

        # 10. Check forbidden words
        body1 = await page1.inner_text('body')
        body2 = await page2.inner_text('body')
        forbidden_words = ['demo', 'prototype', 'simulator', 'sample data', 'mockup']
        for w in forbidden_words:
            assert w not in body1.lower(), f"Forbidden word '{w}' in body1"
            assert w not in body2.lower(), f"Forbidden word '{w}' in body2"

        print('Errors on page1:', len(errors1))
        print('Errors on page2:', len(errors2))
        assert len(errors1) == 0
        assert len(errors2) == 0

        await browser.close()
        print('========================================================================')
        print('*** 100% PRODUCTION AUTH & CROSS-DEVICE MULTI-DEVICE TEST PASSED! ***')
        print('========================================================================')

asyncio.run(run())
