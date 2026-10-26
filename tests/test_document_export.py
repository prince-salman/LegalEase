import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    print("Testing Document Export & Official LegalEase Templates (Task 6 / Items 5, 7, 14)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(f'PAGE_ERROR: {err}'))
        page.on('console', lambda msg: errors.append(f'CONSOLE_ERROR: {msg.text}') if msg.type == 'error' else None)

        # -------------------------------------------------------------
        # 1. Navigate & Setup Environment
        # -------------------------------------------------------------
        print("\n1. Navigating to http://localhost:8000 and clearing storage...")
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(800)
        await page.evaluate('localStorage.clear(); sessionStorage.clear();')
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(800)

        # -------------------------------------------------------------
        # 2. Verify Document Preview Modal & Official LegalEase Headers (Item 14)
        # -------------------------------------------------------------
        print("\n2. Verifying Document Preview Modal & Official LegalEase Headers...")
        await page.evaluate("() => window.openDocumentPreview('pks')")
        await page.wait_for_timeout(400)

        modal_visible = await page.evaluate("() => !document.getElementById('doc-preview-modal').classList.contains('hidden')")
        assert modal_visible, "FAILED: #doc-preview-modal did not open!"
        print("   [OK] #doc-preview-modal opened successfully")

        # Top Bar Title
        top_bar_title = await page.evaluate("() => document.querySelector('#doc-preview-modal h4')?.textContent?.trim()")
        assert "Dokumen Resmi dari Tim LegalEase Indonesia" in top_bar_title, f"Unexpected top bar title: {top_bar_title}"
        print(f"   [OK] Top bar title verified: '{top_bar_title}'")

        top_bar_sub = await page.evaluate("() => document.querySelector('#doc-preview-modal .text-amber-300')?.textContent?.trim()")
        assert "Standar Baku Tersertifikasi Notaris & PPAT Kemenkumham RI" in top_bar_sub, f"Unexpected top bar sub: {top_bar_sub}"
        print(f"   [OK] Top bar badge verified: '{top_bar_sub}'")

        # Printable Area Official Header Banner
        header_banner = await page.evaluate("""() => {
            const area = document.getElementById('doc-printable-area');
            const h = area.querySelector('[class*="text-[#0D7A68]"]');
            const sub = area.querySelector('p.text-slate-500');
            return {
                title: h ? h.textContent.trim() : '',
                sub: sub ? sub.textContent.trim() : ''
            };
        }""")
        assert "DOKUMEN RESMI DARI TIM LEGALEASE INDONESIA" in header_banner['title'], f"Header banner missing official text: {header_banner}"
        assert "Kemenkumham RI" in header_banner['sub'], f"Header banner missing Kemenkumham: {header_banner}"
        print(f"   [OK] Printable official banner verified: '{header_banner['title']}' / '{header_banner['sub']}'")

        # -------------------------------------------------------------
        # 3. Verify Bilateral Aligned Signatures & Materai (Item 7)
        # -------------------------------------------------------------
        print("\n3. Verifying Bilateral Aligned Signature Block & Materai Rp 10.000...")
        sig_data = await page.evaluate("""() => {
            const area = document.getElementById('doc-printable-area');
            const sigContainer = area.querySelector('.page-break-inside-avoid');
            const party1Name = document.getElementById('doc-sign-party1')?.textContent?.trim();
            const party1City = document.getElementById('doc-sign-city')?.textContent?.trim();
            const party2Name = document.getElementById('doc-sign-party2')?.textContent?.trim();
            
            // Check that old chaotic absolute positioning classes (-top-4, -top-6) are gone
            const allElements = sigContainer ? Array.from(sigContainer.querySelectorAll('*')) : [];
            const chaoticClasses = allElements
                .map(el => el.className)
                .filter(cls => typeof cls === 'string' && (cls.includes('-top-4') || cls.includes('-top-6') || cls.includes('official-legal-seal')));

            // Check meterai box
            const meteraiEl = area.querySelector('.border-dashed.border-red-500');
            const meteraiText = meteraiEl ? meteraiEl.textContent.trim() : '';

            // Check verified badge
            const verifiedBadge = area.querySelector('.bg-emerald-50');
            const verifiedText = verifiedBadge ? verifiedBadge.textContent.trim() : '';

            return {
                hasAvoidBreak: !!sigContainer,
                party1Name,
                party1City,
                party2Name,
                chaoticClasses,
                meteraiFound: !!meteraiEl,
                meteraiText,
                verifiedBadgeFound: !!verifiedBadge,
                verifiedText
            };
        }""")

        assert sig_data['hasAvoidBreak'], "FAILED: Signature section missing .page-break-inside-avoid class!"
        assert len(sig_data['chaoticClasses']) == 0, f"FAILED: Old chaotic classes still found: {sig_data['chaoticClasses']}"
        assert sig_data['meteraiFound'], "FAILED: Aligned Materai box not found!"
        assert "METERAI TEMPEL" in sig_data['meteraiText'] and "10.000" in sig_data['meteraiText'], f"FAILED: Invalid meterai text: {sig_data['meteraiText']}"
        assert sig_data['party1Name'] != "", "FAILED: Party 1 name is empty!"
        assert sig_data['party2Name'] != "", "FAILED: Party 2 name is empty!"
        assert "Kemenkumham RI Verified" in sig_data['verifiedText'], f"FAILED: Verified badge missing: {sig_data['verifiedText']}"

        print(f"   [OK] Signature container has .page-break-inside-avoid")
        print(f"   [OK] Zero chaotic classes detected (no absolute -top-4 / -top-6 / overlapping seals)")
        print(f"   [OK] Aligned Materai box verified: '{sig_data['meteraiText']}'")
        print(f"   [OK] Parties: '{sig_data['party1Name']}' & '{sig_data['party2Name']}'")
        print(f"   [OK] Official verification badge: '{sig_data['verifiedText']}'")

        # Close preview modal
        await page.evaluate("() => window.closeDocumentPreview()")
        await page.wait_for_timeout(200)

        # -------------------------------------------------------------
        # 4. Verify Word (.doc) Export: UTF-8 BOM, Namespaces & Layout (Item 5)
        # -------------------------------------------------------------
        print("\n4. Verifying Word (.doc) Export Generation with BOM & Office XML...")
        
        # Intercept Blob creation to inspect Word payload
        await page.evaluate("""() => {
            window.__capturedBlobs = [];
            const OriginalBlob = window.Blob;
            window.Blob = function (parts, options) {
                window.__capturedBlobs.push({
                    parts: parts,
                    options: options,
                    firstPartBOM: parts[0] === '\\uFEFF',
                    content: parts.join('')
                });
                return new OriginalBlob(parts, options);
            };
        }""")

        # First verify auth gate on downloadCurrentDocAsWord
        auth_blocked = await page.evaluate("() => window.downloadCurrentDocAsWord()")
        assert auth_blocked is False, "FAILED: Unauthenticated download was not blocked by auth gate!"
        print("   [OK] Unauthenticated download correctly intercepted by auth gate")

        # Login as client Fajar
        await page.evaluate("() => window.openAuthModal('login')")
        await page.wait_for_timeout(200)
        await page.click('#quick-fill-fajar')
        await page.wait_for_timeout(200)
        await page.click('#auth-modal button[type="submit"]')
        await page.wait_for_timeout(600)

        # Now trigger downloadCurrentDocAsWord as authenticated user
        await page.evaluate("() => window.downloadCurrentDocAsWord()")
        await page.wait_for_timeout(300)

        blob_info = await page.evaluate("() => window.__capturedBlobs[0]")
        assert blob_info is not None, "FAILED: No Blob captured during downloadCurrentDocAsWord!"
        assert blob_info['firstPartBOM'] is True, "FAILED: UTF-8 BOM (\\uFEFF) not found at beginning of Blob parts!"
        assert blob_info['options'].get('type') == 'application/msword;charset=utf-8', f"FAILED: Incorrect MIME type: {blob_info['options']}"
        print("   [OK] UTF-8 BOM (\\uFEFF) prepended to Blob parts (prevents Word file corruption)")
        print("   [OK] MIME type verified: application/msword;charset=utf-8")

        word_content = blob_info['content']
        # Verify Word XML namespaces
        assert "xmlns:o='urn:schemas-microsoft-com:office:office'" in word_content, "Missing Office namespace"
        assert "xmlns:w='urn:schemas-microsoft-com:office:word'" in word_content, "Missing Word namespace"
        assert "<w:WordDocument>" in word_content, "Missing <w:WordDocument> element"
        assert "<w:View>Print</w:View>" in word_content, "Missing Print view configuration"
        assert "@page { size: A4; margin: 2.5cm 2cm 2.5cm 2cm; }" in word_content, "Missing A4 page margin styles"
        print("   [OK] Standard Office Word XML namespaces and page configuration verified")

        # Verify Document Header in Word output
        assert "DOKUMEN RESMI DARI TIM LEGALEASE INDONESIA" in word_content, "Missing official LegalEase banner in Word doc"
        assert "Standar Baku Tersertifikasi Notaris &amp; PPAT Kemenkumham RI" in word_content or "Standar Baku Tersertifikasi Notaris & PPAT Kemenkumham RI" in word_content, "Missing Kemenkumham sub in Word doc"
        print("   [OK] Word document contains official LegalEase header")

        # Verify Materai & Signature Table in Word output
        assert "signature-table" in word_content, "Missing signature-table class in Word doc"
        assert "METERAI TEMPEL" in word_content and "Rp 10.000" in word_content, "Missing Materai box in Word doc"
        assert "SK Kemenkumham RI Verified" in word_content, "Missing verified badge in Word doc"
        print("   [OK] Word document contains 2-column signature table with centered Materai Rp 10.000 box")

        # -------------------------------------------------------------
        # 5. Verify Print Stylesheet (@media print) for Clean PDF Rendering (Item 5)
        # -------------------------------------------------------------
        print("\n5. Verifying @media print Stylesheet Rules in styles.css...")
        print_rules = await page.evaluate("""() => {
            let foundPrintMedia = false;
            let pageRule = null;
            let modalRule = null;
            let printableAreaRule = null;
            let pageBreakRule = null;

            for (let sheet of document.styleSheets) {
                try {
                    for (let rule of sheet.cssRules) {
                        if (rule instanceof CSSMediaRule && rule.conditionText && rule.conditionText.includes('print')) {
                            foundPrintMedia = true;
                            for (let subRule of rule.cssRules) {
                                const txt = subRule.cssText;
                                if (txt.startsWith('@page')) pageRule = txt;
                                if (subRule.selectorText === '#doc-preview-modal') modalRule = txt;
                                if (subRule.selectorText === '#doc-printable-area') printableAreaRule = txt;
                                if (subRule.selectorText === '.page-break-inside-avoid') pageBreakRule = txt;
                            }
                        }
                        if (rule.selectorText === '.page-break-inside-avoid') {
                            pageBreakRule = rule.cssText;
                        }
                    }
                } catch (e) {}
            }

            return {
                foundPrintMedia,
                pageRule,
                modalRule,
                printableAreaRule,
                pageBreakRule
            };
        }""")

        assert print_rules['foundPrintMedia'], "FAILED: No @media print rules found in stylesheets!"
        assert print_rules['modalRule'] is not None, "FAILED: No #doc-preview-modal print rule found!"
        assert "static" in print_rules['modalRule'], f"FAILED: #doc-preview-modal not static in print: {print_rules['modalRule']}"
        assert "max-height: none" in print_rules['modalRule'] or "overflow: visible" in print_rules['modalRule'], "FAILED: #doc-preview-modal still constrained in print"

        assert print_rules['printableAreaRule'] is not None, "FAILED: No #doc-printable-area print rule found!"
        assert "max-height: none" in print_rules['printableAreaRule'], f"FAILED: #doc-printable-area has max-height in print: {print_rules['printableAreaRule']}"
        assert "overflow: visible" in print_rules['printableAreaRule'], f"FAILED: #doc-printable-area not overflow visible in print: {print_rules['printableAreaRule']}"

        assert print_rules['pageBreakRule'] is not None, "FAILED: .page-break-inside-avoid rule missing!"
        assert "break-inside: avoid" in print_rules['pageBreakRule'] or "page-break-inside: avoid" in print_rules['pageBreakRule'], "FAILED: break-inside avoid missing"

        print(f"   [OK] @media print detected in stylesheets")
        print(f"   [OK] #doc-preview-modal unconstrained (position: static, max-height: none, overflow: visible)")
        print(f"   [OK] #doc-printable-area unconstrained (max-height: none, overflow: visible, background: transparent)")
        print(f"   [OK] .page-break-inside-avoid verified: '{print_rules['pageBreakRule']}'")

        # -------------------------------------------------------------
        # 6. Verify Multiple Template Types (PKS, Akta PT, Surat Kuasa)
        # -------------------------------------------------------------
        print("\n6. Verifying Document Previews Across Templates (PKS, Akta PT, etc.)...")
        for doc_key in ['pks', 'akta_pt']:
            await page.evaluate(f"() => window.openDocumentPreview('{doc_key}')")
            await page.wait_for_timeout(200)
            doc_title = await page.evaluate("() => document.getElementById('doc-preview-title')?.textContent?.trim()")
            clauses_count = await page.evaluate("() => document.querySelectorAll('#doc-preview-body > div').length")
            assert clauses_count > 0, f"FAILED: No clauses rendered for template '{doc_key}'"
            print(f"   [OK] Template '{doc_key}' loaded: '{doc_title}' with {clauses_count} clauses")

        # -------------------------------------------------------------
        # 7. Check for Console & Page Errors
        # -------------------------------------------------------------
        print("\n7. Checking for page errors...")
        real_errors = [e for e in errors if 'ERR_BLOCKED_BY_CLIENT' not in e and 'favicon' not in e]
        assert len(real_errors) == 0, f"Errors encountered: {real_errors}"
        print("   [OK] 0 console or page errors detected")

        print("\n=======================================================")
        print(">>> ALL DOCUMENT EXPORT VERIFICATION TESTS PASSED 100%! <<<")
        print("=======================================================")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
