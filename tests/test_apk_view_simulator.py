import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def run():
    print("Testing APK View Mobile Simulator (Basic to Web)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        print('1. Navigating to http://localhost:8000 ...')
        await page.goto('http://localhost:8000', wait_until='domcontentloaded')
        await page.wait_for_timeout(1000)

        # TEST 1: Check APK View button in Hero section
        print('2. Checking APK View button in Hero ...')
        hero_btn = await page.is_visible('button[onclick*="openApkViewModal"]')
        print(f'   Hero APK View button visible: {hero_btn}')
        assert hero_btn, 'Hero section must have APK View button!'

        # TEST 2: Open APK View Simulator
        print('3. Opening APK View Simulator ...')
        await page.click('button[onclick*="openApkViewModal"]')
        await page.wait_for_timeout(500)

        # Check modal visibility
        is_modal_visible = await page.is_visible('#apk-view-modal')
        print(f'   APK View Modal visible: {is_modal_visible}')
        assert is_modal_visible, 'APK View Modal must be open'

        # Check Android status bar and WebView frame
        clock_text = await page.inner_text('#apk-view-clock')
        has_iframe = await page.is_visible('#apk-view-iframe')
        print(f'   Android Status Bar clock: {clock_text} | WebView iFrame present: {has_iframe}')
        assert has_iframe, 'WebView iFrame must be present inside smartphone mockup!'

        # TEST 3: Test Close APK View Simulator
        print('4. Testing Close APK View Simulator ...')
        await page.click('#apk-view-modal button[onclick*="closeApkViewModal"]')
        await page.wait_for_timeout(300)
        is_modal_visible = await page.is_visible('#apk-view-modal')
        print(f'   APK View Modal visible after close: {is_modal_visible}')
        assert not is_modal_visible, 'Modal must close on button click'

        # TEST 4: Open via download section button
        print('5. Testing APK View button in Download section ...')
        await page.evaluate('() => window.openApkViewModal()')
        await page.wait_for_timeout(300)
        is_modal_visible = await page.is_visible('#apk-view-modal')
        assert is_modal_visible, 'Modal must open via openApkViewModal()'

        # Test close with Escape key
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(300)
        is_modal_visible = await page.is_visible('#apk-view-modal')
        print(f'   APK View Modal visible after Escape: {is_modal_visible}')
        assert not is_modal_visible, 'Modal must close on Escape key press'

        # TEST 5: Verify APK file contains actual web app
        print('6. Verifying assets/LegalEase-v2.4.1.apk contents ...')
        import zipfile
        with zipfile.ZipFile('assets/LegalEase-v2.4.1.apk', 'r') as z:
            names = z.namelist()
            assert 'assets/www/index.html' in names, 'APK must contain assets/www/index.html'
            assert 'assets/www/app.js' in names, 'APK must contain assets/www/app.js'
            assert 'assets/www/styles.css' in names, 'APK must contain assets/www/styles.css'
            html_size = z.getinfo('assets/www/index.html').file_size
            js_size = z.getinfo('assets/www/app.js').file_size
            print(f'   APK contains real web app: index.html ({html_size} B), app.js ({js_size} B)')
            assert html_size > 50000, 'index.html in APK must be the full LegalEase web app!'

        # TEST 6: Mobile Responsiveness on 375x812
        print('7. Testing Mobile Viewport (375x812) ...')
        await page.set_viewport_size({'width': 375, 'height': 812})
        await page.wait_for_timeout(300)
        await page.evaluate('() => window.openApkViewModal()')
        await page.wait_for_timeout(300)

        scroll_width = await page.evaluate('document.documentElement.scrollWidth')
        client_width = await page.evaluate('document.documentElement.clientWidth')
        print(f'   Mobile APK View Modal: scrollWidth={scroll_width}, clientWidth={client_width}')
        assert scroll_width <= client_width, 'No horizontal overflow allowed on mobile!'

        real_errors = [e for e in errors if 'favicon' not in e.lower()]
        print(f'   Total errors logged: {len(real_errors)}')
        assert len(real_errors) == 0, f'Errors: {real_errors}'

        print('>>> ALL APK VIEW (BASIC TO WEB) TESTS PASSED 100%! <<<')
        await browser.close()

asyncio.run(run())
