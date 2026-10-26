import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=====================================================================")
    print("Testing Brand Theme Alignment with Logo (Item 15)...")
    print("=====================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        print("\n1. Navigating to http://localhost:8000 ...")
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(600)

        # -------------------------------------------------------------
        # 1. Verify Logo Asset in Header
        # -------------------------------------------------------------
        print("\n2. Checking Logo presence and rendering...")
        logo_img = page.locator('header img[src*="logo"]')
        assert await logo_img.count() >= 1, "Logo image not found in header!"
        
        is_loaded = await logo_img.first.evaluate("img => img.complete && img.naturalWidth > 0")
        assert is_loaded, "Logo image failed to load (naturalWidth <= 0)!"
        print(f"   [OK] Logo is present and successfully rendered in header")

        # -------------------------------------------------------------
        # 2. Verify Theme Color Variables in CSS
        # -------------------------------------------------------------
        print("\n3. Checking CSS Root Variables for Logo Theme Palette...")
        root_vars = await page.evaluate("""() => {
            const style = getComputedStyle(document.documentElement);
            return {
                navy: style.getPropertyValue('--navy-deep').trim(),
                teal: style.getPropertyValue('--teal-emerald').trim(),
                tealDark: style.getPropertyValue('--teal-dark').trim()
            };
        }""")
        print(f"   Detected root vars: {root_vars}")
        assert '#17345e' in root_vars['navy'].lower() or '#17345e' in root_vars['navy'], f"Navy deep variable does not match logo navy #17345E: {root_vars['navy']}"
        assert '#2e9b95' in root_vars['teal'].lower() or '#2e9b95' in root_vars['teal'], f"Teal emerald variable does not match logo teal #2E9B95: {root_vars['teal']}"
        print("   [OK] :root CSS variables properly mapped to official logo colors (#17345E, #2E9B95)")

        # -------------------------------------------------------------
        # 3. Verify Navbar and Hero Theme Accents
        # -------------------------------------------------------------
        print("\n4. Checking Visual Theme harmony on buttons and badges...")
        badge = page.locator('header span:has-text("Platform Resmi")')
        if await badge.count() > 0:
            badge_color = await badge.evaluate("el => getComputedStyle(el).color")
            print(f"   Header badge color: {badge_color}")

        # Check console errors
        assert len(errors) == 0, f"Page errors encountered: {errors}"
        print("   [OK] Zero console errors during theme rendering")

        print("\n=====================================================================")
        print(">>> THEME ALIGNMENT WITH LOGO TEST PASSED 100%! <<<")
        print("=====================================================================")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
