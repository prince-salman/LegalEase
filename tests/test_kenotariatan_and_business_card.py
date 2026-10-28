import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("=== TESTING KENOTARIATAN, REMOVAL OF PKS/PKWT/NDA, AND NOTARY BUSINESS CARD ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))

        # 1. Load application
        await page.goto('http://127.0.0.1:8000', wait_until='networkidle')
        await page.wait_for_timeout(300)

        # 2. Check Requirement 1: "Solusi Hukum & Kenotariatan"
        hero_title = await page.locator('#hero h1').inner_text()
        print(f"Hero Title: {repr(hero_title.strip())}")
        assert "Kenotariatan" in hero_title, f"Expected 'Kenotariatan' in hero headline, got: {hero_title}"
        assert "Notaris Korporasi" not in hero_title, "Found old 'Notaris Korporasi' in hero headline!"
        print("✓ Item 1 PASSED: 'Solusi Hukum & Kenotariatan' verified in Hero headline")

        # 3. Check Requirement 2: PKS, PKWT, NDA removed from UI & templates
        template_tabs = await page.locator('#template-buttons-container button').all_inner_texts()
        print(f"Template Tabs in UI: {template_tabs}")
        for tab in template_tabs:
            assert "PKS" not in tab, f"PKS tab should be removed: {tab}"
            assert "PKWT" not in tab, f"PKWT tab should be removed: {tab}"
            assert "NDA" not in tab, f"NDA tab should be removed: {tab}"
        print("✓ Item 2 PASSED: PKS, PKWT, NDA are completely removed from template tabs")

        # 4. Check Requirement 3: Real Notary Dea Cheryna, S.H., M.Kn. & Official Business Card
        notary_cards = page.locator('#notaries-cards-container > div')
        first_notary_name = await notary_cards.first.locator('h3').inner_text()
        print(f"Primary Notary Name: {first_notary_name}")
        assert "Dea Cheryna, S.H., M.Kn." in first_notary_name, f"Expected Dea Cheryna as primary notary, got: {first_notary_name}"

        # Verify avatar is the formal photo
        avatar_src = await notary_cards.first.locator('img').first.get_attribute('src')
        assert "dea_cheryna" in avatar_src or "assets/notaris" in avatar_src, f"Expected formal photo in avatar, got: {avatar_src}"
        print(f"✓ Primary Notary Avatar verified: {avatar_src}")

        # Check Business Card Button
        card_btn = notary_cards.first.locator('button:has-text("Kartu Nama Resmi Notaris & PPAT")')
        assert await card_btn.count() == 1, "Business Card button missing on Notary card!"
        print("✓ Business Card button present on Notary card")

        # Click Business Card Button to open modal
        await card_btn.click()
        await page.wait_for_timeout(300)

        card_modal = page.locator('#notary-business-card-modal')
        assert not await card_modal.evaluate("el => el.classList.contains('hidden')"), "Business Card modal did not open!"
        print("✓ Business card modal opened successfully")

        # Verify modal image and contact details
        card_img = await page.locator('#modal-business-card-img').get_attribute('src')
        assert "kartu_nama_dea_cheryna.jpg" in card_img, f"Unexpected card image: {card_img}"
        
        modal_text = await card_modal.inner_text()
        assert "Dea Cheryna, S.H., M.Kn." in modal_text
        assert "0811 187 2012" in modal_text or "0811-187-2012" in modal_text
        assert "notaris.deacheryna@yahoo.com" in modal_text
        assert "Grand Wisata" in modal_text
        print("✓ Business card details verified: Image, WhatsApp (0811 187 2012), Email, and Office Address")

        # Close Business card modal
        await page.evaluate("() => window.closeNotaryBusinessCardModal()")
        await page.wait_for_timeout(200)
        assert await card_modal.evaluate("el => el.classList.contains('hidden')"), "Modal should close"
        print("✓ Business card modal closed cleanly")

        # 5. Check no JS runtime errors
        real_errors = [e for e in errors if 'favicon' not in e]
        assert len(real_errors) == 0, f"Page errors: {real_errors}"

        await browser.close()
        print(">>> ALL 3 REQUIREMENTS VERIFIED AND PASSED 100%! <<<")

if __name__ == '__main__':
    asyncio.run(main())
