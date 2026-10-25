import asyncio
from playwright.async_api import async_playwright

async def test_distinct_dashboards():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        print('=== 1. VERIFYING ROLE 1: GUEST / VISITOR PUBLIC VIEW ===')
        await page.goto('http://localhost:8000/index.html', wait_until='networkidle')

        # Check visibility of view containers
        is_public_hidden = await page.evaluate("() => document.getElementById('public-landing-view').classList.contains('hidden')")
        is_client_hidden = await page.evaluate("() => document.getElementById('client-portal-view').classList.contains('hidden')")
        is_admin_hidden = await page.evaluate("() => document.getElementById('admin-portal-view').classList.contains('hidden')")

        assert not is_public_hidden, "Public landing view should be VISIBLE for guest!"
        assert is_client_hidden, "Client portal view should be HIDDEN for guest!"
        assert is_admin_hidden, "Admin portal view should be HIDDEN for guest!"

        navbar_text = await page.inner_text('#nav-auth-container')
        print('Guest Navbar text:', navbar_text.replace('\n', ' '))
        assert 'Masuk' in navbar_text
        assert 'Daftar Akun' in navbar_text
        print('-> Role 1 (Guest Visitor) strictly isolated to Public Landing View!')

        print('\n=== 2. VERIFYING ROLE 2: REGISTERED CLIENT DEDICATED WORKSPACE ===')
        await page.evaluate("() => window.openAuthModal('register')")
        await page.wait_for_timeout(200)

        await page.fill('#reg-name', 'Rendra Pratama')
        await page.fill('#reg-company', 'PT Mahakarya Solusi Digital')
        await page.fill('#reg-email', 'rendra@mahakarya.co.id')
        await page.fill('#reg-phone', '0812-4455-6677')
        await page.fill('#reg-password', 'rendrapass123')
        await page.fill('#reg-city', 'Bandung')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(500)

        # Check automatic redirect to dedicated Client Dashboard
        is_public_hidden = await page.evaluate("() => document.getElementById('public-landing-view').classList.contains('hidden')")
        is_client_hidden = await page.evaluate("() => document.getElementById('client-portal-view').classList.contains('hidden')")
        is_admin_hidden = await page.evaluate("() => document.getElementById('admin-portal-view').classList.contains('hidden')")

        assert is_public_hidden, "Public landing view should be HIDDEN after client registration!"
        assert not is_client_hidden, "Client portal view should be VISIBLE after client registration!"
        assert is_admin_hidden, "Admin portal view should be HIDDEN for client!"

        # Check Client Portal Header Banner
        client_banner_text = await page.inner_text('#client-portal-view')
        print('Client Workspace Header summary:\n', client_banner_text[:300].replace('\n', ' '))
        assert 'PT Mahakarya Solusi Digital' in client_banner_text
        assert 'Rendra Pratama' in client_banner_text
        assert 'TERVERIFIKASI AHU KEMENKUMHAM RI' in client_banner_text
        assert 'Paket Biasa (Rp 0)' in client_banner_text

        # Check 4 Corporate Health KPI Cards
        upper_banner = client_banner_text.upper()
        assert 'STATUS AHU ONLINE' in upper_banner
        assert 'DRAF DOKUMEN KORPORASI' in upper_banner
        assert 'NOTARIS PENDAMPING' in upper_banner
        assert 'FAKTUR & TAGIHAN' in upper_banner

        # Test Client Tab 1: Documents & Clauses Preview
        print('2.1 Testing Client Tab: Berkas & Kontrak Perseroan...')
        await page.evaluate("() => window.switchClientTab('documents')")
        await page.wait_for_timeout(200)
        docs_tab_text = await page.inner_text('#client-workspace-tab-content')
        assert 'PILIH INSTRUMEN DOKUMEN' in docs_tab_text.upper()
        assert 'KUSTOMISASI PIHAK & KLAUSUL' in docs_tab_text.upper()
        assert 'PT Mahakarya Solusi Digital' in docs_tab_text

        # Test Client Tab 2: Live Notary Chat Desk
        print('2.2 Testing Client Tab: Konsultasi Notaris (Chat Live)...')
        await page.evaluate("() => window.switchClientTab('chat')")
        await page.wait_for_timeout(200)
        chat_tab_text = await page.inner_text('#client-workspace-tab-content')
        assert 'Dr. Hendra Wijaya' in chat_tab_text
        assert 'Online Siaga' in chat_tab_text
        assert 'Klien: PT Mahakarya Solusi Digital' in chat_tab_text

        # Test Client Tab 3: Invoices History
        print('2.3 Testing Client Tab: Riwayat Tagihan & Faktur...')
        await page.evaluate("() => window.switchClientTab('invoices')")
        await page.wait_for_timeout(200)
        invoices_tab_text = await page.inner_text('#client-workspace-tab-content')
        assert 'Riwayat Tagihan & Faktur Pajak Resmi' in invoices_tab_text
        assert 'Full Legal Suite' in invoices_tab_text

        # Test Seamless View Toggling: Client opens Public Landing View
        print('2.4 Testing View Toggling: Client switches to Public View & back...')
        await page.evaluate("() => window.switchView('public')")
        await page.wait_for_timeout(300)
        is_public_hidden = await page.evaluate("() => document.getElementById('public-landing-view').classList.contains('hidden')")
        is_client_hidden = await page.evaluate("() => document.getElementById('client-portal-view').classList.contains('hidden')")
        assert not is_public_hidden, "Public view should be visible when toggled!"
        assert is_client_hidden, "Client portal should be hidden when browsing public!"

        # Navbar shows toggle button: "Dashboard Klien"
        client_nav = await page.inner_text('#nav-auth-container')
        assert 'Dashboard Klien' in client_nav
        assert 'Rendra Pratama' in client_nav

        # Click Dashboard Klien button to return
        await page.click('button:has-text("Dashboard Klien")')
        await page.wait_for_timeout(300)
        is_client_hidden = await page.evaluate("() => document.getElementById('client-portal-view').classList.contains('hidden')")
        assert not is_client_hidden, "Client portal should be restored when clicking Dashboard Klien!"
        print('-> Role 2 (Client Dashboard Workspace) verified 100% distinct and functional!')

        # Sign out client
        print('\n2.5 Signing out client...')
        await page.evaluate("() => window.handleUserSignOut()")
        await page.wait_for_timeout(300)

        print('\n=== 3. VERIFYING ROLE 3: NOTARY ADMINISTRATOR COMMAND CENTER ===')
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(200)
        await page.fill('#auth-login-email', 'admin@legalease.co.id')
        await page.fill('#auth-login-password', 'admin')
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(500)

        # Check automatic redirect to dedicated Admin Command Center
        is_public_hidden = await page.evaluate("() => document.getElementById('public-landing-view').classList.contains('hidden')")
        is_client_hidden = await page.evaluate("() => document.getElementById('client-portal-view').classList.contains('hidden')")
        is_admin_hidden = await page.evaluate("() => document.getElementById('admin-portal-view').classList.contains('hidden')")

        assert is_public_hidden, "Public landing view should be HIDDEN after admin login!"
        assert is_client_hidden, "Client portal view should be HIDDEN for admin!"
        assert not is_admin_hidden, "Admin portal command center should be VISIBLE after admin login!"

        admin_banner_text = await page.inner_text('#admin-portal-view')
        print('Admin Command Center Header summary:\n', admin_banner_text[:300].replace('\n', ' '))
        assert 'Prof. Dr. Hendra Gunawan, S.H., M.Kn.' in admin_banner_text
        assert 'DEWAN NOTARIS UTAMA & PPAT RI' in admin_banner_text
        assert 'SK: AHU-0019283' in admin_banner_text

        # Check 4 Executive KPI Cards
        admin_upper = admin_banner_text.upper()
        assert 'TOTAL KLIEN TERDAFTAR' in admin_upper
        assert 'TOTAL KAS MASUK' in admin_upper
        assert 'SESI CHAT MULTI-PERANGKAT' in admin_upper
        assert 'INTEGRASI SABH AHU' in admin_upper

        # Test Admin Tab 2: Database Klien Terdaftar
        print('3.1 Testing Admin Tab: Database Klien Terdaftar...')
        await page.evaluate("() => window.switchAdminPortalTab('users')")
        await page.wait_for_timeout(200)
        users_table = await page.inner_text('#admin-portal-tab-content')
        assert 'Database Klien Terdaftar' in users_table
        assert 'PT Mahakarya Solusi Digital' in users_table
        assert 'Rendra Pratama' in users_table

        # Test Admin Tab 3: Buku Kas Transaksi Finansial
        print('3.2 Testing Admin Tab: Buku Kas Transaksi Finansial...')
        await page.evaluate("() => window.switchAdminPortalTab('transactions')")
        await page.wait_for_timeout(200)
        tx_tab = await page.inner_text('#admin-portal-tab-content')
        assert 'Riwayat Tagihan & Pembayaran' in tx_tab

        # Test Admin Tab 4: Antrean Verifikasi Akta AHU
        print('3.3 Testing Admin Tab: Antrean Verifikasi Akta AHU...')
        await page.evaluate("() => window.switchAdminPortalTab('deeds')")
        await page.wait_for_timeout(200)
        deeds_tab = await page.inner_text('#admin-portal-tab-content')
        assert 'Antrean Verifikasi Akta & SABH Kemenkumham RI' in deeds_tab
        assert 'PT Mahakarya Solusi Digital' in deeds_tab
        assert 'Pengecekan Nama AHU' in deeds_tab
        assert 'KBLI 2020 Terverifikasi' in deeds_tab

        # Test View Toggling: Admin switches to Public Landing View
        print('3.4 Testing View Toggling: Admin switches to Public View & back...')
        await page.evaluate("() => window.switchView('public')")
        await page.wait_for_timeout(300)
        is_public_hidden = await page.evaluate("() => document.getElementById('public-landing-view').classList.contains('hidden')")
        is_admin_hidden = await page.evaluate("() => document.getElementById('admin-portal-view').classList.contains('hidden')")
        assert not is_public_hidden, "Public view should be visible when admin browses public!"
        assert is_admin_hidden, "Admin portal should be hidden when browsing public!"

        # Navbar shows toggle button: "Konsol Notaris"
        admin_nav = await page.inner_text('#nav-auth-container')
        assert 'Konsol Notaris' in admin_nav

        # Click Konsol Notaris button to return
        await page.click('button:has-text("Konsol Notaris")')
        await page.wait_for_timeout(300)
        is_admin_hidden = await page.evaluate("() => document.getElementById('admin-portal-view').classList.contains('hidden')")
        assert not is_admin_hidden, "Admin portal should be restored when clicking Konsol Notaris!"
        print('-> Role 3 (Admin Command Center) verified 100% distinct and functional!')

        # 4. Sign Out
        print('\n=== 4. TESTING SIGN OUT RETURN TO PUBLIC VIEW ===')
        await page.evaluate("() => window.handleUserSignOut()")
        await page.wait_for_timeout(300)

        is_public_hidden = await page.evaluate("() => document.getElementById('public-landing-view').classList.contains('hidden')")
        is_client_hidden = await page.evaluate("() => document.getElementById('client-portal-view').classList.contains('hidden')")
        is_admin_hidden = await page.evaluate("() => document.getElementById('admin-portal-view').classList.contains('hidden')")

        assert not is_public_hidden, "Public landing view must be restored on sign out!"
        assert is_client_hidden, "Client portal must be hidden on sign out!"
        assert is_admin_hidden, "Admin portal must be hidden on sign out!"

        # 5. Check forbidden words
        body_text = await page.inner_text('body')
        forbidden_words = ['demo', 'prototype', 'simulator', 'sample data', 'mockup']
        for w in forbidden_words:
            assert w not in body_text.lower(), f"Forbidden word '{w}' in body"

        print('Errors encountered on page:', len(errors))
        assert len(errors) == 0

        await browser.close()
        print('========================================================================')
        print('*** ALL DISTINCT ROLE DASHBOARD SYSTEM VERIFICATIONS PASSED 100%! ***')
        print('========================================================================')

asyncio.run(test_distinct_dashboards())
