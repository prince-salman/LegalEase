import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def run():
    print("Testing Flexible Plan Selection for New Registrations & Upgrades...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        print('1. Navigating to http://localhost:8000 ...')
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(1000)

        # Clear session
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.reload()
        await page.wait_for_timeout(1000)

        # TEST 1: Open registration form and verify 3 plan cards are present
        print('2. Checking Registration Modal Plan Selector ...')
        await page.evaluate('() => window.openAuthModal("register")')
        await page.wait_for_timeout(400)

        # Verify all 3 plan cards exist
        card_trial = await page.is_visible('#reg-card-trial')
        card_chat = await page.is_visible('#reg-card-chat')
        card_full = await page.is_visible('#reg-card-full')
        print(f'   Cards visible: Trial={card_trial}, Chat={card_chat}, Full={card_full}')
        assert card_trial and card_chat and card_full, 'All 3 plan cards must be visible in registration form!'

        # Default selected plan should be trial (Rp 0)
        btn_text = await page.inner_text('#reg-submit-text')
        print(f'   Default submit button text: {btn_text}')
        assert 'Free Trial (Rp 0)' in btn_text, 'Default selection must be Free Trial (Rp 0), NOT 300 rb!'

        # TEST 2: Switch to Chat (Rp 150.000)
        print('3. Testing switching to Chat Essential (Rp 150.000) ...')
        await page.click('#reg-card-chat')
        await page.wait_for_timeout(200)
        btn_text = await page.inner_text('#reg-submit-text')
        print(f'   Submit text after choosing Chat: {btn_text}')
        assert '150.000' in btn_text

        # TEST 3: Switch to Full (Rp 300.000)
        print('4. Testing switching to Full Suite (Rp 300.000) ...')
        await page.click('#reg-card-full')
        await page.wait_for_timeout(200)
        btn_text = await page.inner_text('#reg-submit-text')
        print(f'   Submit text after choosing Full: {btn_text}')
        assert '300.000' in btn_text

        # TEST 4: Register with Free Trial (Rp 0) - Should NOT require 300k
        print('5. Registering new client with 3-Day Free Trial (Rp 0) ...')
        await page.click('#reg-card-trial')
        await page.wait_for_timeout(200)

        test_email = 'user_trial_9821@perusahaanbaru.co.id'
        await page.fill('#reg-name', 'Rian Hidayat')
        await page.fill('#reg-company', 'PT Rian Gemilang Abadi')
        await page.fill('#reg-email', test_email)
        await page.fill('#reg-phone', '0812-9988-7766')
        await page.fill('#reg-password', 'password123')
        await page.fill('#reg-city', 'Jakarta Barat')

        await page.click('#reg-submit-btn')
        await page.wait_for_timeout(1500)

        # Check currentUser state
        user = await page.evaluate('() => window.legalEaseState.currentUser')
        view = await page.evaluate('() => window.legalEaseState.currentView')
        print(f'   User logged in: {user["fullName"]} | Plan: {user["planName"]} | View: {view}')
        assert user['plan'] == 'trial', f'Expected plan trial but got {user["plan"]}'
        assert view == 'client_dashboard', 'Should navigate to client_dashboard'

        # Verify checkout modal is NOT opened (since it is Rp 0 Free Trial!)
        is_checkout_open = await page.is_visible('#checkout-modal')
        print(f'   Is checkout modal open for Free Trial: {is_checkout_open}')
        assert not is_checkout_open, 'Checkout modal should NOT open for Free Trial Rp 0!'

        # TEST 5: Verify Plan Upgrade Picker in Client Dashboard
        print('6. Testing Plan Upgrade Picker in Client Dashboard ...')
        upgrade_btn_visible = await page.is_visible('button[onclick*="openPlanPickerModal"]')
        print(f'   Is Upgrade / Pilih Paket button visible in dashboard: {upgrade_btn_visible}')
        assert upgrade_btn_visible, 'Client dashboard must show Pilih / Upgrade Paket button'

        # Click the button to open plan picker modal
        await page.click('button[onclick*="openPlanPickerModal"]')
        await page.wait_for_timeout(400)

        is_plan_picker_open = await page.is_visible('#plan-picker-modal')
        print(f'   Is Plan Picker Modal open: {is_plan_picker_open}')
        assert is_plan_picker_open, 'Plan Picker Modal should be open'

        # Check if both Rp 150k and Rp 300k options are available
        has_chat_upgrade = await page.is_visible('#btn-plan-picker-chat')
        has_full_upgrade = await page.is_visible('#btn-plan-picker-full')
        print(f'   Options visible in picker: Chat 150k={has_chat_upgrade}, Full 300k={has_full_upgrade}')
        assert has_chat_upgrade and has_full_upgrade, 'Both 150k and 300k options must be available to choose!'

        # Click Rp 150k option
        print('7. Choosing Paket Chat Rp 150.000 ...')
        await page.click('#btn-plan-picker-chat')
        await page.wait_for_timeout(500)

        # Verify checkout modal opens with Rp 150.000 (NOT 300.000!)
        checkout_plan_name = await page.evaluate('() => window.legalEaseState.checkoutState.planName')
        checkout_plan_price = await page.evaluate('() => window.legalEaseState.checkoutState.planPrice')
        print(f'   Checkout opened with: {checkout_plan_name} | Price: Rp {checkout_plan_price}')
        assert checkout_plan_price == 150000, f'Expected Rp 150.000 checkout, got {checkout_plan_price}'

        await page.evaluate('() => window.closeCheckoutModal()')
        await page.wait_for_timeout(300)

        # TEST 6: Mobile Responsiveness of Registration & Plan Picker
        print('8. Testing Mobile Responsiveness (375x812) ...')
        await page.set_viewport_size({'width': 375, 'height': 812})
        await page.wait_for_timeout(300)

        # Open plan picker on mobile
        await page.evaluate('() => window.openPlanPickerModal()')
        await page.wait_for_timeout(300)
        scroll_width = await page.evaluate('document.documentElement.scrollWidth')
        client_width = await page.evaluate('document.documentElement.clientWidth')
        print(f'   Mobile Plan Picker: scrollWidth={scroll_width}, clientWidth={client_width}')
        assert scroll_width <= client_width, 'No horizontal overflow allowed on mobile!'

        # Filter real errors
        real_errors = [e for e in errors if 'favicon' not in e.lower()]
        print(f'   Total errors logged: {len(real_errors)}')
        assert len(real_errors) == 0, f'Errors logged: {real_errors}'

        print('>>> ALL FLEXIBLE PLAN SELECTION TESTS PASSED 100%! <<<')
        await browser.close()

asyncio.run(run())
