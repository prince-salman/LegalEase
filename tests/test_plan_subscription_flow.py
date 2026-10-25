import asyncio
from playwright.async_api import async_playwright

async def test_subscription():
    async with async_playwright() as p:
        # Using a standard 1280x800 desktop viewport
        browser = await p.chromium.launch(headless=True)
        ctx1 = await browser.new_context(viewport={'width': 1280, 'height': 800})
        ctx2 = await browser.new_context(viewport={'width': 1280, 'height': 800})

        p1 = await ctx1.new_page() # Device 1: Client
        p2 = await ctx2.new_page() # Device 2: Admin

        errors1 = []
        errors2 = []
        p1.on('pageerror', lambda e: errors1.append(str(e)))
        p2.on('pageerror', lambda e: errors2.append(str(e)))

        print('1. Admin logs in on Device 2...')
        await p2.goto('http://localhost:8000/index.html', wait_until='networkidle')
        await p2.evaluate("() => window.openAuthModal('login')")
        await p2.wait_for_timeout(200)
        await p2.fill('#auth-login-email', 'admin@legalease.co.id')
        await p2.fill('#auth-login-password', 'admin')
        await p2.click('button[type="submit"]')
        await p2.wait_for_timeout(400)
        await p2.evaluate("() => window.openAdminConsole()")

        print('2. New Client registers on Device 1...')
        await p1.goto('http://localhost:8000/index.html', wait_until='networkidle')
        await p1.evaluate("() => window.openAuthModal('register')")
        await p1.wait_for_timeout(200)
        await p1.fill('#reg-name', 'Gelsay Behrous')
        await p1.fill('#reg-company', 'PT Gelsay Law Nusantara')
        await p1.fill('#reg-email', 'gelsay@nusantaralaw.co.id')
        await p1.fill('#reg-phone', '0813-8877-6655')
        await p1.fill('#reg-password', 'gelsaypass')
        await p1.fill('#reg-city', 'Surabaya')
        await p1.click('button[type="submit"]')
        await p1.wait_for_timeout(500)

        # Confirm initial plan is Paket Biasa (Rp 0)
        client_state = await p1.evaluate("() => window.legalEaseState.currentUser")
        print('Initial Client Plan:', client_state['planName'])
        assert client_state['plan'] == 'biasa'
        assert 'Rp 0' in client_state['planName']

        print('3. Client chooses 1 Month Full Legal Suite (Rp 300.000)...')
        await p1.evaluate("() => window.openCheckoutModal('full')")
        await p1.wait_for_timeout(300)

        checkout_open = await p1.evaluate("() => !document.getElementById('checkout-modal').classList.contains('hidden')")
        assert checkout_open
        checkout_text = await p1.inner_text('#checkout-modal-content')
        assert 'Full Legal Suite' in checkout_text
        assert '300.000' in checkout_text
        
        # Verify inputs are auto-filled with registered user data
        val_name = await p1.input_value('#chk-input-name')
        val_company = await p1.input_value('#chk-input-company')
        val_email = await p1.input_value('#chk-input-email')
        assert val_name == 'Gelsay Behrous'
        assert val_company == 'PT Gelsay Law Nusantara'
        assert val_email == 'gelsay@nusantaralaw.co.id'
        print('-> Authentic Checkout Modal displayed and auto-filled properly!')

        print('4. Client selects QRIS payment & clicks Pay Now...')
        await p1.evaluate("() => window.selectPaymentChannel('qris')")
        await p1.wait_for_timeout(200)
        pay_btn = p1.locator('button:has-text("Bayar Sekarang")')
        await pay_btn.scroll_into_view_if_needed()
        await pay_btn.click()
        await p1.wait_for_timeout(600)

        # Check success state
        success_content = await p1.inner_text('#checkout-modal-content')
        assert 'LUNAS' in success_content
        assert 'Pembayaran Berhasil' in success_content
        print('-> Payment succeeded and LUNAS receipt generated!')

        # Verify upgraded user plan on Device 1
        upgraded_state = await p1.evaluate("() => window.legalEaseState.currentUser")
        print('Upgraded Plan:', upgraded_state['planName'], '| Duration:', upgraded_state['planDuration'])
        assert upgraded_state['plan'] == 'full'
        assert len(upgraded_state['transactions']) >= 1
        assert upgraded_state['transactions'][0]['amount'] == 300000

        # Close checkout
        await p1.evaluate("() => window.closeCheckoutModal()")

        print('5. Verifying cross-device sync of subscription on Admin Device 2...')
        await p2.wait_for_timeout(2500)
        await p2.evaluate("() => window.switchAdminTab('transactions')")
        await p2.wait_for_timeout(300)
        tx_table = await p2.inner_text('#admin-tab-content')
        print('Admin Transactions Tab text snippet:\n', tx_table[:400])
        assert 'PT Gelsay Law Nusantara' in tx_table or 'Gelsay Behrous' in tx_table or '300.000' in tx_table

        print('Errors on page1:', len(errors1))
        print('Errors on page2:', len(errors2))
        assert len(errors1) == 0
        assert len(errors2) == 0

        await browser.close()
        print('========================================================================')
        print('*** ALL SUBSCRIPTION & REALTIME PAYMENT SYNC CHECKS PASSED! ***')
        print('========================================================================')

asyncio.run(test_subscription())
